/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Icon } from "./Icon.js"

/**
 * Class for creating a modal.
 */
class Modal {
    #modalIdentifier = "modal";
    #rootElement = document.createElement("section");
    #headerTextElement = document.createElement("h1");
    #contentTextElement = document.createElement("p");
    #backdrop = document.createElement("div");
    
    /**
     * Initializes a new instance of the Modal class.
     * @param {string} modalIdentifier the ID of the modal.
     */
    constructor(modalIdentifier) {
        this.#modalIdentifier = modalIdentifier;

        this.#rootElement.classList.add("slds-modal", "slds-modal_small");
        this.#rootElement.role = "dialog";
        this.#rootElement.tabIndex = "-1";
        this.#rootElement.ariaModal = "true";
        this.#rootElement.setAttribute("aria-labelledby", `${this.#modalIdentifier}-header`);
        this.#rootElement.appendChild(this.#createModalContainer());

        this.#backdrop.classList.add("slds-backdrop");
        this.#backdrop.role = "presentation";
        
        const body = document.querySelector("body");
        body.appendChild(this.#rootElement);
        body.appendChild(this.#backdrop);
    }

    #createModalContainer() {
        const modalContainer = document.createElement("div");
        modalContainer.classList.add("slds-modal__container");

        modalContainer.appendChild(this.#createCancelAndCloseButton());
        modalContainer.appendChild(this.#createModalHeader());
        modalContainer.appendChild(this.#createModalContent());
        modalContainer.appendChild(this.#createModalFooter());

        return modalContainer;
    }

    #createCancelAndCloseButton() {
        const button = document.createElement("button");
        button.classList.add("slds-button", "slds-button_icon", "slds-modal__close", "slds-button_icon-inverse");

        const icon = new Icon("slds-button__icon", "slds-button__icon_large");
        icon.setExternalLinkPath("../img/utility-icons.svg#close");
        button.appendChild(icon.getDomElement());

        const assistiveTextSpan = document.createElement("span");
        assistiveTextSpan.classList.add("slds-assistive-text");
        assistiveTextSpan.textContent = "Cancel and close";
        button.appendChild(assistiveTextSpan);
        button.addEventListener("click", e => {
            e.stopPropagation();
            this.#cancelModal();
        });
        return button;
    }

    #createModalHeader() {
        const headerWrapper = document.createElement("div");
        headerWrapper.classList.add("slds-modal__header");

        this.#headerTextElement.classList.add("slds-modal__title", "slds-hyphenate");
        this.#headerTextElement.id = `${this.#modalIdentifier}-header`;
        headerWrapper.appendChild(this.#headerTextElement);
        return headerWrapper;
    }

    #createModalContent() {
        const contentWrapper = document.createElement("div");
        contentWrapper.classList.add("slds-modal__content", "slds-p-around_medium");
        contentWrapper.id = `${this.#modalIdentifier}-content`;
        contentWrapper.appendChild(this.#contentTextElement);
        return contentWrapper;
    }

    #createModalFooter() {
        const footerWrapper = document.createElement("div");
        footerWrapper.classList.add("slds-modal__footer");
        footerWrapper.id = `${this.#modalIdentifier}-footer`;

        const cancelButton = document.createElement("button");
        cancelButton.classList.add("slds-button", "slds-button_neutral");
        cancelButton.textContent = "Cancel";
        cancelButton.addEventListener("click", e => {
            e.stopPropagation();
            this.#cancelModal();
        });
        footerWrapper.appendChild(cancelButton);

        const continueButton = document.createElement("button");
        continueButton.classList.add("slds-button", "slds-button_brand");
        continueButton.textContent = "Continue";
        continueButton.addEventListener("click", e => {
            e.stopPropagation();
            this.hide();
            this.onAccepted();
        });
        footerWrapper.appendChild(continueButton);
        return footerWrapper;
    }

    #cancelModal() {
        this.hide();
        this.onCanceled();
    }

    /**
     * Callback function called when this modal is canceled.
     */
    onCanceled = () => { }

    /**
     * Callback function called when this modal is accepted.
     */
    onAccepted = () => { }

    /**
     * Gets the DOM element representing this modal.
     * @returns {Element} the DOM element representing this modal
     */
    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Sets the header text of this modal.
     * @param {string} headerText the text to which to set the modal header
     */
    setHeaderText(headerText) {
        this.#headerTextElement.textContent = headerText;
    }

    /**
     * Sets the content text of this modal.
     * @param {string} contentText the text to which to set the modal content
     */
    setContentText(contentText) {
        this.#contentTextElement.textContent = contentText;
    }

    /**
     * Displays this modal.
     */
    show() {
        this.#backdrop.classList.add("slds-backdrop_open");
        this.#rootElement.classList.add("slds-fade-in-open");
    }

    /**
     * Hides this modal.
     */
    hide() {
        this.#rootElement.classList.remove("slds-fade-in-open");
        this.#backdrop.classList.remove("slds-backdrop_open");
    }
}

export { Modal }
