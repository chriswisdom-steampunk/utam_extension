/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * The browser extension settings stored in the extension local storage.
 */
class Settings {
    /**
     * The default format settings for the element highlighter.
     */
    static DEFAULT_HIGHLIGHTER_FORMAT_SETTINGS = {
        "borderWidth": "4px",
        "borderColor": "#FF0000",
        "borderStyle": "solid",
        "fillColor": "rgba(255, 0, 0, 0)"
    };

    /**
     * The value for the Java code output langauge.
     * @type {string}
     */
    static CODE_OUTPUT_LANGUAGE_JAVA = "java";

    /**
     * The value for the JavaScript code output langauge.
     * @type {string}
     */
    static CODE_OUTPUT_LANGUAGE_JAVASCRIPT = "javascript";

    /**
     * The default language for the generated code output.
     * @type {string}
     */
    static DEFAULT_CODE_OUTPUT_LANGUAGE = Settings.CODE_OUTPUT_LANGUAGE_JAVA;

    /**
     * The map of UTAM Page Objects stored in the browser extension storage.
     * A Map is used so as to preserve key order on insert.
     * @type {Map<string, object>}
     */
    pageObjects;

    /**
     * The file name of the Page Object artifact imported into the extension.
     */
    artifactFileName;

    /**
     * The default language used for formatting code for selected tree nodes.
     */
    defaultLanguage;

    /**
     * The number of UTAM Page Objects loaded into the extension storage.
     */
    pageObjectCount;

    /**
     * An object containing duplicate Page Objects between imported artifacts.
     */
    duplicatePageObjects;

    /**
     * The format style for the highlighter element.
     */
    highlighterFormat;

    /**
     * Asynchronously loads the settings from the extension storage.
     */
    async load() {
        const { defaultLanguage, pageObjects, highlighterFormat } = await this.#getSettings();
        this.defaultLanguage = defaultLanguage;
        this.highlighterFormat = highlighterFormat;
        this.pageObjects = pageObjects;

        this.#processLoadedPageObjects();
    }

    /**
     * Asynchronously saves the settings to the extension storage.
     */
    async save() {
        // Remove the obsolete keys from extension storage. This line can
        // be removed once we are confident most installations are updated
        // with the new schema.
        await chrome.storage.local.remove(["artifactFileName", "pageObjects"]);
        const { defaultLanguage, highlighterFormat, pageObjects } = this;
        const pageObjectArtifacts = [];
        for (const [artifactFileName, artifactContents] of pageObjects) {
            pageObjectArtifacts.push({ artifactFileName, artifactContents });
        }
        await chrome.storage.local.set({
            defaultLanguage,
            highlighterFormat,
            pageObjectArtifacts
        });
    }

    #processLoadedPageObjects() {
        // Loop through the POs loaded from storage to do two things:
        //     1. Determine the total number of POs in storage in all artifacts
        //     2. Determine which POs are duplicated between artifacts
        // Because POs are uniquely identified by URI, if two artifacts have
        // the same URI, the one residing in the artifact imported most recently
        // is the one whose definition will be used ("last imported wins"). We
        // track where the duplicate URIs occur so that we can notify the user
        // if an artifact has overridden POs in the settings UI.
        const knownPageObjectUris = {};
        const overrides = {};
        let totalPageObjectCount = 0;
        for (const [fileName, artifactPageObjects] of this.pageObjects) {
            totalPageObjectCount += Object.keys(artifactPageObjects).length;
            overrides[fileName] = {};
            for (const pageObjectUri in artifactPageObjects) {
                if (pageObjectUri in knownPageObjectUris) {
                    const existingArtifactFile = knownPageObjectUris[pageObjectUri];
                    if (pageObjectUri in overrides[existingArtifactFile]) {
                        overrides[existingArtifactFile][pageObjectUri].push(fileName);
                    } else {
                        overrides[existingArtifactFile][pageObjectUri] = [fileName];
                    }
                }
                knownPageObjectUris[pageObjectUri] = fileName;
            }
        }

        this.pageObjectCount = totalPageObjectCount;
        this.duplicatePageObjects = overrides;
    }

    #getSettings() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(["artifactFileName", "defaultLanguage", "highlighterFormat", "pageObjects", "pageObjectArtifacts"], (items) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }

                const importedArtifacts = new Map();
                if (items.artifactFileName && items.pageObjects) {
                    // If the extensions storage is using the old storage schema,
                    // map those values into the new storage schema. Note that
                    // this code can be removed at a future date, once we feel
                    // certain that all installations have been updated to the new
                    // storage schema. If not, the worst that happens is that the
                    // user has to re-import their lone PO artifact.
                    importedArtifacts.set(items.artifactFileName, items.pageObjects);
                }

                // Expand the stored POs (grouped by artifacts)
                items.pageObjectArtifacts?.forEach(artifactInfo => {
                    const { artifactFileName, artifactContents } = artifactInfo;
                    importedArtifacts.set(artifactFileName, artifactContents);
                });

                const settings = {
                    defaultLanguage: items.defaultLanguage ?? Settings.DEFAULT_CODE_OUTPUT_LANGUAGE,
                    highlighterFormat: items.highlighterFormat ?? Settings.DEFAULT_HIGHLIGHTER_FORMAT_SETTINGS,
                    pageObjects: importedArtifacts,
                };
                resolve(settings);
            });
        });
    }
}

export { Settings }
