/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { ArtifactImporter } from "./ArtifactImporter.js";
import { ArtifactTile } from "./ArtifactTile.js";
import { Modal } from "./Modal.js";
import { SettingsEditor } from "./SettingsEditor.js";

/**
 * An editor for managing the UTAM Page Object artifacts imported into the extension storage..
 */
class ImportedArtifactsEditor extends SettingsEditor {
    #labelTextElement = document.createElement("strong");
    #tileContainer = document.createElement("div");
    #artifactTiles = [];
    #confirmationModal = new Modal("confirm-delete-all");

    /**
     * The importer invoked for a UTAM Page Object artifact.
     * @type {ArtifactImporter}
     */
    artifactImporter = new ArtifactImporter();

    /**
     * Initializes a new instance of the ImportedArtifactsEditor class.
     */
    constructor() {
        super("imported-artifacts-settings");
        const editorWrapperElement = document.createElement("div");
        editorWrapperElement.appendChild(this.#createLabelElement());
        editorWrapperElement.appendChild(this.#tileContainer);
        editorWrapperElement.appendChild(this.#createButtonRow());

        this.#confirmationModal.setHeaderText("Clear all imported artifacts?");
        this.#confirmationModal.setContentText("Selecting continue will remove all imported UTAM Page Objects from all artifacts from the browser extension. Do you want to continue?");
        this.#confirmationModal.onAccepted = () => this.onClearAllImports();
        this.setEditorContent(editorWrapperElement);
    }

    #createLabelElement() {
        const labelElement = document.createElement("div");
        labelElement.classList.add("slds-form-element__label");

        labelElement.appendChild(this.#labelTextElement);
        return labelElement;
    }

    #createButtonRow() {
        const buttonRow = document.createElement("div");
        buttonRow.classList.add("slds-p-top_xx-small");

        buttonRow.appendChild(this.#createClearAllButton());
        buttonRow.appendChild(this.#configureArtifactImporter());
        return buttonRow;
    }

    #configureArtifactImporter() {
        this.artifactImporter.setButtonText("Import new artifact");
        this.artifactImporter.setButtonStyling("slds-button_brand", "slds-m-left_small");
        return this.artifactImporter.getDomElement();
    }

    #createClearAllButton() {
        const clearAllButton = document.createElement("button");
        clearAllButton.classList.add("slds-button", "slds-button_neutral");
        clearAllButton.textContent = "Clear all imported artifacts";
        clearAllButton.addEventListener("click", e => {
            e.stopPropagation();
            this.#confirmationModal.show();
        });
        return clearAllButton;
    }

    /**
     * Callback called when an artifact is removed from the browser extension storage.
     * @param {string} artifactName the file name of the artifact being removed
     */
    onRemoveArtifact = (artifactName) => { }

    /**
     * Callback called when the user requests to clear all artifacts from the browser extension storage.
     */
    onClearAllImports = () => { };

    /**
     * Sets the text of the label for the highlight style editor.
     * @param {string} labelText the text to which to set the label
     */
    setEditorLabelText(labelText) {
        this.#labelTextElement.textContent = labelText;
    }

    /**
     * Adds a tile representing an imported artifact to the editor.
     * @param {ArtifactTile} tile the tile to be added
     */
    addTile(tile) {
        this.#artifactTiles.push(tile);
        this.#tileContainer.appendChild(tile.getDomElement());
    }

    /**
     * Removes all tiles from the editor.
     */
    clearTiles() {
        this.#artifactTiles.forEach(tile => {
            this.#tileContainer.removeChild(tile.getDomElement());
        });
        this.#artifactTiles.length = 0;
    }
}

export { ImportedArtifactsEditor }
