/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Class for the finding elements in the document.
 */
class ElementFinder {
    #pageObjectResolver;

    constructor(pageObjectResolver) {
        this.#pageObjectResolver = pageObjectResolver;
    }

    /**
     * Gets the information about the filter for the defined element.
     * @param {Object} elementDescriptor the descriptor for the specified element
     * @param {Array} args an array containing arguments for this filter
     * @returns the information about the filter, or null if one is not defined
     */
    #getFilterInfo(elementDescriptor, args) {
        const { selector, filter } = elementDescriptor;
        const additionalElements = [];
        let filterObject = null;
        if (selector && selector.returnAll && filter) {
            const elementFilter = elementDescriptor.filter;
            if (elementFilter.apply) {
                let currentDescriptor = elementDescriptor;
                let effectiveApply = elementFilter.apply;
                while (currentDescriptor.type && currentDescriptor.type.includes("/")) {
                    const parsedPageObject = this.#pageObjectResolver(currentDescriptor.type);
                    if (parsedPageObject.methods[effectiveApply]) {
                        currentDescriptor = parsedPageObject.methods[effectiveApply];
                        effectiveApply = currentDescriptor.lastStepApply;
                    } else {
                        currentDescriptor = parsedPageObject.elements[effectiveApply];
                    }
                }
                if (currentDescriptor.category === "method") {
                    additionalElements.push(...currentDescriptor.elements);
                }
                const { matcher } = elementFilter;
                const matcherArgNames = matcher.args.map(matcherArg => matcherArg.name);
                const filteredArgs = args.filter(arg => matcherArgNames.includes(arg.name) && arg.value);
                filterObject = {
                    apply: currentDescriptor.lastStepApply,
                    matcherType: elementFilter.matcher.type,
                    args: filteredArgs,
                    findFirst: elementFilter.findFirst,
                    attribute: currentDescriptor.elementAttribute || "",
                    additionalElements: additionalElements
                };
            }
        }
        return filterObject;
    }

    /**
     * Filters a list of elements based on the specified filter information.
     * @param {NodeList} elements the list of nodes to filter
     * @param {Object} filterInfo an object containing information about properties on which to filter the list
     * @returns the filtered list of elements
     */
    #filterElements(elements, filterInfo) {
        if (!elements.length || !filterInfo?.args.length) {
            return [];
        }
        // NodeList does not support the filter method. We must convert it
        // to an array first.
        const elementArray = [...elements];
        const filterableApplyMethods = new Set(["getText", "getTitle", "getAttribute"]);
        const { apply, attribute, matcherType, findFirst } = filterInfo;
        const filterValue = filterableApplyMethods.has(filterInfo.apply) ? filterInfo.args[0].value : "";
        const filteredElements = elementArray.filter(element => {
            let effectiveElement = element;
            if (filterInfo.additionalElements.length > 0) {
                // If we are filtering on the result of a method, that method may refer to
                // multiple elements during its execution before returning the value on which
                // to filter. So that we can find the correct element, we must walk the list
                // of elements the method would access, which are contained in the additionalElements
                // property, and we use the last element that has a valid selector as the child
                // of the parent element to get the value on which to filter.
                filterInfo.additionalElements.forEach(additionalElement => {
                    if (additionalElement.selector?.css) {
                        effectiveElement = effectiveElement.querySelector(additionalElement.selector.css);
                    }
                });
            }
            let candidateValue = "";
            switch (apply) {
                case "getText":
                    candidateValue = effectiveElement.textContent;
                    break;
                case "getTitle":
                    candidateValue = effectiveElement.title;
                    break;
                case "getAttribute":
                    if (attribute) {
                        candidateValue = effectiveElement[attribute] ?? element.getAttribute(attribute);
                    }
                    break;
            }

            switch (matcherType) {
                case "stringEquals":
                    return candidateValue === filterValue;
                case "stringContains":
                    return candidateValue.includes(filterValue);
            }
        });
        return findFirst && filteredElements.length ? [filteredElements[0]] : filteredElements;
    }

    /**
     * Finds an element in the DOM.
     * @param {string} selector the CSS selector to use to find the element
     * @returns the found element, or null if no element matches the selector
     */
    findElement(selector) {
        return document.querySelector(selector);
    }

    /**
     * Recursively walks the tree of elements defined in the Page Object to get the
     * appropriate DOM element in the document.
     * @param {string} parentElement the DOM element under which to start searching for the elements described by the member
     * @param {Object} memberDescriptor an object describing the member and how to locate its element in the current document
     * @param {Array} args the arguments required by the selectors used to locate the element
     * @param {Object} elementCollection the collection containing the element's parents
     * @returns the DOM element found by the element descriptor; null if the element does not exist in the current document
     */
    walkElements(parentElement, memberDescriptor, args, elementCollection) {
        let currentElement = parentElement;
        if (memberDescriptor.category === "method") {
            memberDescriptor.elements.forEach(referencedElement => {
                let intermediateArgs = args;
                if (referencedElement.effectiveArgs) {
                    intermediateArgs = args.slice(0, referencedElement.effectiveArgs.length);
                    args = args.slice(referencedElement.effectiveArgs.length);
                }
                let intermediateFilterInfo = this.#getFilterInfo(referencedElement, intermediateArgs);
                currentElement = this.getElement(referencedElement, intermediateArgs, intermediateFilterInfo, currentElement);
            });
            return currentElement;
        }

        if (memberDescriptor.parent) {
            let parentDescriptor = elementCollection[memberDescriptor.parent];
            let elementPath = [];
            elementPath.push(parentDescriptor);
            while (parentDescriptor.parent) {
                parentDescriptor = elementCollection[parentDescriptor.parent];
                elementPath.unshift(parentDescriptor);
            }
            elementPath.forEach(pathSegment => {
                if (pathSegment.selector.args) {
                    let segmentArgs = args.slice(0, pathSegment.selector.args.length);
                    args = args.slice(pathSegment.selector.args.length);
                    let pathSegmentFilterInfo = this.#getFilterInfo(pathSegment, args);
                    currentElement = this.getElement(pathSegment, segmentArgs, pathSegmentFilterInfo, currentElement);
                }
            });
        }
        let filterInfo = this.#getFilterInfo(memberDescriptor, args);
        return this.getElement(memberDescriptor, args, filterInfo, currentElement);
    }

    /**
     * Locates the element in the DOM represented by the element descriptor.
     * @param {Object} elementDescriptor an object describing the element and how to locate it in the current document
     * @param {Array} args the arguments required by the selectors used to locate the element
     * @param {Object} filterInfo the filter information for getting the element.
     * @param {HTMLElement} parentNode the parent element in the document
     * @returns the element found by the element descriptor; null if the element does not exist in the current document
     */
    getElement(elementDescriptor, args, filterInfo, parentNode) {
        if (!parentNode || !elementDescriptor.selector.css) {
            return null;
        }
        let selectorString = elementDescriptor.selector.css;
        const paramMarkerMatch = selectorString.match(/\%[ds]/g);
        if (paramMarkerMatch && args.length) {
            let argIndex = 0;
            paramMarkerMatch.forEach(matchedSubstring => {
                if (args[argIndex] && args[argIndex].value) {
                    selectorString = selectorString.replace(matchedSubstring, args[argIndex].value);
                }
                argIndex++;
            });
            args.splice(0, paramMarkerMatch.length);
        }
        let elements = [];
        if (!selectorString.includes("%")) {
            if (elementDescriptor.isInShadowRoot && parentNode.shadowRoot) {
                elements = parentNode.shadowRoot.querySelectorAll(selectorString);
            } else {
                elements = parentNode.querySelectorAll(selectorString);
            }
        }
        if (elementDescriptor.selector.returnAll && elementDescriptor.filter) {
            const filteredElements = this.#filterElements(elements, filterInfo);
            if (filteredElements.length > 0) {
                elements = filteredElements;
            }
        }
        return elements.length > 0 ? elements[0] : null;
    }
}

export default ElementFinder;
