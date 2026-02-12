/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Class for creating an SVG-based icon element.
 */
class Icon {
    #rootElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    #useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");

    /**
     * Initializes a new instance of the Icon class.
     * @param  {...string} iconStyles a list of CSS classes to be applied to the SVG element
     */
    constructor(...iconStyles) {
        if (iconStyles) {
            this.#rootElement.classList.add(...iconStyles);
        }
        this.#rootElement.ariaHidden = "true";
        this.#rootElement.appendChild(this.#useElement);
    }

    /**
     * Gets the root element of the icon object.
     * @returns {Element} the root element of the icon object
     */
    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Sets the file path, including ID within the file if any, of the external SVG file to import as the icon image.
     * @param {string} iconFilePath the file path, including ID within the file if any, of the SVG file to import
     */
    setExternalLinkPath(iconFilePath) {
        this.#useElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", iconFilePath);
    }
}

export { Icon }
