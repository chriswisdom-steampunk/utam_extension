/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Settings } from "../common/Settings.js";
import { ArtifactTile } from "./ArtifactTile.js";
import { DefaultCodeLanguageEditor } from "./DefaultCodeLanguageEditor.js";
import { HighlightStyleEditor } from "./HighlightStyleEditor.js";
import { ImportedArtifactsEditor } from "./ImportedArtifactsEditor.js";
import { Tab } from "./TabSet.js";

/**
 * The settings tab of the main panel.
 */
class SettingsTab extends Tab {
    static SETTINGS_TAB_ID = "tab-default-settings";

    #settings = new Settings();

    #importedArtifactsEditor = new ImportedArtifactsEditor();    
    #highlightStyleEditor = new HighlightStyleEditor();
    #defaultCodeLanguageEditor = new DefaultCodeLanguageEditor();
    #settingTabElement = document.createElement("div");

    /**
     * Initializes a new instance of the SettingsTab class.
     */
    constructor() {
        super(SettingsTab.SETTINGS_TAB_ID, "Settings");
        this.setAdditionalStyling("utam-tab-content", "utam-settings-tab");
        const tabContentElement = document.createElement("div");
        tabContentElement.classList.add("slds-size_1-of-3", "slds-p-left_small");
        this.#importedArtifactsEditor.setEditorLabelText("Imported Page Object Artifacts:");
        this.#importedArtifactsEditor.artifactImporter.onImportStart = () => this.onImportStart();
        this.#importedArtifactsEditor.artifactImporter.onImportCompleted = () => this.onImportCompleted();
        this.#importedArtifactsEditor.onClearAllImports = async () => {
            this.#settings.pageObjects.clear();
            await this.#settings.save();
            this.onImportCompleted();
        };
        this.#importedArtifactsEditor.setAdditionalStyling("slds-p-top_small");
        tabContentElement.appendChild(this.#importedArtifactsEditor.getDomElement());

        this.#defaultCodeLanguageEditor.setLabelText("Default Code Output Language:");
        this.#defaultCodeLanguageEditor.onLanguageChanged = async language => {
            this.#settings.defaultLanguage = language;
            await this.#settings.save();
            await this.#settings.load();
        };
        this.#defaultCodeLanguageEditor.setAdditionalStyling("slds-p-top_x-large");
        tabContentElement.append(this.#defaultCodeLanguageEditor.getDomElement());

        this.#highlightStyleEditor.setEditorLabelText("Element Highlighter:");
        this.#highlightStyleEditor.onHighlightStyleChanged = async (highlighterStyle) => {
            this.#settings.highlighterFormat = highlighterStyle;
            await this.#settings.save();
            await this.#settings.load();
            this.onHighlightStyleChanged();
        };
        this.#highlightStyleEditor.setAdditionalStyling("slds-p-top_x-large");
        tabContentElement.appendChild(this.#highlightStyleEditor.getDomElement());
        this.#settingTabElement.appendChild(tabContentElement);
        this.addContent(this.#settingTabElement);
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
     * Callback function called when the style for the highlighter has changed.
     */
    onHighlightStyleChanged = () => { }

    /**
     * Asynchronously updates the tab with the settings from the browser extension storage.
     */
    async update() {
        await this.#settings.load();
        this.#importedArtifactsEditor.clearTiles();
        for (const [artifactFileName, artifactContents] of this.#settings.pageObjects) {
            const overrides = this.#settings.duplicatePageObjects[artifactFileName];
            const numberOfOverridenPageObjects = Object.keys(overrides).length;
            const artifactTile = new ArtifactTile();
            artifactTile.setTileTitle(artifactFileName);
            artifactTile.setTileDetailText(`${Object.keys(artifactContents).length} UTAM Page Objects`);
            if (numberOfOverridenPageObjects) {
                artifactTile.setWarningText(`${numberOfOverridenPageObjects} Page Objects are overridden by other artifacts.`)
            }
            artifactTile.onRemoveButtonClicked = async artifactName => {
                this.#settings.pageObjects.delete(artifactName);
                await this.#settings.save();
                this.onImportCompleted();
            };
            this.#importedArtifactsEditor.addTile(artifactTile);
        }
        this.#defaultCodeLanguageEditor.setSelectedLanguage(this.#settings.defaultLanguage);
        this.updateHighlighter();
    }

    /**
     * Updates the highlighter style to match the current settings.
     */
    updateHighlighter() {
        this.#highlightStyleEditor.setHighlighterStyleSettings(this.#settings.highlighterFormat);        
    }

    /**
     * Gets the default language used for formatting code in the browser extension.
     * @returns {string} the default language for formatting code
     */
    getDefaultLanguage() {
        return this.#settings.defaultLanguage;
    }
}

export { SettingsTab }
