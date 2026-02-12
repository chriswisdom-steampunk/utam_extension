/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Icon } from "./Icon.js";
import { Tab, TabSet } from "./TabSet.js"

/**
 * Class representing a color.
 */
class Color {
    /**
     * The red component of the color.
     */
    red;

    /**
     * The green component of the color.
     */
    green;

    /**
     * The blue component of the color.
     */
    blue;

    /**
     * The hue of the color in the HSB/HSV color space.
     */
    hue;

    /**
     * The saturation of the color in the HSB/HSV color space.
     */
    saturation;

    /**
     * The brightness of the color in the HSB/HSV color space.
     */
    brightness;

    #hexToRgb(hexValue) {
        const replacer = (...args) => {
            const [
                _,
                r,
                g,
                b,
            ] = args;
    
            return '' + r + r + g + g + b + b;
        };

        const HEX_REG_EXP = /^#?(([\da-f]){3}|([\da-f]){6})$/i;    
        const rgbHexArray = hexValue
            ?.replace(HEX_REG_EXP, replacer)
            .match(/.{2}/g)
            ?.map(x => parseInt(x, 16));

        if (Array.isArray(rgbHexArray)) {
            const [red, green, blue] = rgbHexArray;
            return { red, green, blue };
        }
        throw new Error(`unable to parse hex string ${hexValue} to a color value`);
    }

    #hsbToRbg(hue, saturation, brightness) {
        const maxValue = Math.floor(brightness * 255);
        const minValue = Math.floor(maxValue * (1 - saturation));

        const deltaFactor = Math.floor((maxValue - minValue) * (1 - Math.abs(((hue / 60) % 2) - 1)));

        const result = {
            "red": 0,
            "green": 0,
            "blue": 0
        }

        if (hue >= 0 && hue < 60) {
            result["red"] = maxValue;
            result["green"] = deltaFactor + minValue;
            result["blue"] = minValue;
        } else if (hue >= 60 && hue < 120) {
            result["red"] = deltaFactor + minValue;
            result["green"] = maxValue;
            result["blue"] = minValue;
        } else if (hue >= 120 && hue < 180) {
            result["red"] = minValue;
            result["green"] = maxValue;
            result["blue"] = deltaFactor + minValue;
        } else if (hue >= 180 && hue < 240) {
            result["red"] = minValue;
            result["green"] = deltaFactor + minValue;
            result["blue"] = maxValue;
        } else if (hue >= 240 && hue < 300) {
            result["red"] = deltaFactor + minValue;
            result["green"] = minValue;
            result["blue"] = maxValue;
        } else if (hue >= 300 && hue < 360) {
            result["red"] = maxValue;
            result["green"] = minValue;
            result["blue"] = deltaFactor + minValue;
        }

        return result;
    }

    #rgbToHsb(red, green, blue) {
        const normalizedRed = red / 255;
        const normalizedGreen = green / 255;
        const normalizedBlue = blue / 255;
        const maxValue = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
        const minValue = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
        const delta = maxValue - minValue;

        const result = {
            "hue": 0,
            "saturation": 0,
            "brightness": 0
        }

        if (delta !== 0) {
            if (maxValue === normalizedRed) {
                result["hue"] = 60 * (((normalizedGreen - normalizedBlue) / delta) % 6);
            } else if (maxValue === normalizedGreen) {
                result["hue"] = 60 * (((normalizedBlue - normalizedRed) / delta) + 2);
            } else if (maxValue === normalizedBlue) {
                result["hue"] = 60 * (((normalizedRed - normalizedGreen) / delta) + 4);
            }
        }

        result["brightness"] = maxValue;
        result["saturation"] = maxValue === 0 ? 0 : delta / maxValue;
        return result;
    }

    #colorComponentToHex(componentValue) {
        return componentValue.toString(16).padStart(2, "0").toUpperCase()
    }

    /**
     * Creates a Color instance from a hex string.
     * @param {string} hexValue 
     * @returns {Color|null} the Color represented by the hex string, or null if the string is invalid
     */
    static fromHex(hexValue) {
        const color = new Color();
        const rgb = color.#hexToRgb(hexValue);

        color.red = rgb["red"];
        color.green = rgb["green"];
        color.blue = rgb["blue"];

        const { hue, saturation, brightness } = color.#rgbToHsb(color.red, color.green, color.blue);
        color.hue = hue;
        color.saturation = saturation;
        color.brightness = brightness;
        return color;
    }

    /**
     * Creates a Color instance from red, green, and blue values.
     * @param {number} red the red component of the color.
     * @param {number} green the green component of the color.
     * @param {number} blue the red component of the color.
     * @returns {Color|null} the Color represented by the red, green, and blue values, or null if any of the values are invalid
     */
    static fromRGB(red, green, blue) {
        if (red < 0 || red > 255 || green < 0 || green > 255 || blue < 0 || blue > 255) {
            throw new Error(`red (${red}), green (${green}), and blue (${blue}) values must all be between 0 and 255 inclusive`);
        }

        const color = new Color();
        color.red = red;
        color.green = green;
        color.blue = blue;

        const { hue, saturation, brightness } = color.#rgbToHsb(red, green, blue);
        color.hue = hue;
        color.saturation = saturation;
        color.brightness = brightness;
        return color;
    }

    /**
     * Creates a Color instance from hue, luminance, and brightness values.
     * @param {number} hue the hue component of the color, from 0 to 360.
     * @param {number} luminance the luminance component of the color, a decimal value from 0 to 1.
     * @param {number} brightness the red brightness of the color, a decimal value from 0 to 1.
     * @returns {Color|null} the Color represented by the hue, luminance, and brightness values, or null if any of the values are invalid
     */
    static fromHSB(hue, saturation, brightness) {
        if (hue < 0 || hue > 360 || saturation < 0 || saturation > 1 || brightness < 0 || brightness > 1) {
            throw new Error(`hue value (${hue}) must be between 0 and 360, and saturation (${saturation} and brightness (${brightness}) must be between 0 and 1)`);
        }
        const color = new Color();
        color.hue = hue;
        color.saturation = saturation;
        color.brightness = brightness;
        
        const { red, green, blue } = color.#hsbToRbg(hue, saturation, brightness);
        color.red = red;
        color.green = green;
        color.blue = blue;
        return color;
    }

    /**
     * Gets the hex string representing this color.
     * @returns {string} the color representation as a hex string
     */
    toHexString() {
        return `#${this.#colorComponentToHex(this.red)}${this.#colorComponentToHex(this.green)}${this.#colorComponentToHex(this.blue)}`;
    }

    /**
     * Gets the RGB representation of this color, as used in CSS properties.
     * @returns {string} the color representation as a CSS RGB definition
     */
    toRgbString() {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
    }

    /**
     * Gets the HSL representation of this color, as used in CSS properties.
     * @returns {string} the color representation as a CSS HSL definition
     */
    toHslString() {
        const luminance = this.brightness * (1 - (this.saturation / 2));
        const s = this.saturation === 0 || this.saturation === 1 ? 0 : (this.brightness - luminance) / Math.min(luminance, 1 - luminance);
        return `hsl(${this.hue}, ${s * 100}%, ${luminance * 100}%)`;
    }
}

/**
 * Class to create a color picker.
 */
class ColorPicker {
    #rootElement = document.createElement("div");
    #tabs = new TabSet();
    #summaryLabel = document.createElement("label");
    #summarySwatch = document.createElement("span");
    #triggerButton = document.createElement("button");
    #summaryHexInput = document.createElement("input");
    #customHueSliderInput = document.createElement("input");
    #customRange = document.createElement("div");
    #customRangeIndicator = document.createElement("a");
    #customPreviewSwatch = document.createElement("span");
    #customHexValueInput = document.createElement("input");
    #customRedValueInput = document.createElement("input");
    #customGreenValueInput = document.createElement("input");
    #customBlueValueInput = document.createElement("input");
    #colorSelectorPopover = document.createElement("section");
    #pickerId
    #defaultColors
    #selectedColor
    #workingColor

    /**
     * Initializes a new instance of the ActionsTab class.
     * @param {string} pickerId the ID prefix of the color picker
     * @param {string} selectedColorValue the hex value of the initial color
     * @param {Array} defaultColors an Array of hex strings for colors in the color palette
     */
    constructor(pickerId, selectedColorValue, defaultColors) {
        this.#rootElement.classList.add("slds-color-picker");
        this.#pickerId = pickerId ?? "utam-color-picker";

        this.#configureSummaryLabel();
        this.#configureSummarySwatch();
        this.#configureTriggerButton();
        this.#configureSummaryHexInput();

        this.#configureCustomHueSliderInput();
        this.#configureCustomRange();
        this.#configureCustomRangeIndicator();
        this.#configureCustomPreviewSwatch();
        this.#configureCustomHexValueInput();
        this.#configureCustomColorComponentInput(this.#customRedValueInput, "red");
        this.#configureCustomColorComponentInput(this.#customGreenValueInput, "green");
        this.#configureCustomColorComponentInput(this.#customBlueValueInput, "blue");

        // This list of colors is sourced from the Salesforce Lightning Display System
        // Color Picker documentation (https://www.lightningdesignsystem.com/components/color-picker/). 
        this.#defaultColors = defaultColors ?? [
            Color.fromHex("#e3abec"),
            Color.fromHex("#c2dbf7"),
            Color.fromHex("#9fd6ff"),
            Color.fromHex("#9de7da"),
            Color.fromHex("#9df0c0"),
            Color.fromHex("#fff099"),
            Color.fromHex("#fed49a"),
            Color.fromHex("#d073e0"),
            Color.fromHex("#86baf3"),
            Color.fromHex("#5ebbff"),
            Color.fromHex("#44d8be"),
            Color.fromHex("#3be282"),
            Color.fromHex("#ffe654"),
            Color.fromHex("#ffb758"),
            Color.fromHex("#bd35bd"),
            Color.fromHex("#5779c1"),
            Color.fromHex("#5ebbff"),
            Color.fromHex("#00aea9"),
            Color.fromHex("#3cba4c"),
            Color.fromHex("#f5bc25"),
            Color.fromHex("#f99221"),
            Color.fromHex("#580d8c"),
            Color.fromHex("#001970"),
            Color.fromHex("#0a2399"),
            Color.fromHex("#0b7477"),
            Color.fromHex("#0b6b50"),
            Color.fromHex("#b67e11"),
            Color.fromHex("#b85d0d")
        ];

        this.#rootElement.appendChild(this.#createSummary());

        this.#configurePopover();
        this.#rootElement.appendChild(this.#colorSelectorPopover);

        this.#updateCurrentColorValues(Color.fromHex(selectedColorValue ?? "#FF0000"));
    }

    #configureSummaryLabel() {
        this.#summaryLabel.classList.add("slds-form-element__label", "slds-color-picker__summary-label");
        this.#summaryLabel.htmlFor = `${this.#pickerId}-summary-input`;
        this.#summaryLabel.innerText = "Choose Color";
    }

    #configureSummarySwatch() {
        this.#summarySwatch.classList.add("slds-swatch");
        const swatchAssistiveText = document.createElement("span");
        swatchAssistiveText.classList.add("slds-assistive-text");
        this.#summarySwatch.appendChild(swatchAssistiveText);
    }

    #configureTriggerButton() {
        this.#triggerButton.classList.add("slds-button", "slds-color-picker__summary-button", "slds-button_icon", "slds-button_icon-more");
        this.#triggerButton.ariaHasPopup = "false";

        this.#triggerButton.appendChild(this.#summarySwatch);

        const iconElement = new Icon("slds-icon", "slds-icon_x-small", "slds-icon-text-default");
        iconElement.setExternalLinkPath("../img/utility-icons.svg#down");
        this.#triggerButton.appendChild(iconElement.getDomElement());

        this.#triggerButton.addEventListener("click", e => {
            e.stopPropagation()
            this.#togglePopupDisplay()
        });

        const buttonAssistiveText = document.createElement("span");
        buttonAssistiveText.classList.add("slds-assistive-text");
        this.#triggerButton.appendChild(buttonAssistiveText);
    }

    #configureSummaryHexInput() {
        this.#summaryHexInput.classList.add("slds-input")
        this.#summaryHexInput.id = `${this.#pickerId}-summary-input`
        this.#summaryHexInput.addEventListener("change", e => {
            e.stopPropagation()
            const newColor = Color.fromHex(e.target.value)
            if (!newColor) {
                // TODO: error handling for invalid hex string in summary text box
            }
            this.#updateCurrentColorValues(newColor)
            this.onWorkingColorUpdated(newColor)
            this.onSelectionConfirmed(newColor)
        })
    }

    #configureCustomHueSliderInput() {
        this.#customHueSliderInput.classList.add("slds-color-picker__hue-slider")
        this.#customHueSliderInput.id = `${this.#pickerId}-input-range`
        this.#customHueSliderInput.type = "range"
        this.#customHueSliderInput.min = "0"
        this.#customHueSliderInput.max = "360"
        this.#customHueSliderInput.addEventListener("change", e => {
            e.stopPropagation()
            const newColor = Color.fromHSB(e.target.value, this.#workingColor.saturation, this.#workingColor.brightness)
            this.#updateWorkingColorValues(newColor)
            this.onWorkingColorUpdated(newColor)
        })
    }

    #configureCustomRange() {
        this.#customRange.classList.add("slds-color-picker__custom-range");
        this.#customRange.appendChild(this.#customRangeIndicator);
        this.#customRange.addEventListener("click", e => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const xPercent = e.offsetX / rect.width;
            const yPercent = 1 - (e.offsetY / rect.height);
            const newColor = Color.fromHSB(this.#workingColor.hue, xPercent, yPercent);
            this.#updateWorkingColorValues(newColor);
            this.onWorkingColorUpdated(newColor);
        });
    }

    #configureCustomRangeIndicator() {
        this.#customRangeIndicator.classList.add("slds-color-picker__range-indicator")
        this.#customRangeIndicator.href = "#"
        this.#customRangeIndicator.ariaLive = "assertive"
        this.#customRangeIndicator.ariaAtomic = "true"
        this.#customRangeIndicator.setAttribute("aria-describedby", `${this.#pickerId}-instructions`)

        const customRangeAssistiveText = document.createElement("span")
        customRangeAssistiveText.classList.add("slds-assistive-text")
        this.#customRangeIndicator.appendChild(customRangeAssistiveText)
    }

    #configureCustomPreviewSwatch() {
        this.#customPreviewSwatch.classList.add("slds-swatch");

        const previewAssistiveText = document.createElement("span");
        previewAssistiveText.classList.add("slds-assistive-text");
        previewAssistiveText.ariaHidden = "true";
        this.#customPreviewSwatch.appendChild(previewAssistiveText);
    }

    #configureCustomHexValueInput() {
        this.#customHexValueInput.classList.add("slds-input")
        this.#customHexValueInput.id = `${this.#pickerId}-input-hex`
        this.#customHexValueInput.type = "text"
        this.#customHexValueInput.addEventListener("change", e => {
            e.stopPropagation()
            const newColor = Color.fromHex(e.target.value)
            if (!newColor) {
                // TODO: error handling for invalid hex string text box
            }
            this.#updateWorkingColorValues(newColor)
            this.onWorkingColorUpdated(this.#workingColor)
        })
    }

    #configureCustomColorComponentInput(colorComponentInput, colorComponentName) {
        colorComponentInput.classList.add("slds-input");
        colorComponentInput.id = `${this.#pickerId}-input-${colorComponentName}`;
        colorComponentInput.type = "text";
        colorComponentInput.addEventListener("change", e => {
            e.stopPropagation();
            const red = parseInt(this.#customRedValueInput.value);
            const green = parseInt(this.#customGreenValueInput.value);
            const blue = parseInt(this.#customBlueValueInput.value);
            const newColor = Color.fromRGB(red, green, blue);
            if (!newColor) {
                // TODO: Display error for invalid component value.
            }
            this.#updateWorkingColorValues(newColor);
            this.onWorkingColorUpdated(newColor);
        })
    }

    #configurePopover() {
        this.#colorSelectorPopover.classList.add("slds-popover", "slds-color-picker__selector", "slds-is-absolute", "slds-hide");
        this.#colorSelectorPopover.role = "dialog";
        this.#colorSelectorPopover.ariaLabel = "Choose a color";
        this.#colorSelectorPopover.setAttribute("aria-describedby", `${this.#pickerId}-body`);
        this.#colorSelectorPopover.appendChild(this.#createPopoverBody());
        this.#colorSelectorPopover.appendChild(this.#createPopoverFooter());
    }

    #createSummary() {
        const summaryElement = document.createElement("div");
        summaryElement.classList.add("slds-form-element", "slds-color-picker__summary");

        summaryElement.appendChild(this.#summaryLabel);

        const formControlElement = document.createElement("div");
        formControlElement.classList.add("slds-form-element__control");
        formControlElement.appendChild(this.#triggerButton);

        const summaryInput = document.createElement("div");
        summaryInput.classList.add("slds-color-picker__summary-input");
        summaryInput.appendChild(this.#summaryHexInput);
        formControlElement.appendChild(summaryInput);
        summaryElement.appendChild(formControlElement);
        return summaryElement;
    }

    #createPopoverBody() {
        const popoverBody = document.createElement("div");
        popoverBody.classList.add("slds-popover__body");
        popoverBody.id = `${this.#pickerId}-body`;

        const mediaDiv = document.createElement("div");
        mediaDiv.classList.add("slds-media");
        
        const mediaBody = document.createElement("div");
        mediaBody.classList.add("slds-media__body");

        const defaultTab = new Tab(`${this.#pickerId}-default`, "Default");
        defaultTab.addContent(this.#createDefaultTabContent());
        this.#tabs.appendTab(defaultTab);

        const customTab = new Tab(`${this.#pickerId}-custom`, "Custom");
        customTab.addContent(this.#createCustomTabContent());
        this.#tabs.appendTab(customTab);
        
        mediaBody.appendChild(this.#tabs.getDomElement());
        mediaDiv.appendChild(mediaBody);
        popoverBody.appendChild(mediaDiv);
        return popoverBody;
    }

    #createPopoverFooter() {
        const footer = document.createElement("footer");
        footer.classList.add("slds-popover__footer");

        const footerDiv = document.createElement("div");
        footerDiv.classList.add("slds-color-picker__selector-footer");

        const cancelButton = document.createElement("button");
        cancelButton.classList.add("slds-button", "slds-button_neutral");
        cancelButton.innerText = "Cancel";
        cancelButton.addEventListener("click", e => {
            e.stopPropagation();
            this.#updateWorkingColorValues(this.#selectedColor);
            this.#togglePopupDisplay();
            this.onSelectionCanceled();
        });
        footerDiv.appendChild(cancelButton);

        const doneButton = document.createElement("button");
        doneButton.classList.add("slds-button", "slds-button_brand");
        doneButton.innerText = "Done";
        doneButton.addEventListener("click", e => {
            e.stopPropagation();
            this.#updateCurrentColorValues(this.#workingColor);
            this.onSelectionConfirmed(this.#workingColor);
            this.#togglePopupDisplay();
        });
        footerDiv.appendChild(doneButton);
        footer.appendChild(footerDiv);
        return footer;
    }

    #createDefaultTabContent() {
        const swatchList = document.createElement("ul");
        swatchList.classList.add("slds-color-picker__swatches");
        swatchList.role = "listbox";
        swatchList.ariaLabel = "Preset colors";
        this.#defaultColors.forEach(color => swatchList.appendChild(this.#createSwatch(color)));
        return swatchList;
    }

    #createCustomTabContent() {
        const picker = document.createElement("div");
        picker.classList.add("slds-color-picker__custom");

        const instructions = document.createElement("p");
        instructions.classList.add("slds-assistive-text");
        instructions.id = `${this.#pickerId}-instructions`;
        instructions.innerText = "Use arrow keys to select a saturation and brightness, on an x and y axis.";
        picker.appendChild(instructions);

        picker.appendChild(this.#customRange);
        picker.appendChild(this.#createHueAndPreview());

        const inputs = document.createElement("div");
        inputs.classList.add("slds-color-picker__custom-inputs");
        inputs.appendChild(this.#createHexInput());
        inputs.appendChild(this.#createColorComponentInput(this.#customRedValueInput, "red"));
        inputs.appendChild(this.#createColorComponentInput(this.#customGreenValueInput, "green"));
        inputs.appendChild(this.#createColorComponentInput(this.#customBlueValueInput, "blue"));
        picker.appendChild(inputs);
        return picker;
    }

    #createHueAndPreview() {
        const hueAndPreview = document.createElement("div");
        hueAndPreview.classList.add("slds-color-picker__hue-and-preview");

        const hueLabel = document.createElement("label");
        hueLabel.classList.add("slds-assistive-text");
        hueLabel.htmlFor = `${this.#pickerId}-input-range`;
        hueLabel.innerText = "Select Hue";
        hueAndPreview.appendChild(hueLabel);
        hueAndPreview.appendChild(this.#customHueSliderInput);
        hueAndPreview.appendChild(this.#customPreviewSwatch);
        return hueAndPreview;
    }

    #createHexInput() {
        const hex = document.createElement("div");
        hex.classList.add("slds-form-element", "slds-color-picker__input-custom-hex");

        const hexLabel = document.createElement("label");
        hexLabel.classList.add("slds-form-element__label");
        hexLabel.htmlFor = `${this.#pickerId}-input-hex`;
        hexLabel.innerText = "Hex";
        hex.appendChild(hexLabel);

        const hexInputDiv = document.createElement("div");
        hexInputDiv.classList.add("slds-form-element__control");

        hexInputDiv.appendChild(this.#customHexValueInput);
        hex.appendChild(hexInputDiv);
        return hex;
    }

    #createColorComponentInput(colorComponentInput, colorComponentName) {
        const initialCap = colorComponentName.charAt(0).toUpperCase();
        const colorComponent = document.createElement("div");
        colorComponent.classList.add("slds-form-element");

        const colorComponentLabel = document.createElement("label");
        colorComponentLabel.classList.add("slds-form-element__label");
        colorComponentLabel.htmlFor = `${this.#pickerId}-input-${colorComponentName}`;

        const colorComponentAbbr = document.createElement("abbr");
        colorComponentAbbr.title = `${initialCap}${colorComponentName.substring(1)}`;
        colorComponentAbbr.innerText = initialCap;
        colorComponentLabel.appendChild(colorComponentAbbr);
        colorComponent.appendChild(colorComponentLabel);

        const colorComponentInputDiv = document.createElement("div");
        colorComponentInputDiv.classList.add("slds-form-element__control");
        colorComponentInputDiv.appendChild(colorComponentInput);
        colorComponent.appendChild(colorComponentInputDiv);
        return colorComponent;
    }

    #createSwatch(color) {
        const swatchListItem = document.createElement("li");
        swatchListItem.classList.add("slds-color-picker__swatch");
        swatchListItem.role = "presentation";

        const link = document.createElement("a");
        link.classList.add("slds-color-picker__swatch-trigger");
        link.role = "option";
        link.href = "#!";
        link.tabIndex = "-1";

        const colorSpan = document.createElement("span");
        colorSpan.classList.add("slds-swatch");
        colorSpan.style.background = color.toHexString();

        const assistiveText = document.createElement("span");
        assistiveText.classList.add("slds-assistive-text");
        assistiveText.innerText = color.toHexString();
        colorSpan.appendChild(assistiveText);
        link.appendChild(colorSpan);
        link.addEventListener("click", e => {
            e.stopPropagation();
            const colorString = colorSpan.style.backgroundColor;
            const hex = `#${colorString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/).slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('')}`;
            const newColor = Color.fromHex(hex);
            this.#updateWorkingColorValues(newColor);
            this.onWorkingColorUpdated(newColor);
        });
        swatchListItem.appendChild(link);
        return swatchListItem;
    }

    #updateCurrentColorValues(color) {
        this.#summarySwatch.style.background = color.toHexString();
        this.#summaryHexInput.value = color.toHexString();
        this.#updateWorkingColorValues(color);
        this.#selectedColor = color;
    }

    #updateWorkingColorValues(color) {
        this.#customHueSliderInput.value = color.hue;
        this.#customRange.style.background = `hsl(${color.hue}, 100%, 50%)`;
        this.#customRangeIndicator.style.bottom = `${color.brightness * 100}%`;
        this.#customRangeIndicator.style.left = `${color.saturation * 100}%`;
        this.#customPreviewSwatch.style.background = color.toHexString();
        this.#customHexValueInput.value = color.toHexString();
        this.#customRedValueInput.value = color.red;
        this.#customGreenValueInput.value = color.green;
        this.#customBlueValueInput.value = color.blue;
        this.#workingColor = color;
    }

    #togglePopupDisplay() {
        this.#colorSelectorPopover.classList.toggle("slds-hide");
        this.#colorSelectorPopover.classList.toggle("slds-show");
        if (this.#colorSelectorPopover.classList.contains("slds-show")) {
            this.#triggerButton.ariaHasPopup = "true";
        } else {
            this.#triggerButton.ariaHasPopup = "false";
        }
    }

    /**
     * Callback function called when the color selection is confirmed.
     * @param {Color} color the color selected
     */
    onSelectionConfirmed = (color) => { }

    /**
     * Callback function called when the color selection is canceled.
     */
    onSelectionCanceled = () => { }

    /**
     * Callback function called when the user updates the color selection during editing, before confirmation.
     * @param {Color} color the color selected during editing, before confirmation
     */
    onWorkingColorUpdated = (color) => { }

    /**
     * Gets the color selected in the color picker.
     * @returns {Color} the color selected in the color picker
     */
    getSelectedColor() {
        return this.#selectedColor;
    }

    /**
     * Sets the color selected in the color picker.
     * @param {string} hexColor the hex string representing the color value
     */
    setSelectedColor(hexColor) {
        const color = Color.fromHex(hexColor);
        if (color) {
            // TODO: What if the hex value is invalid?
            this.#updateCurrentColorValues(color);
        }
    }

    /**
     * Gets the root element of the color picker.
     * @returns {Element} the root element of the color picker
     */
    getRootElement() {
        return this.#rootElement;
    }

    /**
     * Sets the label for the color picker.
     * @param {string} text sets the text of the label for the color picker
     */
    setLabel(text) {
        this.#summaryLabel.innerText = text;
    }
}

export { Color, ColorPicker }
