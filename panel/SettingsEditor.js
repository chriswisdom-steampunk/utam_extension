/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Base class for an editor of settings for the browser extension.
 */
class SettingsEditor {
    #rootElement = document.createElement("div");

    /**
     * Initializes a new instance of the SettingsEditor class.
     * @param {string} editorId id of the root element of the settings editor
     */
    constructor(editorId) {
        this.#rootElement.id = editorId;
    }

    /**
     * Gets the root element of the settings editor.
     * @returns {Element} the root element of the editor
     */
    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Sets the content of the settings editor.
     * @param {Element} editorContentElement the element that contains the content of the settings editor
     */
    setEditorContent(editorContentElement) {
        this.#rootElement.appendChild(editorContentElement);
    }

    /**
     * Adds additional classes to the style of the root element of the settings editor.
     * @param {string[]} additionalStyles additional classes to add to the style of the root element of the settings editor
     */
    setAdditionalStyling(...additionalStyles) {
        this.#rootElement.classList.add(...additionalStyles);
    }

}

export { SettingsEditor }
