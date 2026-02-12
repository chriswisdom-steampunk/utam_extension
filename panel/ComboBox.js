/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Class representing a combo box allowing the user to make a selection from a list of options.
 */
class ComboBox {
    #rootElement = document.createElement("div");
    #labelElement = document.createElement("label");
    #formControl = document.createElement("div");
    #selectElement = document.createElement("select");
    #selectContainer = document.createElement("div");

    /**
     * Initializes a new instance of the ComboBox class.
     * @param {string} id the ID of the combo box
     */
    constructor(id) {
        this.#rootElement.classList.add("slds-form-element");

        this.#configureLabel(id);
        this.#rootElement.appendChild(this.#labelElement);

        this.#configureFormControl(id);
        this.#rootElement.appendChild(this.#formControl);
    }

    #configureLabel(id) {
        this.#labelElement.classList.add("slds-form-element__label");
        this.#labelElement.htmlFor = id;
    }

    #configureFormControl(id) {
        this.#formControl.classList.add("slds-form-element__control");

        this.#selectContainer.classList.add("slds-select_container");

        this.#selectElement.classList.add("slds-select");
        this.#selectElement.id = id;
        this.#selectElement.addEventListener("change", (e) => {
            e.stopPropagation();
            this.onChange(e.currentTarget.value);
        });

        this.#selectContainer.appendChild(this.#selectElement);
        this.#formControl.appendChild(this.#selectContainer);
    }

    /**
     * Callback called when the user selects a value in the combo box.
     * @param {string} value the value of the combo box
     */
    onChange = (value) => { };

    /**
     * Gets the root element of the combo box.
     * @returns {Element} the root element of the combo box
     */
    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Sets the label for the combo box.
     * @param {string} labelText the text of the label for the combo box
     */
    setLabelText(labelText) {
        this.#labelElement.textContent = labelText;
    }

    /**
     * Adds additional classes to the style of the label of the combo box.
     * @param {string[]} additionalStyles additional classes to add to the style of the label of the combo box
     */
    setLabelStyling(...additionalStyles) {
        this.#labelElement.classList.add(...additionalStyles);
    }

    /**
     * Adds additional classes to the style of the container of the combo box.
     * @param {string[]} additionalStyles additional classes to add to the style of the container of the combo box
     */
    setContainerStyling(...additionalStyles) {
        this.#selectContainer.classList.add(...additionalStyles);
    }

    /**
     * Adds additional classes to the style of the select element of the combo box.
     * @param {string[]} additionalStyles additional classes to add to the style of the select element of the combo box
     */
    setSelectStyling(...additionalStyles) {
        this.#selectElement.classList.add(...additionalStyles);
    }

    /**
     * Adds additional classes to the style of the select element of the combo box.
     * @param {string[]} additionalStyles additional classes to add to the style of the select element of the combo box
     */
    setFormControlStyling(...additionalStyles) {
        this.#formControl.classList.add(...additionalStyles);
    }

    /**
     * Adds additional classes to the style of the root element of the combo box.
     * @param {string[]} additionalStyles additional classes to add to the style of the root element of the combo box
     */
    setAdditionalStyles(...additionalStyles) {
        this.#rootElement.classList.add(...additionalStyles);
    }

    /**
     * Adds an option to the combo box.
     * @param {string} value the value of the option
     * @param {string} [displayText] the display text of the option; defaults to the value if omitted
     */
    addOption(value, displayText) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = displayText ? displayText : value;
        this.#selectElement.appendChild(option);
    }

    /**
     * Gets the value of the combo box.
     * @returns {string} the value of the combo box
     */
    getValue() {
        return this.#selectElement.value;
    }

    /**
     * Sets the value of the combo box.
     * @param {string} value the value of the combo box
     */
    setValue(value) {
        this.#selectElement.value = value;
    }
}

export { ComboBox }
