/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Icon } from "./Icon.js";

/**
 * A pop-over element showing supplemental information as part of an overlay.
 */
class Popover {
    /**
     * Positions the callout of the on the left side of the popover, in its vertical center.
     */
    static CALLOUT_POSITION_LEFT = "left";

    /**
     * Positions the callout of the on the left side of the popover, at its top.
     */
    static CALLOUT_POSITION_LEFT_TOP = "left-top";

    /**
     * Positions the callout of the on the left side of the popover, at its bottom.
     */
    static CALLOUT_POSITION_LEFT_BOTTOM = "left-bottom";

    /**
     * Positions the callout of the on the right side of the popover, in its vertical center.
     */
    static CALLOUT_POSITION_RIGHT = "right";

    /**
     * Positions the callout of the on the right side of the popover, at its top.
     */
    static CALLOUT_POSITION_RIGHT_TOP = "right-top";

    /**
     * Positions the callout of the on the right side of the popover, at its bottom.
     */
    static CALLOUT_POSITION_RIGHT_BOTTOM = "right-bottom";

    /**
     * Positions the callout of the on the top of the popover, in its horizontal center.
     */
    static CALLOUT_POSITION_TOP = "top";

    /**
     * Positions the callout of the on the top of the popover, at its left side.
     */
    static CALLOUT_POSITION_TOP_LEFT = "top-left";

    /**
     * Positions the callout of the on the top of the popover, at its right side.
     */
    static CALLOUT_POSITION_TOP_RIGHT = "top-right";

    /**
     * Positions the callout of the on the bottom of the popover, in its horizontal center.
     */
    static CALLOUT_POSITION_BOTTOM = "bottom";

    /**
     * Positions the callout of the on the bottom of the popover, at its left side.
     */
    static CALLOUT_POSITION_BOTTOM_LEFT = "bottom-left";

    /**
     * Positions the callout of the on the bottom of the popover, at its right side.
     */
    static CALLOUT_POSITION_BOTTOM_RIGHT = "bottom-right";

    /**
     * Makes the popover a small sized popover.
     */
    static POPOVER_SIZE_SMALL = "";

    /**
     * Makes the popover a medium sized popover.
     */
    static POPOVER_SIZE_MEDIUM = "medium"

    /**
     * Makes the popover a large sized popover.
     */
    static POPOVER_SIZE_LARGE = "large"

    /**
     * Makes the popover expand to the full width.
     */
    static POPOVER_SIZE_FULL_WIDTH = "full-width"

    #rootElement = document.createElement("section");
    #closeButton = document.createElement("button");
    #bodyElement = document.createElement("div");
    #headerTextElement = document.createElement("h2");
    #bodyTextElement = document.createElement("p");

    #calloutPosition;
    #popoverSize;

    /**
     * Initializes a new instance of the Popup class.
     * @param {string} calloutPosition the position of the callout pointer for the popup
     * @param {string} size the size (small, medium, large, etc.) of the popup
     */
    constructor(calloutPosition, size = Popover.POPOVER_SIZE_SMALL) {
        this.#calloutPosition = calloutPosition ?? Popover.CALLOUT_POSITION_LEFT;
        this.#popoverSize = size === Popover.POPOVER_SIZE_SMALL ? "" : size;
        this.#configureCloseButton();
        const popoverBodyElement = this.#createBody();
        this.#configureRootElement();
        this.#rootElement.appendChild(this.#closeButton);
        this.#rootElement.appendChild(popoverBodyElement);
    }

    #configureRootElement() {
        this.#rootElement.classList.add("slds-popover", `slds-nubbin_${this.#calloutPosition}`, "slds-is-absolute", "slds-hide");
        if (this.#popoverSize) {
            this.#rootElement.classList.add(`slds-popover_${this.#popoverSize}`);
        }
        this.#rootElement.setAttribute("aria-describedby", "popover-body");
        this.#rootElement.setAttribute("aria-labelledby", "popover-header");
        this.#rootElement.role = "dialog";

        this.#rootElement.appendChild(this.#bodyElement);
    }

    #createBody() {
        const headerElement = document.createElement("header");
        headerElement.classList.add("slds-popover__header");

        this.#headerTextElement.id = "popover-header";
        this.#headerTextElement.classList.add("slds-text-heading_small");
        headerElement.appendChild(this.#headerTextElement);

        const mediaBodyElement = document.createElement("div");
        mediaBodyElement.classList.add("slds-media__body");
        mediaBodyElement.appendChild(headerElement);
        mediaBodyElement.appendChild(this.#bodyTextElement);

        const mediaElement = document.createElement("div");
        mediaElement.classList.add("slds-media");
        mediaElement.appendChild(mediaBodyElement);

        const bodyElement = document.createElement("div");
        bodyElement.id = "popover-body";
        bodyElement.classList.add("slds-popover__body");
        bodyElement.appendChild(mediaElement);

        return bodyElement;
    }

    #configureCloseButton() {
        this.#closeButton.classList.add("slds-button", "slds-button_icon", "slds-button_icon-small", "slds-float_right", "slds-popover__close");
        this.#closeButton.title = "Close Info"

        const icon = new Icon("slds-button__icon");
        icon.setExternalLinkPath("../img/utility-icons.svg#close");
        icon.getDomElement().style.transform = "none";
        this.#closeButton.appendChild(icon.getDomElement());

        const assistiveText = document.createElement("span");
        assistiveText.classList.add("slds-assistive-text");
        assistiveText.textContent = "Close";
        this.#closeButton.appendChild(assistiveText);
        this.#closeButton.addEventListener("click", e => {
            e.stopPropagation();
            this.hidePopover();
            this.onCloseClicked();
        });
    }

    #getPositionOffsets() {
        const rect = this.#rootElement.getBoundingClientRect();
        switch (this.#calloutPosition) {
            case Popover.CALLOUT_POSITION_BOTTOM:
                return { xOffset: -1 * rect.width / 2, yOffset: -1 * rect.height, nubbinWidthOffset: 0, nubbinHeightOffset: -14 };
            case Popover.CALLOUT_POSITION_BOTTOM_LEFT:
                return { xOffset: 0, yOffset: -1 * rect.height, nubbinWidthOffset: -25, nubbinHeightOffset: -14 };
            case Popover.CALLOUT_POSITION_BOTTOM_RIGHT:
                return { xOffset: -1 * rect.width, yOffset: -1 * rect.height, nubbinWidthOffset: 25, nubbinHeightOffset: -14 };
            case Popover.CALLOUT_POSITION_TOP:
                return { xOffset: -1 * rect.width / 2, yOffset: 0, nubbinWidthOffset: 0, nubbinHeightOffset: 14 };
            case Popover.CALLOUT_POSITION_TOP_LEFT:
                return { xOffset: 0, yOffset: 0, nubbinWidthOffset: -25, nubbinHeightOffset: 14 };
            case Popover.CALLOUT_POSITION_TOP_RIGHT:
                return { xOffset: -1 * rect.width, yOffset: 0, nubbinWidthOffset: 25, nubbinHeightOffset: 14 };
            case Popover.CALLOUT_POSITION_RIGHT:
                return { xOffset: -1 * rect.width, yOffset: -1 * rect.height / 2, nubbinWidthOffset: -14, nubbinHeightOffset: 0 };
            case Popover.CALLOUT_POSITION_RIGHT_TOP:
                return  { xOffset: -1 * rect.width, yOffset: 0, nubbinWidthOffset: -14, nubbinHeightOffset: -25 };
            case Popover.CALLOUT_POSITION_RIGHT_BOTTOM:
                return  { xOffset: -1 * rect.width, yOffset: -1 * rect.height, nubbinWidthOffset: -14, nubbinHeightOffset: 25 };
            case Popover.CALLOUT_POSITION_LEFT:
                return { xOffset: 0, yOffset: -1 * rect.height / 2, nubbinWidthOffset: 14, nubbinHeightOffset: 0 };
            case Popover.CALLOUT_POSITION_LEFT_TOP:
                return  { xOffset: 0, yOffset: -1 * rect.height, nubbinWidthOffset: 14, nubbinHeightOffset: -25 };
            case Popover.CALLOUT_POSITION_LEFT_BOTTOM:
                return  { xOffset: 0, yOffset: -1 * rect.height, nubbinWidthOffset: 14, nubbinHeightOffset: 25 };
        }
    }

    /**
     * Callback function called when the popover close button is clicked.
     */
    onCloseClicked = () => { }

    /**
     * Gets the root element of this popover.
     * @returns {Element} the root element of this popover
     */
    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Shows this popover
     */
    showPopover() {
        this.#rootElement.classList.remove("slds-hide");
        this.#rootElement.classList.add("slds-show");
    }

    /**
     * Hides this popover
     */
    hidePopover() {
        this.#rootElement.classList.remove("slds-show");
        this.#rootElement.classList.add("slds-hide");
        if (this.#rootElement.parentNode) {
            this.#rootElement.parentNode.removeChild(this.#rootElement);
        }
    }

    /**
     * Sets the display location of this popup, with the callout pointing to the
     * specified X and Y coordinates relative to the popover's parent element.
     * @param {number} x the X coordinate of the position
     * @param {number} y the Y coordinate of the position
     */
    setLocation(x, y) {
        const { xOffset, yOffset, nubbinWidthOffset, nubbinHeightOffset } = this.#getPositionOffsets();
        this.#rootElement.style.left = `${x + xOffset + nubbinWidthOffset}px`;
        this.#rootElement.style.top = `${y + yOffset + nubbinHeightOffset}px`;
    }

    /**
     * Sets the text in the header of this popover.
     * @param {string} text the text in the header of the popover
     */
    setHeaderText(text) {
        this.#headerTextElement.innerText = text;
    }

    /**
     * Sets the HTML in the body of this popover.
     * @param {string} text the HTML in the body of the popover
     */
    setText(text) {
        // TODO: Refactor this to allow insertion of an actual element.
        this.#bodyTextElement.innerHTML = text;
    }
}

export { Popover }