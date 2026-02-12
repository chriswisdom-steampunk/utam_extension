/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Settings } from "../common/Settings.js";

/**
 * Abstract base class for reading a UTAM Page Object artifact.
 */
class ArtifactReader {
    #selectedFile;
    #pathPrefix;
    #uriPrefixMarker;

    /**
     * Gets or sets the file extension of Page Object declarative description files
     * within the archive. Defaults to ".utam.json".
     */
    fileExtension = ".utam.json";

    /**
     * Gets or sets the file reader that reads the artifact.
     */
    fileReader;

    /**
     * Initializes a new instance of the ArtifactReader class.
     * @param {string} selectedFile the full path and file name of the UTAM Page Object 
     *                              artifact archive to read
     * @param {string} pathPrefix the prefix within the artifact archive containing Page Object
     *                            files (e.g., "utam/" or "package/dist/")
     * @param {string} uriPrefixMarker the marker within the artifact that indicates a directory
     *                                 holding compiled Page Object files (e.g., ".class" files
     *                                 for Java or ".cjs" files for JavaScript)
     */
    constructor(selectedFile, pathPrefix, uriPrefixMarker) {
        this.#selectedFile = selectedFile;
        this.#pathPrefix = pathPrefix;
        this.#uriPrefixMarker = uriPrefixMarker;
    }

    /**
     * Reads the artifact file and returns the contents in an object.
     * @returns {object} an object where the property names are the UTAM URI of a Page Object
     *                   and the value is the JSON content of the Page Object
     */
    async readArtifactFile() {
        const archiveEntries = await this.fileReader.getEntries(this.#selectedFile);
        const pathPrefixedEntries = archiveEntries.filter(entry => this.fileReader.getEntryFileName(entry).startsWith(this.#pathPrefix));

        const uriPathPrefixes = this.#getUriPathPrefixes(pathPrefixedEntries);

        // Processes only the entries in the archive for .utam.json files.
        const pageObjects = {};
        const pageObjectEntries = pathPrefixedEntries.filter(entry => this.fileReader.getEntryFileName(entry).includes(this.fileExtension));
        for (const pageObjectEntry of pageObjectEntries) {
            const fileName = this.fileReader.getEntryFileName(pageObjectEntry).slice(this.#pathPrefix.length);
            const text = await this.fileReader.getContent(pageObjectEntry);
            if (text.length) {
                const uri = this.#getUriFromFileName(fileName, uriPathPrefixes);
                pageObjects[uri] = text;
            }
        }
        return pageObjects;
    }

    /**
     * Gets the path prefixes for determining Page Object URIs from the
     * entries in the archive, removing duplicates.
     * @param {object[]} pathPrefixedEntries the list of entries in the archive starting
     *                                       with the path prefix for the artifact type
     * @returns {string[]} an array of URI path prefixes, with all duplicates removed
     */
    #getUriPathPrefixes(pathPrefixedEntries) {
        return [...new Set(pathPrefixedEntries
            .map(entry => this.fileReader.getEntryFileName(entry).slice(this.#pathPrefix.length))
            .filter(fileEntryName => !fileEntryName.includes(this.fileExtension) && fileEntryName.includes(this.#uriPrefixMarker))
            .map(fileEntryName => fileEntryName.slice(0, fileEntryName.indexOf(this.#uriPrefixMarker)))
            .sort())];
    }

    /**
     * Generates the UTAM URI for a given Page Object from its relative path and file name within the artifact
     * @param {string} fileName the file name of the Page Object
     * @param {string[]} uriPathPrefixes an array of prefixes to match the beginnings of the file name against
     * @returns the UTAM URI of the Page Object
     */
    #getUriFromFileName(fileName, uriPathPrefixes) {
        // The filename variable will have the path and file name to the
        // JSON file. Note that this file path is stripped of directories
        // containing the module files (like "package/dist/ or "utam/".
        // We will be transforming the path to the Page Object
        // URI. This means we transform something like:
        //     utam/foo/bar/baz/quux.utam.json
        // to:
        //     utam-foo/pageObjects/bar/baz/quux
        //
        // We have a list of all prefixes that should come before "pageObjects"
        // in the URI, so we filter that list to those the path start with,
        // and sort them by length, longest first. That means that we
        // will match the longest prefix to turn into the correct UTAM
        // URI. This handles the case where the prefix should contain multiple
        // hyphens, like "utam-foo-bar/pageObjects/baz/quux".
        const matchedPrefixes = uriPathPrefixes.filter((prefix) => fileName.startsWith(prefix)).sort((a, b) => b.length - a.length);
        if (matchedPrefixes.length === 0) {
            console.log(`Found no prefix to match for ${fileName}`);
        }
        const matchedPrefix = matchedPrefixes[0];
        return fileName.replace(matchedPrefix, `utam-${matchedPrefix.replaceAll("/", "-")}/pageObjects`).replace(this.fileExtension, "");
    }
}

/**
 * Class for reading a UTAM Page Object artifact in ZIP format (includes .zip and .jar files).
 */
class ZipArtifactReader extends ArtifactReader {

    constructor(selectedFile) {
        super(selectedFile, "utam/", "/pageobjects/");

        // TODO: Change this to use an ES6 module version of zip.js.
        this.fileReader = (() => {
            return {
                getEntries(file) {
                    // ZipReader.getEntries() returns a Promise, and so can be used with await, 
                    // even though the local getEntries method is not marked as async
                    return (new zip.ZipReader(new zip.BlobReader(file))).getEntries({ "filenameEncoding": "utf-8" });
                },
                async getContent(entry) {
                    return entry.getData(new zip.TextWriter());
                },
                getEntryFileName(entry) {
                    return entry.filename;
                }
            };
        })();
    }
}

/**
 * Class for reading a UTAM Page Object artifact in tar format (includes .tar.gz and .tgz files).
 */
class TarArtifactReader extends ArtifactReader {
    constructor(selectedFile) {
        super(selectedFile, "package/dist/", "/pageObjects/");

        // TODO: Change this to use ES6 module version of untar.js.
        this.fileReader = (() => {
            return {
                async getEntries(file) {
                    // Use the Response API to get access to an ArrayBuffer representing
                    // the decompressed file.
                    const decompressedStream = file.stream().pipeThrough(new DecompressionStream("gzip"));
                    const response = new Response(decompressedStream);
                    const fileBuffer = await response.arrayBuffer();
                    return await untar(fileBuffer);
                },
                async getContent(entry) {
                    return new Promise((resolve, reject) => {
                        resolve(entry.readAsString());
                    });
                },
                getEntryFileName(entry) {
                    return entry.name;
                }
            }
        })();
    }
}

/**
 * Class that imports Page Object artifacts into the extension storage.
 */
class ArtifactImporter {
    
    #rootElement = document.createElement("div");
    #triggerElement = document.createElement("button");
    #fileUploadElement = document.createElement("input");

    /**
     * Initializes a new instance of the ArtifactImporter class.
    */
    constructor() {
        this.#rootElement.classList.add("utam-importer");
        this.#configureTriggerElement();
        this.#rootElement.appendChild(this.#triggerElement);

        this.#configureFileUploadElement();
        this.#rootElement.appendChild(this.#fileUploadElement);

        this.#fileUploadElement.addEventListener("change", async (e) => {
            await this.#importArtifact();
        });
        this.#triggerElement.addEventListener("click", (e) => {
            this.#fileUploadElement.click();
        });
    }

    #configureTriggerElement() {
        this.#triggerElement.classList.add("slds-button");
    }

    #configureFileUploadElement() {
        this.#fileUploadElement.classList.add("slds-button", "slds-hide");
        this.#fileUploadElement.type = "file";
    }

    async #importArtifact() {
        if (this.#fileUploadElement.files.length) {
            this.onImportStart();
            const selectedFile = this.#fileUploadElement.files[0];
            let pageObjects = {};
            
            if (selectedFile.name.endsWith(".jar") || selectedFile.name.endsWith(".zip")) {
                const zipArtifactReader = new ZipArtifactReader(selectedFile);
                pageObjects = await zipArtifactReader.readArtifactFile();
            } else if (selectedFile.name.endsWith(".tgz") || selectedFile.name.endsWith(".tar.gz")) {
                const tarArtifactReader = new TarArtifactReader(selectedFile);
                pageObjects = await tarArtifactReader.readArtifactFile();
            }
            await this.#storePageObjectsToLocalStorage(selectedFile.name, pageObjects);
            this.#fileUploadElement.value = "";
            this.onImportCompleted();
        }
    }

    /**
     * Clears the local browser extension storage and stores the newly imported Page Object to the same.
     * @param {string} artifactFileName the name of the artifact containing the Page Objects to be imported
     * @param {Object} pageObjects an object representing the parsed Page Objects to be stored
     */
    async #storePageObjectsToLocalStorage(artifactFileName, pageObjects) {
        const settings = new Settings();
        await settings.load();

        // A JavaScript Map object preserves insertion order, and in the case of duplicate
        // PO URIs, the definition in the most recently imported artifact is the definition
        // to be used. Therefore, if we are replacing an artifact that was already imported,
        // we should remove it from the map, then re-add it, so as to put it at the end of
        // the insertion order, ensuring it will get persisted to the extension storage in
        // the right order of the array that is stored.
        if (settings.pageObjects.has(artifactFileName)) {
            settings.pageObjects.delete(artifactFileName);
        }
        settings.pageObjects.set(artifactFileName, pageObjects);
        await settings.save();
    }

    /**
     * Callback function called when the import is starting.
     */
    onImportStart = () => { }

    /**
     * Callback function called when the import has completed.
     */
    onImportCompleted = () => { }

    /**
     * Gets the root element of the artifact importer.
     * @returns {Element} the root element of the artifact importer
     */
    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Adds additional classes to the style of the button of the importer.
     * @param {string[]} additionalStyles additional classes to add to the style of the button of the importer
     */
    setButtonStyling(...additionalStyles) {
        this.#triggerElement.classList.add(...additionalStyles);
    }

    /**
     * Sets the text of the button for the importer.
     * @param {string} buttonText the text of the button for the importer
     */
    setButtonText(buttonText) {
        this.#triggerElement.textContent = buttonText;
    }
}

export { ArtifactImporter }
