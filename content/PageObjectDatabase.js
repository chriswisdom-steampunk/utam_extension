/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import DataTypes from "../common/DataTypes.js";
import { Settings } from "../common/Settings.js";

/**
 * A database of parsed UTAM Page Objects
 */
class PageObjectDatabase {
    #parsedPageObjectCache = {};

    #intrinsicMethods = {
        basic: [
            // TODO: containsElement and waitFor (requires new logic for arg types,
            // and return value types for waitFor; no good way to represent those
            // in the code pane)
            this.#createIntrinsicMethod(
                "containsElement",
                "Gets a value indicating whether this element contains a given a child element.",
                DataTypes.BOOLEAN
            ),
            this.#createIntrinsicMethod(
                "waitFor",
                "Waits for a condition to be met for this element."
            ),
            this.#createIntrinsicMethod(
                "getAttribute",
                "Gets the string value of a attribute for this element.",
                DataTypes.STRING,
                [
                    { name: "attribute", type: DataTypes.STRING }
                ]
            ),
            this.#createIntrinsicMethod(
                "getClassAttribute",
                "Gets the string value of the class attribute for this element. An alias for getAttribute(\"class\").",
                DataTypes.STRING
            ),
            this.#createIntrinsicMethod(
                "getCssPropertyValue",
                "Gets the value of a CSS property for this element.",
                DataTypes.STRING,
                [
                    { name: "propertyName", type: DataTypes.NUMBER }
                ]
            ),
            this.#createIntrinsicMethod(
                "getText",
                "Gets the displayed text of this element.",
                DataTypes.STRING
            ),
            this.#createIntrinsicMethod(
                "getTitle",
                "Gets the value of the title attribute of this element. An alias for getAttribute(\"title\").",
                DataTypes.STRING
            ),
            this.#createIntrinsicMethod(
                "getValue",
                "Gets the value of the \"value\" attribute of an <input> element.",
                DataTypes.STRING
            ),
            this.#createIntrinsicMethod(
                "isEnabled",
                "Gets a value indicating whether this element is enabled.",
                DataTypes.BOOLEAN
            ),
            this.#createIntrinsicMethod(
                "isFocused",
                "Gets a value indicating whether this element is focused.",
                DataTypes.BOOLEAN
            ),
            this.#createIntrinsicMethod(
                "isPresent",
                "Gets a value indicating whether this element is present in the loaded document.",
                DataTypes.BOOLEAN
            ),
            this.#createIntrinsicMethod(
                "isVisible",
                "Gets a value indicating whether this element is visible.",
                DataTypes.BOOLEAN
            ),
            this.#createIntrinsicMethod(
                "waitForAbsence",
                "Waits for this element to be removed from the document."
            ),
            this.#createIntrinsicMethod(
                "waitForInvisible",
                "Waits for this element to be invisible."
            ),
            this.#createIntrinsicMethod(
                "waitForVisible",
                "Waits for this element to be visible."
            )
        ],
        actionable: [
            this.#createIntrinsicMethod(
                "blur",
                "Activates the blur event on this element, removing focus from it."
            ),
            this.#createIntrinsicMethod(
                "focus",
                "Activates the focus event on this element, setting focus from it."
            ),
            this.#createIntrinsicMethod(
                "moveTo",
                "Moves the mouse to the center of this element."
            ),
            this.#createIntrinsicMethod(
                "scrollToCenter",
                "Scrolls this element to the center of the browser view port."
            ),
            this.#createIntrinsicMethod(
                "scrollToTop",
                "Scrolls this element to the top of the browser view port."
            )
        ],
        clickable: [
            this.#createIntrinsicMethod(
                "click",
                "Clicks on this element."
            ),
            this.#createIntrinsicMethod(
                "doubleClick",
                "Double-clicks on this element."
            ),
            this.#createIntrinsicMethod(
                "rightClick",
                "Right-clicks on this element."
            ),
            this.#createIntrinsicMethod(
                "clickAndHold",
                "Clicks this element and holds the mouse button down for a specified number of seconds.",
                DataTypes.VOID,
                [
                    { name: "holdDurationSec", type: DataTypes.NUMBER }
                ]
            )
        ],
        editable: [
            this.#createIntrinsicMethod(
                "clear",
                "Clears the entered text from this element, if any."
            ),
            this.#createIntrinsicMethod(
                "clearAndType",
                "Clears the entered text from this element, if any, and types the specified text.",
                DataTypes.VOID,
                [
                    { name: "text", type: DataTypes.STRING }
                ]
            ),
            this.#createIntrinsicMethod(
                "press",
                "Simulates pressing of a single key on this element.",
                DataTypes.VOID,
                [
                    { name: "key", type: DataTypes.STRING }
                ]
            ),
            this.#createIntrinsicMethod(
                "setText",
                "Simulates typing the specified text into this element.",
                DataTypes.VOID,
                [
                    { name: "text", type: DataTypes.STRING }
                ]
            )
        ],
        draggable: [
            // TODO: dragAndDrop (requires new logic for arg types, no good way to represent
            // element type in the code pane, using string as a placeholder)
            this.#createIntrinsicMethod(
                "dragAndDrop",
                "Drags this element and drops it on another element.",
                DataTypes.VOID,
                [
                    { name: "element", type: DataTypes.STRING },
                    { name: "durationSec", type: DataTypes.NUMBER }
                ]
            ),
            this.#createIntrinsicMethod(
                "dragAndDropByOffset",
                "Drags this element to a coordinate offset.",
                DataTypes.VOID,
                [
                    { name: "offsetX", type: DataTypes.NUMBER },
                    { name: "offsetY", type: DataTypes.NUMBER },
                    { name: "durationSec", type: DataTypes.NUMBER }
                ]
            )
        ],
        list: [
            // "list" is not an actual interface type, but can be used within a method as a
            // list of elements that return a list of elements
            this.#createIntrinsicMethod(
                "size",
                "Gets the number of items in a list of elements.",
                DataTypes.NUMBER
            )
        ],
        element: [
            // "element" is not an actual interface type, but a method step can use the
            // action type within a PO method; to avoid messy recursion in the display
            // tree, we will *say* it returns void, even though it returns its own type
            this.#createIntrinsicMethod("returnSelf")
        ],
        document: [
            // TODO: Add methods
        ],
        navigation: [
            // TODO: Add methods
        ]
    }

    /**
     * The list of all Page Object URIs that are defined as "root" Page Objects.
     */
    rootPageObjectUris = [];

    /**
     * Creates an object containing information about the intrinsic method
     * @param {string} name the name of the intrinsic method
     * @param {string} description the description of the method
     * @param {string} returnType the return type of the intrinsic method
     * @param {object[]} args An array of objects representing the arguments of the intrinsic method
     * @returns {object} the object containing information about the intrinsic method
     */
    #createIntrinsicMethod(name, description, returnType = DataTypes.VOID, args = []) {
        return {
            displayName: name,
            name,
            description,
            effectiveArgs: args,
            category: DataTypes.INTRINSIC,
            type: returnType,
            public: true
        };
    }

    /**
     * Reads the Page Object from the cache matching the given URI and returns an object
     * that allows the user to query the methods by name.
     * @param {string} pageObjectUri the URI representing a UTAM Page Object
     * @param {Object} allPageObjects the collection of all UTAM Page Objects to be parsed
     */
    #parsePageObject(pageObjectUri, allPageObjects) {
        const pageObject = allPageObjects[pageObjectUri];
        let parsed = {
            uri: pageObjectUri,
            source: pageObject.source,
            elements: {},
            methods: {}
        };
        if (pageObject.selector) {
            let rootElement = {
                name: DataTypes.ROOT,
                type: pageObjectUri,
                selector: pageObject.selector
            };
            parsed.elements[DataTypes.ROOT] = this.#processElementObject(rootElement, null, [], false, allPageObjects);
        }
        this.#processAuthor(pageObject, parsed);
        parsed.description = this.#processDescription(pageObject);
        this.#processElements(pageObject, null, [], allPageObjects, parsed);
        this.#processMethods(pageObject, allPageObjects, parsed);
        this.#parsedPageObjectCache[pageObjectUri] = parsed;
        return parsed;
    }

    /**
     * Processes the author of a Page Object definition.
     * @param {object} pageObject the Page Object definition containing information about the author
     * @param {object} parsedPageObject the Page object representation
     */
    #processAuthor(pageObject, parsedPageObject) {
        parsedPageObject.author = pageObject.description?.author;
    }

    /**
     * Processes the description in a portion of a Page Object representation
     * @param {object} pageObjectFragment the fragment of the Page Object definition containing the description
     */
    #processDescription(pageObjectFragment) {
        const description = pageObjectFragment.description;
        if (description?.text) {
            const textArray = Array.isArray(description.text) ? description.text : [description.text];
            return textArray.join(" ");
        }
        return undefined;
    }

    /**
     * Recursively processes the elements in a portion of a Page Object definition.
     * @param {Object} pageObjectFragment the fragment of the Page Object definition containing element definitions
     * @param {string} parentName the name of the parent of the current fragment, if any
     * @param {Array} parentArgs the array of arguments contained in the selectors of the parent
     * @param {Object} allPageObjects the collection of all UTAM Page Objects to be parsed
     * @param {Object} parsedPageObject the Page Object representation
     */
    #processElements(pageObjectFragment, parentName, parentArgs, allPageObjects, parsedPageObject) {
        if (pageObjectFragment && pageObjectFragment.elements) {
            pageObjectFragment.elements.forEach(element => {
                let elementArgs = parentArgs.slice();
                let processedElement = this.#processElementObject(element, parentName, elementArgs, false, allPageObjects);
                parsedPageObject.elements[element.name] = processedElement;
                this.#processElements(element, element.name, elementArgs, allPageObjects, parsedPageObject);
            });
        }
        if (pageObjectFragment && pageObjectFragment.shadow && pageObjectFragment.shadow.elements) {
            pageObjectFragment.shadow.elements.forEach(element => {
                let elementArgs = parentArgs.slice();
                let processedElement = this.#processElementObject(element, parentName, elementArgs, true, allPageObjects);
                parsedPageObject.elements[element.name] = processedElement;
                this.#processElements(element, element.name, elementArgs, allPageObjects, parsedPageObject);
            });
        }
    }

    /**
     * Processes a single element object
     * @param {Object} elementObject the Page Object definition of a single element
     * @param {string} parentName the name of the parent within the Page Object definition
     * @param {Array} elementArgs the array of arguments for the element selector definition
     * @param {boolean} isInShadowRoot true if the element definition is part of a shadow root; otherwise false
     * @param {Object} allPageObjects the collection of all UTAM Page Objects to be parsed
     * @returns {Object} an object containing data about the element definition
     */
    #processElementObject(elementObject, parentName, elementArgs, isInShadowRoot, allPageObjects) {
        let selector = { };
        if (elementObject.selector && elementObject.selector.css) {
            Object.assign(selector, elementObject.selector);
        }
        const elementName = this.#getElementGetterMethodName(elementObject.name);
        if (selector.args) {
            elementArgs.push(...selector.args);
        }
        if (selector.returnAll && elementObject.filter && elementObject.filter.matcher && elementObject.filter.matcher.args) {
            elementArgs.push(...elementObject.filter.matcher.args);
        }
        const returnsList = selector.returnAll || (elementObject.filter?.findFirst ?? false);
        let category = DataTypes.BASIC;
        if (elementObject.type && (typeof(elementObject.type) === DataTypes.STRING || elementObject.type instanceof String)) {
            if (elementObject.type === DataTypes.CONTAINER) {
                category = DataTypes.CONTAINER;
            } else if (allPageObjects.hasOwnProperty(elementObject.type)) {
                category = DataTypes.PAGE_OBJECT;
            }
        }
        const description = this.#processDescription(elementObject)
        return {
            name: elementObject.name,
            displayName: elementName,
            description,
            effectiveArgs: elementArgs,
            type: elementObject.type,
            category: category,
            selector: selector,
            returnsList,
            filter: elementObject.filter,
            parent: parentName,
            public: elementObject.public ? true : false,
            isInShadowRoot: isInShadowRoot
        };
    }

    /**
     * Processes the methods of a Page Object definition
     * @param {Object} pageObject the source Page Object definition
     * @param {Object} allPageObjects the collection of all UTAM Page Objects to be parsed
     * @param {Object} parsedPageObject the parsed Page Object representation
     */
    #processMethods(pageObject, allPageObjects, parsedPageObject) {
        if (pageObject && pageObject.methods) {
            pageObject.methods.forEach(method => {
                let returnValue = this.#processMethod(pageObject, method, allPageObjects, parsedPageObject);
                parsedPageObject.methods[method.name] = returnValue;
            });
        }
    }

    /**
     * Processes a single method in a Page Object definition
     * @param {Object} pageObject the source Page Object definition
     * @param {Object} method the object representing the Page Object method
     * @param {Object} allPageObjects the collection of all UTAM Page Objects to be parsed
     * @param {Object} parsedPageObject the parsed Page Object representation
     * @returns {Object} the parsed method representation
     */
    #processMethod(pageObject, method, allPageObjects, parsedPageObject) {
        if (parsedPageObject.methods.hasOwnProperty(method.name)) {
            // If the parsed PO has the method with this name already, early return
            // the parsed method
            return parsedPageObject.methods[method.name];
        }

        const args = method.args || [];
        const referencedElements = [];
        let stepPageObject = pageObject;
        let stepParsedPageObject = parsedPageObject;
        let methodType = method.returnType || "";
        let lastStepReturnType = "";
        let lastMethodStepApply = "";

        // If the method itself declares a return type, we don't need
        // to parse the method steps.
        if (methodType.length === 0) {
            const methodSteps = method.compose || [];
            methodSteps.forEach(methodStep => {
                if (methodStep.chain && lastStepReturnType !== "") {
                    // Step is a chain step, using the results of the previous step.
                    stepPageObject = allPageObjects[lastStepReturnType];
                    if (!stepPageObject) {
                        console.log(`Aborting processing of method ${method.name} in ${parsedPageObject.uri}; method has a step that refers to ${lastStepReturnType} which does not exist.`)
                        return;
                    }
                    stepParsedPageObject = this.#parsePageObject(lastStepReturnType, allPageObjects);
                } else {
                    // Start by assigning the step PO and parsed PO for the step.
                    stepPageObject = pageObject;
                    stepParsedPageObject = parsedPageObject;
                }
                if (methodStep.applyExternal) {
                    // Methods with imperative extensions must declare their return type
                    // using the "return" property, or the step returns void.
                    if (methodType.length === 0) {
                        methodType = method.return || DataTypes.VOID;
                        lastMethodStepApply = methodStep.applyExternal;
                    }
                }
                if (methodStep.apply) {
                    // Set the last "apply" value to the current step's "apply" value,
                    // if it has one.
                    lastMethodStepApply = methodStep.apply;
                }

                const stepInfo = this.#processStep(stepPageObject, methodStep, allPageObjects, stepParsedPageObject);

                // If the step declares a return type, use it; otherwise, use the processed
                // return type of the step.
                if (methodStep.returnType) {
                    lastStepReturnType = methodStep.returnType;
                } else {
                    lastStepReturnType = stepInfo.returnType;
                }
                // Find any elements referenced by the step that are not already tracked by
                // the list of referenced elements for this method, and add them to that list.
                const unreferencedElements = stepInfo.referencedElements.filter(stepElement => !referencedElements.some(existingElementRef => existingElementRef.name === stepElement.name))
                referencedElements.push(...unreferencedElements);
            });
            methodType = lastStepReturnType;
            referencedElements.forEach(referencedElement => {
                if (referencedElement.effectiveArgs && referencedElement.effectiveArgs.length) {
                    args.push(...referencedElement.effectiveArgs);
                }
            });
        }
        const description = this.#processDescription(method);
        return {
            displayName: method.name,
            name: method.name,
            description,
            effectiveArgs: args,
            category: DataTypes.METHOD,
            type: methodType,
            public: true,
            lastStepApply: lastMethodStepApply,
            elements: referencedElements
        };
    }

    /**
     * Processes a step in a Page Object method.
     * @param {Object} pageObject the source Page Object definition
     * @param {Object} methodStep the object representing a step in a Page Object method
     * @param {Object} parsedPageObject the parsed Page Object representation
     * @returns the parsed method step representation
     */
    #processStep(pageObject, methodStep, allPageObjects, parsedPageObject) {
        const stepInfo = {
            referencedElements: [],
            returnType: "",
            returnsList: false
        }

        if (methodStep.applyExternal) {
            stepInfo.returnType = DataTypes.VOID;
            return stepInfo;
        }

        if (methodStep.element && methodStep.element !== DataTypes.ROOT) {
            if (methodStep.element === DataTypes.DOCUMENT) {
                // Don't do anything with a reference to the document element
                stepInfo.returnType = DataTypes.DOCUMENT;
            } else if (methodStep.element === DataTypes.NAVIGATION) {
                // Don't do anything with a reference to the navigation element
                stepInfo.returnType = DataTypes.NAVIGATION
            } else {
                // Add the element reference to the list of referenced elements in the step.
                let referencedElement = {};
                Object.assign(referencedElement, parsedPageObject.elements[methodStep.element]);
                if (referencedElement.category === DataTypes.CONTAINER && methodStep.args && methodStep.args.length > 0 && methodStep.args[0].type && methodStep.args[0].type === DataTypes.PAGE_OBJECT) {
                    // Replace type of "container" with the actual PO type, if available.
                    referencedElement.type = methodStep.args[0].value;
                }
                stepInfo.referencedElements.push(referencedElement);
                stepInfo.returnType = referencedElement.type || DataTypes.BASIC;
                stepInfo.returnsList = referencedElement.returnsList;
            }
        }
        if (methodStep.apply) {
            if (methodStep.apply === "waitFor") {
                // Create a temporary method to represent the "waitFor" predicate so,  and
                // parse it so we can interpret the return type of the waitFor statement.
                const waitForMethod = {
                    name: "tempWaitForMethod",
                    compose: methodStep.args[0].predicate || []
                };
                const parsedWaitForMethod = this.#processMethod(pageObject, waitForMethod, allPageObjects, parsedPageObject);
                stepInfo.referencedElements.push(...parsedWaitForMethod.elements);
                stepInfo.returnType = parsedWaitForMethod.type;
           } else if (!methodStep.element) {
                // Have "apply" property without "element" property, which means it's a reference
                // to a method in the PO.
                if (methodStep.apply === "returnSelf") {
                    // While technically the "returnSelf" action returns the current PO instance, to
                    // prevent confusing recursion in the display tree, we short-circuit that here by
                    // making the step return void.
                    stepInfo.returnType = DataTypes.VOID;
                } else if (parsedPageObject.methods.hasOwnProperty(methodStep.apply)) {
                    // The method being referenced has already been parsed.
                    stepInfo.referencedElements.push(...parsedPageObject.methods[methodStep.apply].elements);
                    stepInfo.returnType = parsedPageObject.methods[methodStep.apply].type;
                } else {
                    // The method being referenced has not yet been parsed; find the method in the
                    // source PO, and parse it, adding it to the parsed PO.
                    let calledMethod = null;
                    if (pageObject.methods) {
                        let methodIndex = 0;
                        while (calledMethod === null && methodIndex < pageObject.methods.length) {
                            if (pageObject.methods[methodIndex].name === methodStep.apply) {
                                calledMethod = pageObject.methods[methodIndex];
                            }
                            methodIndex++;
                        }
                    }
                    if (calledMethod !== null) {
                        let referencedMethod = this.#processMethod(pageObject, calledMethod, allPageObjects, parsedPageObject);
                        parsedPageObject.methods[calledMethod.name] = referencedMethod;
                        stepInfo.returnType = referencedMethod.type;
                    }    
                }
            } else {
                // The "apply" is an intrinsic method of an element, so find the return type
                // of the intrinsic method.
                const candidateIntrinsicMethods = Object.values(this.#intrinsicMethods).flatMap(
                    interfaceMethods => interfaceMethods.filter(
                        interfaceMethod => interfaceMethod.name === methodStep.apply));
                if (candidateIntrinsicMethods.length > 0) {
                    stepInfo.returnType = candidateIntrinsicMethods[0].type;
                }
            }
        }
        return stepInfo;
    }

    /**
     * Calculates the method name of an element getter method
     * @param {string} elementName 
     * @returns {string} the method name of an element getter method
     */
    #getElementGetterMethodName(elementName) {
        return `get${elementName.substring(0, 1).toUpperCase()}${elementName.substring(1)}`;
    }

    /**
     * Clears the Page Object cache and reloads it from the browser extension local storage.
     * @returns {number} the number of Page Objects loaded into the cache
     */
    async reloadDatabase() {
        this.rootPageObjectUris = [];
        this.#parsedPageObjectCache = {};

        const allPageObjects = {};
        const settings = new Settings();
        await settings.load();
        for (const [artifactName, artifactContents] of settings.pageObjects) {
            for (const pageObjectUri in artifactContents) {
                const source = artifactContents[pageObjectUri];
                const definition = {
                    ...JSON.parse(source),
                    artifact: artifactName,
                    source
                };
                allPageObjects[pageObjectUri] = definition;
                if (definition.root && definition?.selector?.css) {
                    this.rootPageObjectUris.push(pageObjectUri);
                }
            }
        }

        this.rootPageObjectUris.sort();

        // The need for two loops seems superfluous here, but #parsePageObject is
        // recursive, and preserves some of the relationships between POs, such as
        // when a method step returns a PO. So, we have to collect all of the POs
        // from the Settings object, and then process them as a whole, rather than
        // iteratively as we are parsing the JSON into objects.
        for (const pageObjectUri in allPageObjects) {
            this.#parsePageObject(pageObjectUri, allPageObjects);
        }
        return this.getAllPageObjectUris().length;
    }

    /**
     * Constructs a display name for a Page Object from its URI
     * @param {string} uri the URI of the UTAM Page Object
     * @returns the string to display as the name of the Page Object
     */
    pageObjectDisplayNameFromUri(uri) {
        const lastSlash = uri.lastIndexOf("/");
        return uri.substring(0, uri.indexOf("/")) + "/" + uri.substring(lastSlash + 1, lastSlash + 2).toUpperCase() + uri.substring(lastSlash + 2);
    }

    /**
     * Gets the public members of a UTAM Page Object's API
     * @param {string} pageObjectUri the URI for which to retrieve the members
     * @returns An object with the public members indexed by member name
     */
    getPageObjectPublicMembers(pageObjectUri) {
        const foundMembers = {};
        const allMembers = this.getPageObject(pageObjectUri);
        for (const memberName in allMembers.elements) {
            const member = allMembers.elements[memberName];
            if (member.public) {
                foundMembers[memberName] = member;
            }
        }
        for (const memberName in allMembers.methods) {
            const member = allMembers.methods[memberName];
            if (member.public) {
                foundMembers[memberName] = member;
            }
        }
        return foundMembers;   
    }

    /**
     * Gets the intrinsic methods for a basic element given the declared interfaces of the element type.
     * @param {string | string[] | undefined} type the interfaces declared by the basic element type
     * @returns {string[]} the list of intrinsic method names for each declared interface
     */
    getIntrinsicPublicMembers(type) {
        const foundMembers = {};
        this.#intrinsicMethods.basic.forEach(intrinsicMethod => foundMembers[intrinsicMethod.name] = intrinsicMethod);
        if (type) {
            const typeArray = Array.isArray(type) ? type : [type];
            typeArray.forEach(intrinsicInterface => {
                if (this.#intrinsicMethods.hasOwnProperty(intrinsicInterface)) {
                    this.#intrinsicMethods[intrinsicInterface].forEach(intrinsicMethod =>
                        foundMembers[intrinsicMethod.name] = intrinsicMethod);
                }
            });
        }

        return foundMembers;
    }

    /**
     * Gets the list of all Page Object URIs in the database.
     * @returns {string[]} the list of all Page Object URIs in the database
     */
    getAllPageObjectUris() {
        return Object.keys(this.#parsedPageObjectCache);
    }

    /**
     * Gets a value indicating whether the specified URI is a known
     * UTAM Page Object
     * @param {string} uri the URI to check if is a known Page Object
     * @returns {boolean} true if the URI represents a known Page Object; otherwise, false
     */
    isPageObjectUri(uri) {
        return this.#parsedPageObjectCache.hasOwnProperty(uri);
    }

    /**
     * Gets a UTAM Page Object representation from the cache.
     * @param {string} uri the URI for which to get the Page Object
     * @returns {Object} the representation of the UTAM Page Object
     */
    getPageObject(uri) {
        if (!this.isPageObjectUri(uri)) {
            return undefined;
        }

        return this.#parsedPageObjectCache[uri];
    }
}

export default PageObjectDatabase;
