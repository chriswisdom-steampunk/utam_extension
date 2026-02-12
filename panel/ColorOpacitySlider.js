/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * A control representing the slider for the opacity of a color from 0 to 1 in .01 increments.
 */
class ColorOpacitySlider {
    #rootElement = document.createElement("div");
    #inputElement = document.createElement("input");
    #currentValueSpan = document.createElement("span");

    /**
     * Initializes a new instance of the ColorOpacitySlider class.
     */
    constructor() {
        this.#configureSlider();
    }

    #configureSlider() {
        this.#rootElement.classList.add("slds-form-element");

        const label = document.createElement("label");
        label.classList.add("slds-form-element__label");
        label.htmlFor ="opacity-slider";

        const labelSpan = document.createElement("span");
        labelSpan.classList.add("slds-slider-label");

        const labelTextSpan = document.createElement("span");
        labelTextSpan.classList.add("slds-slider-label__label");
        labelTextSpan.innerText = "Fill Opacity";
        labelSpan.appendChild(labelTextSpan);

        const labelRangeSpan = document.createElement("span");
        labelRangeSpan.classList.add("slds-slider-label__range");
        labelRangeSpan.innerText = "0.00 - 1.00";
        labelSpan.appendChild(labelRangeSpan);
        label.appendChild(labelSpan);
        this.#rootElement.appendChild(label);

        const formElementControl = document.createElement("div");
        this.#rootElement.classList.add("slds-form-element__control");

        const slider = document.createElement("div");
        slider.classList.add("slds-slider", "slds-size_x-small");

        this.#inputElement.classList.add("slds-slider__range");
        this.#inputElement.id = "opacity-slider";
        this.#inputElement.type = "range";
        this.#inputElement.min = "0.00";
        this.#inputElement.max = "1.00";
        this.#inputElement.step = "0.01";
        this.#inputElement.value = "0";
        slider.appendChild(this.#inputElement);

        this.#currentValueSpan.classList.add("slds-slider__value");
        this.#currentValueSpan.ariaHidden = "true";
        this.#currentValueSpan.textContent = "0.00"
        slider.appendChild(this.#currentValueSpan);

        this.#inputElement.addEventListener("input", e => {
            e.stopPropagation();
            this.#currentValueSpan.textContent = parseFloat(e.currentTarget.value).toFixed(2);
            this.onInput(e.currentTarget.value);
        });
        this.#inputElement.addEventListener("change", e => {
            e.stopPropagation();
            this.onChange(e.currentTarget.value);
        });
        formElementControl.appendChild(slider);
        this.#rootElement.appendChild(formElementControl);
    }

    /**
     * Callback called when an input value is being changed (e.g., while the slider is being dragged).
     * @param {string} value the value of the current slider input position
     */
    onInput = (value) => { }

    /**
     * Callback called when  the value has changed (e.g., while the user has finished dragging the slider).
     * @param {string} value the value of the slider input position once input is completed
     */
    onChange = (value) => { }

    /**
     * Gets the root element of the slider control.
     * @returns {Element} the root element of the control
     */
    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Gets the value of the slider as a string.
     * @returns {string} the value of the slider
     */
    getValue() {
        return this.#inputElement.value;
    }

    /**
     * Sets the value of the slider as a string.
     * @param {string} value the value of the slider
     */
    setValue(value) {
        this.#inputElement.value = value;
        this.#currentValueSpan.textContent = parseFloat(value).toFixed(2);
    }
}

export { ColorOpacitySlider }
