
/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Settings } from "../common/Settings.js";
import { SettingsEditor } from "./SettingsEditor.js";

/**
 * Class rpresenting a group of radio buttons, one of which is selected at a time.
 */
class RadioButtonGroup {
    #rootElement = document.createElement("fieldset");
    #labelElement = document.createElement("legend");
    #optionWrapper = document.createElement("div");
    #optionName;
    #radioButtons = {};

    /**
     * Initializes a new instance of the RadioButtonGroup class.
     * @param {string} optionName the name of the option set by the radio button group
     */
    constructor(optionName) {
        this.#optionName = optionName;

        this.#rootElement.classList.add("slds-form-element");

        this.#labelElement.classList.add("slds-form-element__legend", "slds-form-element__label");
        this.#rootElement.appendChild(this.#labelElement);

        this.#optionWrapper.classList.add("slds-form-element__control");
        this.#rootElement.append(this.#optionWrapper);
    }

    /**
     * Callback called when a radio button in the group is selected.
     * @param {string} value the selected value of the radio button
     */
    onRadioButtonSelected = (value) => { }

    /**
     * Gets the root element of the radio button group.
     * @returns {Element} the root element of the radio button group
     */
    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Sets the text of the label for the radio button group.
     * @param {string} labelText the text to which to set the label for the radio button group
     */
    setLabelText(labelText) {
        this.#labelElement.textContent = labelText;
    }

    /**
     * Selects the radio button having the specified value.
     * @param {string} value the value of the radio button to set as selected
     */
    setSelectedValue(value) {
        if (value in this.#radioButtons) {
            this.#radioButtons[value].checked = true;
        }
    }

    /**
     * Adds a radio button to the radio button group.
     * @param {string} value the value of the radio button to add
     * @param {string} text the text of the label for the radio button to add
     */
    addRadioButton(value, text) {
        const optionWrapper = document.createElement("span");
        optionWrapper.classList.add("slds-radio");

        const buttonId = `radio-${value.replaceAll(/\s/g, "-").toLowerCase()}`;
        const radioButton = document.createElement("input");
        radioButton.type = "radio";
        radioButton.value = value;
        radioButton.id = buttonId;
        radioButton.name = this.#optionName;
        radioButton.addEventListener("change", e => {
            e.stopPropagation;
            this.onRadioButtonSelected(e.currentTarget.value);
        });

        optionWrapper.appendChild(radioButton);
        this.#radioButtons[value] = radioButton;

        const labelElement = document.createElement("label");
        labelElement.classList.add("slds-radio__label");
        labelElement.htmlFor = buttonId;

        const fauxSpan = document.createElement("span");
        fauxSpan.classList.add("slds-radio_faux");
        labelElement.appendChild(fauxSpan);

        const labelTextSpan = document.createElement("span");
        labelTextSpan.classList.add("slds-form-element__label");
        labelTextSpan.textContent = text;
        labelElement.appendChild(labelTextSpan);
        optionWrapper.appendChild(labelElement);
        this.#optionWrapper.appendChild(optionWrapper);
    }
}

/**
 * Class representing an editor for the default language of generated code.
 */
class DefaultCodeLanguageEditor extends SettingsEditor {
    #radioButtonGroup = new RadioButtonGroup("default");

    constructor() {
        super("default-language-settings");
        this.#radioButtonGroup.addRadioButton(Settings.CODE_OUTPUT_LANGUAGE_JAVA, "Java");
        this.#radioButtonGroup.addRadioButton(Settings.CODE_OUTPUT_LANGUAGE_JAVASCRIPT, "JavaScript");
        this.#radioButtonGroup.onRadioButtonSelected = (value) => {
            this.onLanguageChanged(value);
        }
        this.setEditorContent(this.#radioButtonGroup.getDomElement());
    }

    /**
     * Callback called when the language of the editor is changed.
     * @param {string} language the language to which the editor value was set
     */
    onLanguageChanged = (language) => { }

    /**
     * Sets the text of the label of the editor.
     * @param {string} labelText the text of the label of the editor
     */
    setLabelText(labelText) {
        this.#radioButtonGroup.setLabelText(labelText);
    }

    /**
     * Sets the selected language of the editor.
     * @param {string} value the selected language of the editor
     */
    setSelectedLanguage(value) {
        this.#radioButtonGroup.setSelectedValue(value);
    }
}

export { DefaultCodeLanguageEditor }
