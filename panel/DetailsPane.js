/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Settings } from "../common/Settings.js";
import { ContainerPageObjectArgumentEditor, TextArgumentEditor, NumberArgumentEditor } from "./ArgumentEditor.js"
import { ComboBox } from "./ComboBox.js";
import { Icon } from "./Icon.js";

/**
 * The argument display section of the main panel.
 */
class ArgumentsDisplay {
    #rootElement = document.createElement("div");
    #argsListElement = document.createElement("div");
    #argsSectionElement = document.createElement("section");
    #noArgsBox = document.createElement("div");
    #argsBox = document.createElement("div");

    // This object expects argument names as keys, and the appropriately
    // typed ArgumentEditor object (based on argument type) as values.
    #editors = {}

    /**
     * Initializes a new instance of the ArgumentsDisplay class.
     */
    constructor() {
        this.#rootElement.classList.add("slds-form-element", "slds-form-element_stacked");
        this.#rootElement.appendChild(this.#createAccordion());
    }
    
    #createAccordion() {
        const accordion = document.createElement("ul");
        accordion.classList.add("slds-accordion", "utam-accordion-heading", "utam-arguments-panel");

        const accordionListItem = document.createElement("li");
        accordionListItem.classList.add("slds-accordion__list-item");

        this.#configureSection("args-panel");
        accordionListItem.appendChild(this.#argsSectionElement);

        accordion.appendChild(accordionListItem);
        return accordion;
    }

    #configureSection(panelId) {
        this.#argsSectionElement.classList.add("slds-accordion__section");
        this.#argsSectionElement.id = "args-section";
        this.#argsSectionElement.appendChild(this.#createAccordionSummary(panelId));
        this.#argsSectionElement.appendChild(this.#createAccordionContent(panelId));
    }

    #createAccordionSummary(panelId) {
        const accordionSummary = document.createElement("div");
        accordionSummary.classList.add("slds-accordion__summary");

        const headerElement = document.createElement("h2");
        headerElement.classList.add("slds-accordion__summary-heading");
        headerElement.appendChild(this.#createAccordionExpandButton(panelId));
        accordionSummary.appendChild(headerElement);
        return accordionSummary;
    }

    #createAccordionExpandButton(panelId) {
        const expandButton = document.createElement("button");
        expandButton.classList.add("slds-button", "slds-button_reset", "slds-accordion__summary-action");
        expandButton.setAttribute("aria-controls", panelId);
        expandButton.title = "Add Arguments";

        const icon = new Icon("slds-accordion__summary-action-icon", "slds-button__icon", "slds-button__icon_left");
        icon.setExternalLinkPath("../img/utility-icons.svg#switch");
        expandButton.appendChild(icon.getDomElement());

        expandButton.addEventListener("click", e => {
            e.stopPropagation();
            this.toggleVisibility();
        });

        const buttonTextSpan = document.createElement("span");
        buttonTextSpan.classList.add("slds-accordion__summary-content");
        buttonTextSpan.textContent = "Add Arguments";
        expandButton.appendChild(buttonTextSpan);
        return expandButton;
    }

    #createAccordionContent(panelId) {
        const contentElement = document.createElement("div");
        contentElement.classList.add("slds-accordion__content");
        contentElement.id = panelId;

        this.#configureNoArgsBox();
        contentElement.appendChild(this.#noArgsBox);

        this.#configureArgsBox();
        contentElement.appendChild(this.#argsBox);
        return contentElement;
    }

    #configureNoArgsBox() {
        this.#noArgsBox.classList.add("slds-box", "slds-theme_shade", "slds-show");
        this.#noArgsBox.id = "no-args-box";
        const paragraph = document.createElement("p");
        paragraph.innerHTML = "This method doesn't contain arguments. <a href=\"#\">Learn more.</a>";
        this.#noArgsBox.appendChild(paragraph);
    }

    #configureArgsBox() {
        this.#argsBox.classList.add("slds-hide", "slds-clearfix");
        this.#argsBox.id = "args-box";

        this.#argsListElement.id = "args";
        this.#argsBox.appendChild(this.#argsListElement);

        const buttonControl = document.createElement("div");
        buttonControl.classList.add("slds-form-element__control", "slds-p-top_x-small");

        const applyButton = document.createElement("button");
        applyButton.classList.add("slds-button", "slds-button_brand", "slds-float_right");
        applyButton.id = "apply-arg-changes-button";
        applyButton.textContent = "Apply"
        applyButton.addEventListener("click", e => this.onArgumentChangesApplied());
        buttonControl.appendChild(applyButton);

        this.#argsBox.appendChild(buttonControl);
    }

    #showArgumentsDisplay(expandArgsPanel) {
        this.#noArgsBox.classList.remove("slds-show");
        this.#noArgsBox.classList.add("slds-hide");
        this.#argsBox.classList.remove("slds-hide");
        this.#argsBox.classList.add("slds-show");
        if (expandArgsPanel) {
            this.#argsSectionElement.classList.toggle("slds-is-open", true);
        }
    }

    #showNoArgumentsDisplay() {
        this.#argsBox.classList.remove("slds-show");
        this.#argsBox.classList.add("slds-hide");
        this.#noArgsBox.classList.remove("slds-hide");
        this.#noArgsBox.classList.add("slds-show");
    }

    #clearArgumentsList() {
        while (this.#argsListElement.firstChild) {
            this.#argsListElement.firstChild.remove();
        }
    }

    /**
     * Callback function called when the apply button is clicked,
     * applying the user's changes to the argument list.
     */
    onArgumentChangesApplied = () => { }

    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Gets the value of a specifed argument.
     * @param {string} argumentName the name of the argument
     * @returns {string} the value of the argument
     */
    getArgumentValue(argumentName) {
        return this.#editors[argumentName]?.getValue();
    }

    /**
     * Toggles visibility of the arguments display
     */
    toggleVisibility() {
        this.#argsSectionElement.classList.toggle("slds-is-open");
    }

    /**
     * Updates the display for the set of arguments.
     * @param {Array} args the arguments to list in the display
     * @param {Array} pageObjectTypeList the list of Page Object types for a container argument
     */
    update(args, pageObjectTypeList) {
        this.#clearArgumentsList();
        this.#editors = {};
 
        let expandArgsPanel = false;
        if (args && args.length) {
            args.forEach(arg => {
                let argEditor;
                switch (arg.type) {
                    case "pageobject":
                        argEditor = new ContainerPageObjectArgumentEditor(arg.name, pageObjectTypeList);
                        break;
                    case "number":
                        argEditor = new NumberArgumentEditor(arg.name);
                        break;
                    default:
                        argEditor = new TextArgumentEditor(arg.name);
                        break;
                }
                if (arg.value) {
                    argEditor.setValue(arg.value);
                } else {
                    expandArgsPanel = true;
                }
                this.#editors[arg.name] = argEditor;
                const argElement = argEditor.getDomElement();

                const argElementDiv = document.createElement("div");
                argElementDiv.classList.add("slds-form-element__control");
                argElementDiv.appendChild(argElement);

                const label = document.createElement("label");
                label.classList.add("slds-form-element__label");
                label.htmlFor = argElement.id;
                label.innerText = arg.name;

                const formElement = document.createElement("div");
                formElement.classList.add("slds-form-element");
                formElement.appendChild(label);
                formElement.append(argElementDiv);

                this.#argsListElement.appendChild(formElement);
            });
        } else {
            this.#showNoArgumentsDisplay();
            return;
        }
        this.#showArgumentsDisplay(expandArgsPanel);
    }
}

/**
 * The code display section of the main panel.
 */
class CodeDisplay {
    #rootElement = document.createElement("div");
    #codeTextElement = document.createElement("div");
    #codeLines
    #formatLanguage

    /**
     * Initializes a new instance of the CodeDisplay class.
     * @param {string} formatLanguage the language with which to format code
     */
    constructor(formatLanguage) {
        this.#rootElement.classList.add("slds-form-element", "slds-form-element_horizontal");
        this.#rootElement.appendChild(this.#createCodeDisplayPanel());
        this.#formatLanguage = formatLanguage;
    }

    #createCodeDisplayPanel() {
        const codeDisplayPanel = document.createElement("div");
        codeDisplayPanel.classList.add("utam-code-panel");

        this.#codeTextElement.classList.add("slds-form-element__static", "slds-text-font_monospace", "utam-code");
        this.#codeTextElement.id = "code-text";
        codeDisplayPanel.appendChild(this.#codeTextElement);

        const copyButton = this.#createCopyButton();
        codeDisplayPanel.appendChild(copyButton);
        return codeDisplayPanel;
    }

    #createCopyButton() {
        const copyButton = document.createElement("button");
        copyButton.classList.add("slds-button", "slds-button_icon", "slds-button_icon-container", "slds-is-absolute", "utam-copy-code-button");
        copyButton.id = "copy-code";

        const icon = new Icon("slds-button__icon");
        icon.setExternalLinkPath("../img/utility-icons.svg#copy");
        copyButton.appendChild(icon.getDomElement());

        const assistiveText = document.createElement("span");
        assistiveText.classList.add("slds-assistive-text");
        assistiveText.textContent = "Copy Generated Code";
        copyButton.appendChild(assistiveText);

        copyButton.addEventListener("click", e => {
            e.stopPropagation();
            const temp = document.createElement("textarea");
            e.currentTarget.appendChild(temp);
            temp.appendChild(document.createTextNode(this.#codeTextElement.innerText));
            temp.select();
            document.execCommand("copy");
            e.currentTarget.removeChild(temp);
            icon.setExternalLinkPath("../img/utility-icons.svg#check");
            const useElem = e.currentTarget.querySelector("use");
            useElem.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "../img/utility-icons.svg#check");
            setTimeout(() => icon.setExternalLinkPath("../img/utility-icons.svg#copy"), 1000);
        });
        return copyButton;
    }

    #formatCodeLines() {
        const formattedCodeLines = [];
        if (this.#codeLines?.length) {
            // The first generated code line has a different format than the
            // rest of them for the generated code display, so special-case
            // the first line in the array.
            formattedCodeLines.push(this.#formatRootPageObjectCodeLine(this.#codeLines[0]));
            for (let i = 1; i < this.#codeLines.length; i++) {
                const formattedMethodLine = this.#formatMethodCallLine(this.#codeLines[i]);

                // Indent the method line the appropriate amount.
                if (this.#formatLanguage === Settings.CODE_OUTPUT_LANGUAGE_JAVASCRIPT) {
                    const variablePrefix = "utamVar";
                    const previousVariable = i === 1 ? "pageObject" : `${variablePrefix}${i - 1}`;

                    // If this is the last line, do not assign the result to a variable,
                    // as the method may return void/null/undefined. The user can manually
                    // assign the return value to a variable if that will be required elsewhere.
                    const variableAssignment = i === this.#codeLines.length - 1 ? "" : `const ${variablePrefix}${i} = `;
                    formattedCodeLines.push(`${variableAssignment}await ${previousVariable}${formattedMethodLine};`);
                } else {
                    formattedCodeLines.push(`    ${formattedMethodLine}`);
                }
            }
            if (this.#formatLanguage === Settings.CODE_OUTPUT_LANGUAGE_JAVA) {
                // For Java, terminate the code with a semicolon.
                formattedCodeLines[formattedCodeLines.length - 1] = `${formattedCodeLines[formattedCodeLines.length - 1]};`
            }
        }
    
        return formattedCodeLines;
    }

    #formatRootPageObjectCodeLine(codeLine) {
        const codePrefix = this.#formatLanguage === Settings.CODE_OUTPUT_LANGUAGE_JAVASCRIPT ? "const pageObject = await utam.load" : "loader.load";
        const codeSuffix = this.#formatLanguage === Settings.CODE_OUTPUT_LANGUAGE_JAVASCRIPT ? ";" : "";
        const firstSlashIndex = codeLine.indexOf("/");
        const pageObjectClassName = codeLine.substring(firstSlashIndex + 1);
        return `${codePrefix}(${this.#formatPageObjectClassName(pageObjectClassName)})${codeSuffix}`;
    }

    #formatMethodCallLine(methodCall) {
        const methodName = this.#getMethodName(methodCall);
        const argStrings = [];
        this.#getMethodCallArgumentValues(methodCall).forEach(argValue => {
            const trimmedValue = argValue.trim();
            if (this.#isArgumentValuePageObject(trimmedValue)) {
                const pageObjectClassName = trimmedValue.slice(trimmedValue.lastIndexOf("/") + 1);
                argStrings.push(this.#formatPageObjectClassName(pageObjectClassName));
            } else {
                argStrings.push(trimmedValue);
            }
        });
        return`${methodName}(${argStrings.join(", ")})`;
    }

    /**
     * 
     * @param {string} methodCall 
     */
    #getMethodName(methodCall) {
        return methodCall.slice(0, methodCall.indexOf("("));
    }

    #getMethodCallArgumentValues(methodCall) {
        // Method calls are of the form "methodName(arg1, arg2, arg3)", so parse out the
        // argument values as the strings within parentheses, separated by commas.
        return methodCall.slice(methodCall.indexOf("(") + 1, methodCall.indexOf(")")).split(",");
    }

    #isArgumentValuePageObject(argumentValue) {
        // An argument value is a Page Object type reference if it contains a
        // forward slash ("/"), and if it is not surrounded by double quotes.
        return argumentValue.indexOf("/") >= 0 && !argumentValue.startsWith("\"") && !argumentValue.endsWith("\"");
    }

    #formatPageObjectClassName(pageObjectClassName) {
        // For Java, Page Object class name references are "<PageObjectClassName>.class";
        // for JavaScript, they are simply "<PageObjectClassName>"
        const classSuffix = this.#formatLanguage === "java" ? ".class" : "";

        // Proper case the class name, with the first character upper-case.
        const properCasePageObjectClassName = `${pageObjectClassName.slice(0, 1).toUpperCase()}${pageObjectClassName.slice(1)}`;
        return `${properCasePageObjectClassName}${classSuffix}`;
    }

    #updateDisplay() {
        const code = this.#formatCodeLines();
        this.#codeTextElement.innerHTML = "";
        this.#codeTextElement.innerHTML = code.join("<br>");
    }

    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Sets the language to use in formatting generated code.
     * @param {string} language the language to use in formatting generated code
     */
    setLanguage(language) {
        this.#formatLanguage = language;
        this.#updateDisplay();
    }

    /**
     * Updates the lines of code to display.
     * @param {Array} codeLines the lines of code to display
     */
    updateCodeLines(codeLines) {
        this.#codeLines = codeLines;
        this.#updateDisplay();
    }
}

/**
 * The details pane of the main panel.
 */
class DetailsPane {
    #rootElement = document.createElement("div");

    #languageSelector = new ComboBox("language-selector");

    /**
     * The arguments display section of the details pane.
     */
    argsDisplay = new ArgumentsDisplay();

    /**
     * The code display section of the details pane.
     */
    codeDisplay = new CodeDisplay(this.#languageSelector.getValue());

    /**
     * Initizes a new instance of the DetailsPane class.
     */
    constructor() {
        this.#configureLanguageSelector();
        this.#rootElement.appendChild(this.#languageSelector.getDomElement());
        this.#rootElement.appendChild(this.argsDisplay.getDomElement());
        this.#rootElement.appendChild(this.codeDisplay.getDomElement());
    }

    #configureLanguageSelector() {
        this.#languageSelector.setAdditionalStyles("slds-form-element_horizontal", "slds-clearfix");
        this.#languageSelector.setLabelStyling("slds-text-title_bold");
        this.#languageSelector.setFormControlStyling("slds-float_right");
        this.#languageSelector.setContainerStyling("utam-language-selector");

        this.#languageSelector.setLabelText("Code Output:");

        this.#languageSelector.addOption(Settings.CODE_OUTPUT_LANGUAGE_JAVA, "Java");
        this.#languageSelector.addOption(Settings.CODE_OUTPUT_LANGUAGE_JAVASCRIPT, "JavaScript");

        this.#languageSelector.onChange = value => this.codeDisplay.setLanguage(value);
    }

    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Sets the language to use to format generated code in the pane.
     * @param {string} language the language to use to format generated code
     */
    setLanguage(language) {
        this.#languageSelector.setValue(language);
        this.codeDisplay.setLanguage(language);
    }

    /**
     * Resets the details panel to display no arguments and no formatted code.
     */
    reset() {
        this.update();
    }

    /**
     * Updates both the arguments and the code in the pane.
     * @param {Array} codeLines the lines of code to display
     * @param {Array} args the arguments to list in the display
     * @param {Array} pageObjectTypeList the list of Page Object types for a container argument
     */
    update(codeLines = [], args = [], pageObjectTypeList = []) {
        this.argsDisplay.update(args, pageObjectTypeList);
        this.codeDisplay.updateCodeLines(codeLines);
    }
}

export { DetailsPane }
