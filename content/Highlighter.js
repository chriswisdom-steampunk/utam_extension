/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Settings } from "../common/Settings.js";

/**
 * Class for the element highlighter showing the selected element.
 */
class Highlighter {
    #highlightElement = document.createElement('div');

    /**
     * Initializes a new instance of the Highlighter class.
     */
    constructor() {
        this.setStyle(Settings.DEFAULT_HIGHLIGHTER_FORMAT_SETTINGS);
    }

    /**
     * Sets the style of the highlighting element.
     * @param {Object} styleSettings an object describing the style settings of the highlighter element
     */
    setStyle(styleSettings) {
        this.#highlightElement.style.position = "absolute";
        this.#highlightElement.style.zIndex = 100;
        this.#highlightElement.style.pointerEvents = "none";
        if (styleSettings["borderWidth"]) {
            this.#highlightElement.style.borderWidth = styleSettings["borderWidth"];
        }
        if (styleSettings["borderColor"]) {
            this.#highlightElement.style.borderColor = styleSettings["borderColor"];
        }
        if (styleSettings["borderStyle"]) {
            this.#highlightElement.style.borderStyle = styleSettings["borderStyle"];
        }
        if (styleSettings["fillColor"]) {
            this.#highlightElement.style.backgroundColor = styleSettings["fillColor"];
        }
    }

    async loadStyleFromStorage() {
        const settings = new Settings();
        await settings.load();
        return settings.highlighterFormat;
    }

    /**
     * Removes the highlight from the currently highlighted element.
     */
    clear() {
        if (this.#highlightElement.parentNode) {
            this.#highlightElement.parentNode.removeChild(this.#highlightElement);
        }
    }

    /**
     * Highlights the requested element in the document
     * @param {Element|null} element the element in the document to highlight, or null to clear the existing highlight
     */
    highlight(element) {
        // Remove highlight via `highlight(null)`
        if(element === null) {
            this.clear();
            return;
        }
    
        const { width = 5, height = 5 } = element.getBoundingClientRect();
    
        this.#highlightElement.style.width = `${width}px`;
        this.#highlightElement.style.height = `${height}px`;

        requestAnimationFrame(() => {
            if (element.offsetParent) {
                element.offsetParent.appendChild(this.#highlightElement);
                const left = `${element.offsetLeft + (width - this.#highlightElement.offsetWidth) / 2}px`;
                const top = `${element.offsetTop + (height - this.#highlightElement.offsetHeight) / 2}px`;
                this.#highlightElement.style.left = left;
                this.#highlightElement.style.top = top;
            }
        });
    
    }
}

export default Highlighter;
