/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Icon } from "./Icon.js";

/**
 * A class representing a tile displaying information about an imported UTAM Page Object artifact.
 */
class ArtifactTile {
    #rootElement = document.createElement("div");
    #artifactTitleElement = document.createElement("h3");
    #artifactDetailElement = document.createElement("dd");
    #overwriteWarningIcon = document.createElement("span");
    #overwriteWarningText = document.createElement("span");
    #removeArtifactButtonElement = document.createElement("button");
    #removeArtifactButtonAssistiveTextElement = document.createElement("span");

    /**
     * Initializes a new instance of the ArtifactTile class.
     */
    constructor() {
        this.#rootElement.classList.add("utam-tile");
        this.#rootElement.appendChild(this.#createRemoveArtifactButton());
        this.#rootElement.appendChild(this.#createTileBody());
    }

    #createTileBody() {
        const tileBody = document.createElement("div");
        tileBody.classList.add("slds-box", "slds-m-bottom_xx-small");

        const articleElement = document.createElement("article");
        articleElement.classList.add("slds-tile", "slds-tile_board", "slds-media");
        articleElement.appendChild(this.#createIcon());
        articleElement.appendChild(this.#createTileText());
        tileBody.appendChild(articleElement);

        return tileBody;
    }

    #createIcon() {
        const icon = document.createElement("div");
        icon.classList.add("slds-media__figure");

        const containerSpan = document.createElement("span");
        containerSpan.classList.add("slds-icon_container", "slds-icon-doctype-zip");
        containerSpan.title = "Loaded UTAM Page Object artifact";

        const iconElement = new Icon("slds-icon");
        iconElement.setExternalLinkPath("../img/doctype-icons.svg#zip");
        containerSpan.appendChild(iconElement.getDomElement());
        icon.appendChild(containerSpan);

        return icon;
    }

    #createTileText() {
        const tileTextElement = document.createElement("div");
        tileTextElement.classList.add("slds-media__body");

        const titleWrapperElement = document.createElement("div");
        titleWrapperElement.classList.add("slds-grid", "slds-grid_align-spread", "slds-has-flexi-truncate");
        this.#artifactTitleElement.classList.add("slds-tile__title", "slds-truncate", "slds-text-title_bold");
        titleWrapperElement.appendChild(this.#artifactTitleElement);
        tileTextElement.appendChild(titleWrapperElement);

        const tileDetailElement = document.createElement("div");
        tileDetailElement.classList.add("slds-tile__detail");

        const descriptionListElement = document.createElement("dl");
        descriptionListElement.classList.add("slds-list_vertical", "slds-wrap");
        this.#artifactDetailElement.classList.add("slds-item_detail", "slds-truncate");
        descriptionListElement.appendChild(this.#artifactDetailElement);

        const overwriteDescriptionDetailElement = document.createElement("dd");
        overwriteDescriptionDetailElement.classList.add("slds-item_detail", "slds-truncate");

        this.#configureOverwriteWarningIcon();
        overwriteDescriptionDetailElement.appendChild(this.#overwriteWarningIcon);

        overwriteDescriptionDetailElement.appendChild(this.#overwriteWarningText);
        descriptionListElement.appendChild(overwriteDescriptionDetailElement);
        tileDetailElement.appendChild(descriptionListElement);
        tileTextElement.appendChild(tileDetailElement);
        return tileTextElement;
    }

    #configureOverwriteWarningIcon() {
        this.#overwriteWarningIcon.classList.add("slds-icon_container", "slds-m-right_xx-small", "slds-hide");
        const iconElement = new Icon("slds-icon", "slds-icon-text-warning", "slds-icon_x-small");
        iconElement.setExternalLinkPath("../img/utility-icons.svg#warning");
        this.#overwriteWarningIcon.appendChild(iconElement.getDomElement());
     }

    #createRemoveArtifactButton() {
        const closeButton = document.createElement("div");

        this.#removeArtifactButtonElement.classList.add(
            "slds-button", "slds-button_icon", "slds-button_icon-border-filled", "slds-button_icon-x-small",
            "slds-float_right", "slds-m-right_xx-small", "slds-m-top_xx-small");
        
        const closeIcon = new Icon("slds-icon", "slds-button__icon_hint", "utam-tile-close-button");
        closeIcon.setExternalLinkPath("../img/utility-icons.svg#close");
        this.#removeArtifactButtonElement.appendChild(closeIcon.getDomElement());

        this.#removeArtifactButtonAssistiveTextElement.classList.add("slds-assistive-text");
        this.#removeArtifactButtonElement.appendChild(this.#removeArtifactButtonAssistiveTextElement);
        closeButton.appendChild(this.#removeArtifactButtonElement);

        this.#removeArtifactButtonElement.addEventListener("click", e => {
            e.stopPropagation();
            this.onRemoveButtonClicked(this.getTileTitle());
        });

        return closeButton;
    }

    onRemoveButtonClicked = (artifactName) => { }

    /**
     * Gets the root element of the artifact tile.
     * @returns {Element} the root element of the artifact tile
     */
    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Gets the title text of the tile
     * @returns {string} the title text of the tile
     */
    getTileTitle() {
        return this.#artifactTitleElement.title;
    }

    /**
     * Sets the title text of the tile
     * @param {string} title the title text of the tile
     */
    setTileTitle(title) {
        this.#artifactTitleElement.title = title;
        this.#artifactTitleElement.textContent = title;
        this.#removeArtifactButtonElement.title = `Remove ${title} from extension`;
        this.#removeArtifactButtonAssistiveTextElement.textContent = `Remove ${title} from extension`;
    }

    /**
     * Gets the detail text of the tile
     * @returns {string} the detail text of the tile
     */
    getTileDetailText() {
        return this.#artifactDetailElement.title;
    }

    /**
     * Sets the detail text of the tile
     * @param {string} detailText the detail text of the tile
     */
    setTileDetailText(detailText) {
        this.#artifactDetailElement.title = detailText;
        this.#artifactDetailElement.textContent = detailText;
    }

    setWarningText(warningText) {
        this.#overwriteWarningIcon.classList.remove("slds-hide");
        this.#overwriteWarningText.textContent = warningText;
    }
}

export { ArtifactTile }
