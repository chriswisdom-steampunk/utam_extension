/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Icon } from "./Icon.js";

/**
 * Base class for argument type-specific argument editors.
 */
class ArgumentEditor {
    #domElement

    /**
     * Initializes a new instance of the ArgumentEditor class.
     * @param {string} argName the name of the argument this editor edits
     * @param {Element} domElement the DOM element representing the argument editor
     */
    constructor(argName, domElement) {
        const elementId = `arg-element-${argName}`;
        this.#domElement = domElement;
        this.#domElement.id = elementId;
    }

    /**
     * Gets the DOM element representing the argument editor.
     * @returns {Element} the DOM element representing the argument editor
     */
    getDomElement() {
        return this.#domElement;
    }

    /**
     * Gets the value of the argument editor.
     * @returns {string} the value of the argument editor
     */
    getValue() {
        return this.#domElement.value;
    }

    /**
     * Sets the value of the argument editor.
     * @param {string} value the value to be set
     */
    setValue(value) {
        this.#domElement.value = value;
    }
}

/**
 * Creates a text box editor for editing text arguments.
 */
class TextArgumentEditor extends ArgumentEditor {
    /**
     * Initializes a new instance of the TextArgumentEditor class.
     * @param {string} argName the name of the argument this editor edits
     */
    constructor(argName) {
        const domElement = document.createElement("input");
        domElement.classList.add("slds-input");
        super(argName, domElement);
    }
}

/**
 * Creates a text box editor for editing numeric arguments.
 */
class NumberArgumentEditor extends ArgumentEditor {
    /**
     * Initializes a new instance of the NumberArgumentEditor class.
     * @param {string} argName the name of the argument this editor edits
     */
    constructor(argName) {
        const domElement = document.createElement("input");
        domElement.type = "number";
        domElement.classList.add("slds-input");
        super(argName, domElement);
    }
}

/**
 * Creates a list control for editing the type of Page Object when a container argument is selected.
 */
class ContainerPageObjectArgumentEditor extends ArgumentEditor {
    #selectedOptionIconElement
    #inputElement
    #listBoxElement
    #triggerElement

    /**
     * Initializes a new instance of the ContainerPageObjectArgumentEditor class.
     * @param {string} argName the name of the argument this editor edits
     * @param {Array} pageObjectTypeList the list of Page Object types
     */
    constructor(argName, pageObjectTypeList) {
        const domElement = document.createElement("div");
        domElement.setAttribute("data-selected-value", "");
        domElement.classList.add("slds-combobox_container");
        super(argName, domElement);

        this.#selectedOptionIconElement = this.#createIcon("check");
        this.#selectedOptionIconElement.classList.add("slds-icon-utility-check", "slds-current-color")

        const idPrefix = "page-object-type";
        this.#inputElement = this.#createTextBox(idPrefix);
        this.#listBoxElement = this.#createListBox(idPrefix, pageObjectTypeList);
        this.#triggerElement = this.#createTriggerElement();
        domElement.appendChild(this.#triggerElement);
    }

    #createIcon(imageId) {
        const iconElement = document.createElement("span");
        iconElement.classList.add("slds-icon_container");

        const icon = new Icon("slds-icon", "slds-icon_x-small", "slds-icon-text-default");
        icon.setExternalLinkPath(`../img/utility-icons.svg#${imageId}`);
        iconElement.appendChild(icon.getDomElement());
        return iconElement;
    }

    #createListBox(idPrefix, pageObjectTypeList) {
        const listBoxElement = document.createElement("div");
        listBoxElement.classList.add("slds-dropdown", "slds-dropdown_length-5", "slds-dropdown_fluid");
        listBoxElement.id = `${idPrefix}-listbox`;
        listBoxElement.role = "listbox";

        const optionsList = this.#createOptionsList(pageObjectTypeList);
        listBoxElement.appendChild(optionsList);
        return listBoxElement;
    }

    #createOptionsList(pageObjectTypeList) {
        const unorderedList = document.createElement("ul");
        unorderedList.classList.add("slds-listbox", "slds-listbox_vertical");
        unorderedList.role = "presentation";
    
        pageObjectTypeList.forEach((contentType, index) => {
            const listItem = document.createElement("li");
            listItem.classList.add("slds-listbox__item", "slds-show");
            listItem.role = "presentation";
            listItem.setAttribute("data-page-object-uri", contentType.uri);

            const option = this.#createOption(index, contentType);
            listItem.appendChild(option);
            listItem.addEventListener("click", (e) => {
                e.stopPropagation();
                const clickTarget = e.currentTarget;
                this.#setSelectedOption(clickTarget);
                this.#collapseList();
            });

            unorderedList.appendChild(listItem);
        });
        return unorderedList;
    }

    #createOption(counter, contentType) {
        const option = document.createElement("div");
        option.classList.add("slds-media", "slds-listbox__option", "slds-listbox__option_plain", "slds-media_small");
        option.id = `option${counter}`;
        option.role = "option";
        option.setAttribute("data-page-object-uri", contentType.uri);

        const optionIcon = document.createElement("span");
        optionIcon.classList.add("slds-media__figure", "slds-listbox__option-icon");
        option.appendChild(optionIcon);

        const optionBody = document.createElement("span");
        optionBody.classList.add("slds-media__body");

        const optionTextElement = document.createElement("span");
        optionTextElement.classList.add("slds-truncate");
        optionTextElement.title = contentType.displayName;
        optionTextElement.textContent = contentType.displayName;
        optionBody.appendChild(optionTextElement);

        option.appendChild(optionBody);
        return option;
    }

    #createTextBox(idPrefix) {
        const inputElement = document.createElement("input");
        inputElement.classList.add("slds-input", "slds-combobox__input");
        inputElement.id = `${idPrefix}-combobox`;
        inputElement.type = "text";
        inputElement.role = "combobox";
        inputElement.placeholder = "Select a Page Object type";
        inputElement.autocomplete = "off";
        inputElement.ariaAutoComplete = "list";
        inputElement.ariaExpanded = "false";
        inputElement.ariaHasPopup = "listbox";
        inputElement.setAttribute("aria-controls", `#${idPrefix}-listbox`);
        inputElement.addEventListener("keyup", (e) => {
            e.stopPropagation();
            const keyTarget = e.currentTarget;
            const typeValue = keyTarget.value;
            switch (e.key) {
                case "ArrowDown":
                case "ArrowUp":
                    this.#navigateOptionsWithKeyboard(e.key);
                    break;
                case "Escape":
                    if (this.#isListExpanded()) {
                        this.#collapseList();
                    }
                    this.setValue(this.getValue());
                    break;
                case "Enter":
                    if (this.#isListExpanded()) {
                        this.#setSelectedOption(this.#listBoxElement.querySelector("li .slds-is-selected"));
                        this.#collapseList();
                    } else {
                        this.#expandList();
                    }
                    break;
                default:
                    if (!e.altKey && !e.ctrlKey && !e.metaKey) {
                        this.#filterOptionsList(typeValue);
                    }
                    break;                   
            }
        });
        return inputElement;
    }

    #createTriggerElement() {
        const triggerElement = document.createElement("div");
        triggerElement.classList.add("slds-combobox", "slds-dropdown-trigger", "slds-dropdown-trigger_click");

        const inputWrapperElement = document.createElement("div");
        inputWrapperElement.classList.add("slds-combobox__form-element", "slds-input-has-icon", "slds-input-has-icon_right");
        inputWrapperElement.role = "none";
        inputWrapperElement.appendChild(this.#inputElement);

        const iconElement = this.#createIcon("search");
        iconElement.classList.add("slds-icon-utility-search", "slds-input__icon", "slds-input__icon_right");
        inputWrapperElement.appendChild(iconElement);        
        triggerElement.appendChild(inputWrapperElement);

        triggerElement.addEventListener("click", (e) => {
            e.stopPropagation();
            if (this.#isListExpanded()) {
                this.#collapseList();
            } else {
                this.#expandList();
            }
        });

        triggerElement.appendChild(this.#listBoxElement);
        return triggerElement;
    }

    #navigateOptionsWithKeyboard(key) {
        const selectedOption = this.#listBoxElement.querySelector(`li .slds-listbox__option.slds-is-selected`);
        if (key === "ArrowDown" && !this.#isListExpanded()) {
            this.#expandList();
            if (selectedOption) {
                selectedOption.scrollIntoView();
            }
            return;
        }
        let optionToSelect;
        if (selectedOption) {
            const selectedListItem = selectedOption.parentNode;
            if (key === "ArrowDown") {
                optionToSelect = this.#moveToNextListItem(selectedListItem);
            } else {
                optionToSelect = this.#moveToPreviousListItem(selectedListItem);
            }
            selectedOption.classList.remove("slds-is-selected", "slds-has-focus");
            selectedOption.ariaSelected = "false";
        } else {
            optionToSelect = this.#listBoxElement.querySelector("li .slds-listbox__option");
        }
        this.#selectOption(optionToSelect);
        this.#listBoxElement.querySelectorAll(`li.slds-show  .slds-listbox__option .slds-truncate`).forEach(opt => {
            this.#clearHighlightedText(opt);
        });
    }

    #moveToNextListItem(selectedListItem) {
        // Move to the next list item, skipping over any list items that are hidden
        let itemToSelect = selectedListItem.nextSibling;
        while (itemToSelect?.classList.contains("slds-hide"))
        {
            itemToSelect = itemToSelect.nextSibling;
        }
        if (!itemToSelect) {
            // We arrowed down past the end of the list, so make the
            // next list item the first visible item in the list.
            itemToSelect = this.#listBoxElement.querySelector("li:not(.slds-hide)");
        }
        return itemToSelect.querySelector(".slds-listbox__option");
    }

    #moveToPreviousListItem(selectedListItem) {
        // Move to the previous list item, skipping over any list items that are hidden
        let itemToSelect = selectedListItem.previousSibling;
        while (itemToSelect?.classList.contains("slds-hide"))
        {
            itemToSelect = itemToSelect.previousSibling;
        }
        if (!itemToSelect) {
            // We arrowed up past the beginning of the list, so make the
            // next list item the last visible item in the list.
            itemToSelect = [...this.#listBoxElement.querySelectorAll("li.slds-show")].pop();
        }
        return itemToSelect.querySelector(".slds-listbox__option");
    }

    #selectOption(optionToSelect) {
        const optionDisplayElement = optionToSelect.querySelector("span.slds-truncate");
        optionToSelect.classList.add("slds-is-selected", "slds-has-focus");
        optionToSelect.ariaSelected = "true";
        this.#inputElement.setAttribute("aria-activedescendant", optionToSelect.id);
        this.#inputElement.value = optionDisplayElement.title;
        optionToSelect.scrollIntoView();
    }

    #filterOptionsList(filterValue) {
        if (!filterValue.length) {
            this.#clearOptionsListFilter();
            return;
        }
        [...this.#listBoxElement.querySelectorAll("li")].forEach(listItem => {
            const option = listItem.querySelector("div.slds-listbox__option span.slds-truncate")

            if (!option.title.toLowerCase().includes(filterValue.toLowerCase())) {
                this.#hideListItem(listItem);
                this.#clearHighlightedText(option);
            } else {
                this.#showListItem(listItem);
                this.#highlightMatchedText(option, filterValue);
            }
        });
    }

    #clearOptionsListFilter() {
        [...this.#listBoxElement.querySelectorAll("li")].forEach(item => {
            const option = item.querySelector("div.slds-listbox__option span.slds-truncate")
            this.#clearHighlightedText(option);
            this.#showListItem(item);
        });
    }

    #clearSelectedOption() {
        [...this.#listBoxElement.querySelectorAll("li .slds-is-selected")].forEach(item => {
            item.classList.remove("slds-is-selected");
            item.ariaChecked = "false";
        });
    }

    #hideListItem(listItem) {
        listItem.classList.remove("slds-show");
        listItem.classList.add("slds-hide");
    }

    #showListItem(listItem) {
        listItem.classList.remove("slds-hide");
        listItem.classList.add("slds-show");
    }

    #highlightMatchedText(option, textToHighlight) {
        const lowerCaseTextToHighlight = textToHighlight.toLowerCase();
        const textToHighlightRegExp = new RegExp(textToHighlight, 'i');
        
        if (option.title.toLowerCase().includes(lowerCaseTextToHighlight)) {
            option.innerHTML = option.title.replace(textToHighlightRegExp, (match) => `<mark>${match}</mark>`);
        }
    }

    #clearHighlightedText(option) {
        const markElement = option.querySelector("mark");
        if (markElement) {
            markElement.remove();
            option.innerHTML = option.title;
        }
    }

    #setSelectedOption(optionElement) {
        let value = "";
        let displayText = "";

        // Clear existing selected item, including selected icon and
        // any filtered (hidden) options due to type-ahead.
        this.#clearSelectedOption();
        this.#selectedOptionIconElement.parentNode?.removeChild(this.#selectedOptionIconElement);
        this.#clearOptionsListFilter();

        // If a selected list item was passed in, set the class list to
        // indicate selected, and add the selected icon, then extract the
        // value and display text.
        if (optionElement) {
            optionElement.classList.add("slds-is-selected");
            optionElement.ariaChecked = "true";
            optionElement.querySelector(".slds-listbox__option-icon").appendChild(this.#selectedOptionIconElement);
            value = optionElement.getAttribute("data-page-object-uri");
            displayText = optionElement.querySelector("span.slds-truncate").title;
        }

        // Update the text box and the attribute to indicate the selected option.
        this.#inputElement.value = displayText;
        this.getDomElement().setAttribute("data-selected-value", value);
    }

    #isListExpanded() {
        return this.#triggerElement.classList.contains("slds-is-open");
    }

    #expandList() {
        this.#inputElement.ariaExpanded = "true";
        this.#triggerElement.classList.add("slds-is-open");
    }

    #collapseList() {
        this.#inputElement.ariaExpanded = "false";
        this.#triggerElement.classList.remove("slds-is-open");
    }

    /**
     * Gets the display text of the selected value.
     * @returns {string} the display text of the selected value
     */
    getDisplayText() {
        return this.#inputElement.value;
    }

    /**
     * Gets the value of the selected item in the list.
     * @returns {string} the value of the selected item
     */
    getValue() {
        return this.getDomElement().getAttribute("data-selected-value");
    }

    /**
     * Sets the value of the list to the selected Page Object type.
     * @param {string} value the value to be set
     */
    setValue(value) {
        const valueElementSelector = `li .slds-listbox__option[data-page-object-uri="${value}"]`;
        const valueElement = this.#listBoxElement.querySelector(valueElementSelector);
        this.#setSelectedOption(valueElement);
    }
}

export { ContainerPageObjectArgumentEditor, NumberArgumentEditor, TextArgumentEditor }
