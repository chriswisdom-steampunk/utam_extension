/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Settings } from "../common/Settings.js";
import { ColorOpacitySlider } from "./ColorOpacitySlider.js";
import { ColorPicker } from "./ColorPicker.js"
import { ComboBox } from "./ComboBox.js";
import { SettingsEditor } from "./SettingsEditor.js";

/**
 * Class representing an editor for the style of the highlighter element.
 */
class HighlightStyleEditor extends SettingsEditor {
    #demoElement = document.createElement("div");
    #highlighter = document.createElement("div");
    #labelTextElement = document.createElement("strong");
    #highlightBorderColorPicker = new ColorPicker("highlight-border");
    #highlightFillColorPicker = new ColorPicker("highlight-fill-color");
    #highlightFillColorOpacitySlider = new ColorOpacitySlider();
    #borderStyleCombo = new ComboBox("border-style-combo");
    #borderWidthCombo = new ComboBox("border-width-combo");
    #highlighterStyleSettings = Settings.DEFAULT_HIGHLIGHTER_FORMAT_SETTINGS;

    /**
     * Initializes a new instance of the HighlightStyleEditor class.
     */
    constructor() {
        super("highlight-settings");
        const editorWrapperElement = document.createElement("div");
        this.#highlighter.style.position = "absolute";
        this.#highlighter.style.zIndex = 100;
        this.#highlighter.style.pointerEvents = "none";

        editorWrapperElement.appendChild(this.#createLabelElement());

        this.#configureDemoElement();
        editorWrapperElement.appendChild(this.#demoElement);

        editorWrapperElement.appendChild(this.#createGrid());
        this.setEditorContent(editorWrapperElement);
    }

    #createLabelElement() {
        const labelElement = document.createElement("div");
        labelElement.classList.add("slds-form-element__label");

        labelElement.appendChild(this.#labelTextElement);
        return labelElement;
    }

    #configureDemoElement() {
        this.#demoElement.classList.add("slds-box", "slds-theme_shade", "slds-is-relative");
        this.#demoElement.innerText = "Sample highlighted element";
    }

    #createGrid() {
        const grid = document.createElement("div");
        grid.classList.add("slds-grid", "slds-wrap");
        grid.appendChild(this.#createBorderStyleSettings());
        grid.appendChild(this.#createFillStyleSettings());
        return grid;
    }

    #createBorderStyleSettings() {
        const borderStyleSettings = document.createElement("div");
        borderStyleSettings.classList.add("slds-col", "slds-size_1-of-2", "slds-p-right_x-small");
        borderStyleSettings.id = "border-style-settings";

        this.#configureHighlightBorderColorPicker();
        borderStyleSettings.appendChild(this.#highlightBorderColorPicker.getRootElement());

        this.#configureBorderStyleCombo();
        borderStyleSettings.appendChild(this.#borderStyleCombo.getDomElement());

        this.#configureBorderWidthCombo();
        borderStyleSettings.appendChild(this.#borderWidthCombo.getDomElement());

        return borderStyleSettings;
    }

    #configureHighlightBorderColorPicker() {
        this.#highlightBorderColorPicker.setLabel("Border Color");
        this.#highlightBorderColorPicker.onWorkingColorUpdated = (color) => {
            this.#highlighter.style.borderColor = color.toHexString();
        };
        this.#highlightBorderColorPicker.onSelectionCanceled = () => {
            this.#highlighter.style.borderColor = this.#highlighterStyleSettings["borderColor"];
        };
        this.#highlightBorderColorPicker.onSelectionConfirmed = (color) => {
            this.#highlighterStyleSettings["borderColor"] = color.toHexString();
            this.onHighlightStyleChanged(this.#highlighterStyleSettings);
        };
    }

    #configureBorderStyleCombo() {
        this.#borderStyleCombo.setLabelText("Border Style");
        ["none", "solid", "dotted", "dashed"].forEach(style => this.#borderStyleCombo.addOption(style));
        this.#borderStyleCombo.onChange = value => {
            this.#highlighter.style.borderStyle = value;
            this.#highlighterStyleSettings["borderStyle"] = value;
            this.onHighlightStyleChanged(this.#highlighterStyleSettings);
        };
    }

    #configureBorderWidthCombo() {
        this.#borderWidthCombo.setLabelText("Border Width");
        ["1px", "2px", "3px", "4px", "5px", "6px", "7px", "8px"].forEach(width => this.#borderWidthCombo.addOption(width));
        this.#borderWidthCombo.onChange = value => {
            this.#highlighter.style.borderWidth = value;
            this.#highlighterStyleSettings["borderWidth"] = value;
            this.onHighlightStyleChanged(this.#highlighterStyleSettings);
        };
    }

    #createFillStyleSettings() {
        const fillStyleSettings = document.createElement("div");
        fillStyleSettings.classList.add("slds-col", "slds-size_1-of-2", "slds-p-left_x-small");
        fillStyleSettings.id = "fill-style-settings";

        this.#configureHighlightFillColorPicker();
        fillStyleSettings.appendChild(this.#highlightFillColorPicker.getRootElement());

        this.#configureHighlightFillOpacitySlider();
        fillStyleSettings.appendChild(this.#highlightFillColorOpacitySlider.getDomElement());
        return fillStyleSettings;
    }

    #configureHighlightFillColorPicker() {
        this.#highlightFillColorPicker.setLabel("Fill Color");
        this.#highlightFillColorPicker.onWorkingColorUpdated = (color) => {
            this.#highlighter.style.backgroundColor = this.#getFillColorValue(color, this.#highlightFillColorOpacitySlider.getValue());
        };
        this.#highlightFillColorPicker.onSelectionCanceled = () => {
            this.#highlighter.style.backgroundColor = this.#highlighterStyleSettings["fillColor"];
        };
        this.#highlightFillColorPicker.onSelectionConfirmed = (color) => {
            this.#highlighterStyleSettings["fillColor"] = this.#getFillColorValue(color, this.#highlightFillColorOpacitySlider.getValue());
            this.onHighlightStyleChanged(this.#highlighterStyleSettings);
        };
     }

    #configureHighlightFillOpacitySlider() {
        this.#highlightFillColorOpacitySlider.onInput = (value) => {
            const highlightFillColor = this.#getFillColorValue(this.#highlightFillColorPicker.getSelectedColor(), value);
            this.#highlighter.style.backgroundColor = highlightFillColor;
        }
        this.#highlightFillColorOpacitySlider.onChange = (value) => {
            const highlightFillColor = this.#getFillColorValue(this.#highlightFillColorPicker.getSelectedColor(), value);
            this.#highlighterStyleSettings["fillColor"] = highlightFillColor;
            this.onHighlightStyleChanged(this.#highlighterStyleSettings);
        }
    }

    #getFillColorValue(color, opacity) {
        return `rgba(${color.red}, ${color.green}, ${color.blue}, ${opacity})`;
    }

    #hideHighlighter() {
        if (this.#highlighter.parentNode) {
            this.#highlighter.parentNode.removeChild(this.#highlighter);
        }
    }

    #showHighlighter() {
        const element = this.#demoElement;

        const width = element.offsetWidth ?? 5;
        const height = element.offsetHeight ?? 5;
        this.#highlighter.style.width = `${width}px`;
        this.#highlighter.style.height = `${height}px`;

        element.appendChild(this.#highlighter);

        this.#highlighter.style.left = "0px";
        this.#highlighter.style.top = "0px";
    }

    /**
     * Callback called when the highlighter style settings have changed.
     * @param {Object} highlightStyle the object representing the updated highlighter style settings
     */
    onHighlightStyleChanged = (highlightStyle) => { }

    /**
     * Gets the style settings for the highlighter element.
     * @returns {Object} the style settings as an object
     */
    getHighlighterStyleSettings() {
        return this.#highlighterStyleSettings;
    }

    /**
     * Sets the text of the label for the highlight style editor.
     * @param {string} labelText the text to which to set the label
     */
    setEditorLabelText(labelText) {
        this.#labelTextElement.textContent = labelText;
    }

    /**
     * Sets the style settings for the highlighter element.
     * @param {Object} styleSettings the style settings for the highlighter element
     */
    setHighlighterStyleSettings(styleSettings) {
        this.#highlighterStyleSettings = styleSettings;
        this.#hideHighlighter();
        if (styleSettings["borderStyle"]) {
            this.#borderStyleCombo.setValue(styleSettings["borderStyle"]);
            this.#highlighter.style.borderStyle = styleSettings["borderStyle"];
        }
        if (styleSettings["borderColor"]) {
            this.#highlightBorderColorPicker.setSelectedColor(styleSettings["borderColor"]);
            this.#highlighter.style.borderColor = styleSettings["borderColor"];
        }
        if (styleSettings["borderWidth"]) {
            this.#borderWidthCombo.setValue(styleSettings["borderWidth"]);
            this.#highlighter.style.borderWidth = styleSettings["borderWidth"];
        }
        if (styleSettings["fillColor"]) {
            // Note: This regexp is not robust enough to handle all possible
            // combinations of values for rgb() and rgba(). Since the user
            // is not entering in arbitrary values for that, and all values
            // are managed by the browser extension, this should be fine.
            // However, if we ever find ourselves in a place where the user
            // is entering arbitrary values for this setting, we will need
            // to make this more robust.
            const RGB_REG_EXP = /^rgba?\(\s*(\d*.?\d+)\s*,\s*(\d*.?\d+)\s*,\s*(\d*.?\d+)(?:\s*,\s*(\d*.?\d+))?\s*\)$/i;
            const matches = styleSettings["fillColor"].match(RGB_REG_EXP);
            if (matches) {
                const [red, green, blue] = matches.slice(1, 4).map(match => parseInt(match).toString(16).padStart(2, "0").toUpperCase());
                const alpha = matches.length > 4 ? parseFloat(matches[4]) : 0;
                this.#highlightFillColorPicker.setSelectedColor(`#${red}${green}${blue}`);
                this.#highlightFillColorOpacitySlider.setValue(alpha.toString());
                this.#highlighter.style.backgroundColor = styleSettings["fillColor"];
            } else {
                this.#highlightFillColorPicker.setSelectedColor(`#FF0000`);
                this.#highlighter.style.backgroundColor = "rgba(255, 0, 0, 0)";
            }
        }
        this.#showHighlighter();
    }
}

export { HighlightStyleEditor }
