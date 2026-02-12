/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import DataTypes from "../common/DataTypes.js";
import ErrorCodes from "../common/ErrorCodes.js";
import ElementFinder from "./ElementFinder.js";
import Highlighter from "./Highlighter.js";
import { MemberNodeDescriptor, MemberNodeDescriptorCollection } from "./MemberNodeDescriptor.js";
import Messages from "../common/Messages.js";
import PageObjectDatabase from "./PageObjectDatabase.js";

/**
 * Gets a value indicating whether the element descriptor type is for a basic element.
 * @param {string | string[] | undefined} type the type specified in the element descriptor element descriptor
 * @returns true if the element descriptor type is for a basic element; otherwise, false
 */
function isElementDescriptorTypeBasic(type) {
    return !type ||
        Array.isArray(type) ||
        (typeof type === 'string' || type instanceof String) && !type.includes("/") ||
        type === DataTypes.NAVIGATION ||
        type === DataTypes.DOCUMENT;
}

/**
 * Highlights an element described by a Page Object or one of its methods
 * @param {string} parentNodeId the node identifier of the parent node
 * @param {string} identifier the identifier in the Page Object for the element
 * @param {Array} args the array of arguments in the selector for the element
 */
function findElementToHighlight(parentNodeId, identifier, args) {
    let element = null;

    if (selectedNodes.contains(parentNodeId)) {
        if (identifier.includes("/")) {
            // Identifier is a PO type and nodes have already been selected, meaning
            // we have a list of types for a container element.
            return;
        }

        const parentNodeDescriptor = selectedNodes.getMemberNodeDescriptor(parentNodeId);
        const parentType = parentNodeDescriptor.type;
        if (isElementDescriptorTypeBasic(parentType)) {
            // If the parent node type is for something that is not a custom PO,
            // then the current node is for an intrinsic method of a basic element.
            // Return the parent element so that the correct element will be
            // highlighted by the highlighter.
            return parentNodeDescriptor.element;
        }
        const parentPageObject = pageObjectDb.getPageObject(parentType);
        const parentPageObjectPublicMembers = pageObjectDb.getPageObjectPublicMembers(parentType);
        if (Object.keys(parentPageObjectPublicMembers).length === 0) {
            return element;
        }
        const elementDescriptor = parentPageObjectPublicMembers[identifier];
        element = elementFinder.walkElements(parentNodeDescriptor.element, elementDescriptor, args, parentPageObject.elements);
    } else {
        // An unknown node is selected; highlighting appropriate root POs, all of which should
        // have a "root" element.
        element = elementFinder.findElement(pageObjectDb.getPageObject(identifier).elements[DataTypes.ROOT].selector.css);
    }
    return element;
}

/**
 * Evaluates all root Page Objects and sends a message with the set of all root
 * Page Objects where there is a match on the current page for the selector in
 * the Page Object's `root` property.
 */
function locateValidRootPageObjects() {
    let found = {};

    if (pageObjectDb.rootPageObjectUris.length === 0) {
        return {
            type: Messages.ERROR,
            data: {
                error: ErrorCodes.NO_PAGE_OBJECTS_LOADED,
                message: "No UTAM Page Objects have been loaded into extension storage"
            }
        };
    }

    pageObjectDb.rootPageObjectUris.forEach(rootPageObjectUri => {
        const pageObjectName = pageObjectDb.pageObjectDisplayNameFromUri(rootPageObjectUri);
        const pageObject = pageObjectDb.getPageObject(rootPageObjectUri);
        const rootSelector = pageObject.elements[DataTypes.ROOT].selector;
        if (rootSelector.css) {
            const element = elementFinder.findElement(rootSelector.css);
            if (element) {
                // Found an element matching the root selector, now let's make sure
                // there's at least one other element matching a selector in the PO
                // before returning it, if any others are defined. Ignore any
                // selectors with parameters, as we can't reliably fill in those
                // parameters to call querySelector with.
                let isValid = Object.keys(pageObject.elements).length <= 1;
                for (const elementName in pageObject.elements) {
                    // Already checked root element, so no need to check again
                    if (elementName !== DataTypes.ROOT) {
                        const childElement = pageObject.elements[elementName];
                        const childSelector = childElement.selector?.css;
                        if (childElement.effectiveArgs.length === 0 && childSelector && elementFinder.findElement(childSelector)) {
                            isValid = true;
                            break;
                        }
                    }
                }
                if (isValid) {
                    found[pageObjectName] = {
                        type: rootPageObjectUri,
                        description: pageObject.description,
                        category: DataTypes.ROOT,
                        selector: rootSelector,
                        displayName: pageObjectName
                    };
                }
            }
        }
    });

    if (Object.keys(found).length === 0) {
        return {
            type: Messages.ERROR,
            data: {
                error: ErrorCodes.NO_MATCHING_ROOT_PAGE_OBJECTS,
                message: "No elements on the current page match any loaded root Page Objects"
            }
        };
    }

    return { type: Messages.ROOT_PAGE_OBJECTS_LOCATED, data: { located: found } };
}

/**
 * Gets the children of a Page Object associated with an element
 * @param {string} nodeId the ID of the node 
 * @param {string} elementIdentifier the identifier of the element to expand within the node
 * @param {string} parentNodeId the ID of the parent node in the tree of nodes
 * @param {Array} args the array of arguments with which to expand the nodes
 */
function expandNode(nodeId, elementIdentifier, parentNodeId, args) {
    let found = {};
    if (selectedNodes.contains(parentNodeId)) {
        const parentNodeDescriptor = selectedNodes.getMemberNodeDescriptor(parentNodeId);
        const parentType = parentNodeDescriptor.type;
        const parentElement = parentNodeDescriptor.element;
        const parentPageObject = pageObjectDb.getPageObject(parentType);
        if (parentPageObject.methods.hasOwnProperty(elementIdentifier)) {
            // User is selecting a method of a previously selected page object.
            const methodDescriptor = parentPageObject.methods[elementIdentifier];
            const element = elementFinder.walkElements(parentElement, methodDescriptor, args, parentPageObject.elements);
            selectedNodes.add(nodeId, new MemberNodeDescriptor(parentType + "." + elementIdentifier, methodDescriptor.type, element, args));
            if (pageObjectDb.isPageObjectUri(methodDescriptor.type)) {
                found = pageObjectDb.getPageObjectPublicMembers(methodDescriptor.type);
            }
        } else if (parentPageObject.elements.hasOwnProperty(elementIdentifier)) {
            // User is selecting an element getter method of a previously selected page object.
            const elementDescriptor = parentPageObject.elements[elementIdentifier];
            const element = elementFinder.walkElements(parentElement, elementDescriptor, args, parentPageObject.elements);
            selectedNodes.add(nodeId, new MemberNodeDescriptor(parentType + "." + elementIdentifier, elementDescriptor.type, element, args));
            if (pageObjectDb.isPageObjectUri(elementDescriptor.type)) {
                found = pageObjectDb.getPageObjectPublicMembers(elementDescriptor.type);
            } else if (elementDescriptor.category === DataTypes.BASIC) {
                found = pageObjectDb.getIntrinsicPublicMembers(elementDescriptor.type);
            }
        } else if (pageObjectDb.isPageObjectUri(elementIdentifier)) {
            // User is selecting the page object type contained in a container element.
            const element = elementFinder.walkElements(parentElement, elementIdentifier, args, parentPageObject.elements);
            selectedNodes.add(nodeId, new MemberNodeDescriptor(elementIdentifier, elementIdentifier, element, args));
            found = pageObjectDb.getPageObjectPublicMembers(elementIdentifier);
        }
    } else {
        // User is expanding a root page object.
        found = pageObjectDb.getPageObjectPublicMembers(elementIdentifier);
        const selector = pageObjectDb.getPageObject(elementIdentifier).elements[DataTypes.ROOT].selector;
        if (selector.css) {
            const element = elementFinder.findElement(selector.css);
            selectedNodes.add(nodeId, new MemberNodeDescriptor(elementIdentifier, elementIdentifier, element, []));
        }
    }

    return { type: Messages.EXPAND_NODE_RESULT, data: { located: found, parent: nodeId } };
}

/**
 * Gets the list of Page Object types that are potentially inside a container.
 * @param {string} nodeId the ID of the container node
 * @param {string} elementIdentifier the element within a Page Object
 * @param {string} parentNodeId the ID of the parent node
 * @param {Array} args the array of arguments with which to get the container list
 */
function queryContainerContentTypes(nodeId, elementIdentifier, parentNodeId, args) {
    if (selectedNodes.contains(parentNodeId)) {
        if (!selectedNodes.contains(nodeId)) {
            const parentNodeDescriptor = selectedNodes.getMemberNodeDescriptor(parentNodeId);
            const parentType = parentNodeDescriptor.type;
            const parentElement = parentNodeDescriptor.element;
            const parsedPageObject = pageObjectDb.getPageObject(parentType);
            if (parsedPageObject.elements.hasOwnProperty(elementIdentifier)) {
                // User is selecting an element getter method of a previously selected page object.
                const elementDescriptor = parsedPageObject.elements[elementIdentifier];
                const element = elementFinder.walkElements(parentElement, elementDescriptor, args, parsedPageObject.elements);
                selectedNodes.add(
                    nodeId,
                    new MemberNodeDescriptor(parentType + "." + element, elementDescriptor.type, element, args));
            }
        }
        const containerElement = selectedNodes.getMemberNodeDescriptor(nodeId).element
        const foundPageObjects = scoreContainerPageObjects(containerElement, args);
        return {
            type: Messages.CONTAINER_CONTENT_TYPES_RESULT,
            data: {
                nodeId: nodeId,
                contentTypes: foundPageObjects
            }
        };
    }
    return {
        type: Messages.ERROR,
        data: {
            error: ErrorCodes.NO_SUCH_NODE,
            message: "No node matching the node ID '" + parentNodeId + "' was found"
        }
    }
}

/**
 * Calculates a score representing the likelihood that each Page Object can be found on the current document.
 * @param {string} containerElement the DOM element of the container
 * @param {Array} args the args to use when resolving the element
 * @returns A list of all Page Objects, sorted by the calculated score
 */
function scoreContainerPageObjects(containerElement, args) {
    let scoredPageObjects = [];
    pageObjectDb.getAllPageObjectUris().forEach((uri) => {
        const pageObject = pageObjectDb.getPageObject(uri);
        const displayName = pageObjectDb.pageObjectDisplayNameFromUri(uri)
        let compat = { uri: uri, displayName: displayName, score: 0 };
        let pageObjectElements = pageObject.elements;
        for (const elementIdentifier in pageObjectElements) {
            const elementDescriptor = pageObjectElements[elementIdentifier];
            if (elementFinder.walkElements(containerElement, elementDescriptor, args, pageObjectElements)) {
                compat.score += 1;
            }
        }
        scoredPageObjects.push(compat);
    });
    scoredPageObjects.sort((first, second) => second.score - first.score);
    return scoredPageObjects;
}

/**
 * Updates a container to contain a specified type.
 * @param {string} nodeId the ID of the node to update
 * @param {string} contentType the type to which the container should be updated to contain
 */
function updateContainerContentType(nodeId, contentType) {
    if (selectedNodes.contains(nodeId)) {
        if (contentType.length === 0) {
            // User has selected to reset the container type to its
            // initial value. Return the proper message type to update
            // the UI to remove the now-invalid child methods in the
            // tree.
            selectedNodes.updateMemberNodeDescriptorType(nodeId, DataTypes.CONTAINER);
            return {
                type: Messages.CONTAINER_CONTENT_TYPE_RESET,
                data: {
                    nodeId
                }
            };
        }
        selectedNodes.updateMemberNodeDescriptorType(nodeId, contentType);
        const contentTypeMembers = pageObjectDb.getPageObjectPublicMembers(contentType);
        return {
            type: Messages.CONTAINER_CONTENT_TYPE_UPDATED,
            data: {
                nodeId,
                selectedType: contentType,
                members: contentTypeMembers
            }
        };
    }
    return {
        type: Messages.ERROR,
        data: {
            error: ErrorCodes.NO_SUCH_NODE,
            message: "No node matching the node ID '" + nodeId + "' was found"
        }
    }
}

/**
 * Updates the Page Object database, reloading its contents from the extension storage.
 * @param {string} updateType the type of update (initial load or refresh)
 */
function updatePageObjectDatabase(updateType) {
    pageObjectDb.reloadDatabase().then(pageObjectCount => {
        chrome.runtime.sendMessage({ type: updateType, data: { pageObjectCount } });
    });
}

/**
 * Sets the style of the highlighter element using the styles stored in the extension storage.
 */
function setHighlighterStyle() {
    highlighter.loadStyleFromStorage().then(style => {
        if (style) {
            highlighter.setStyle(style);
        }
    });
}

let pageObjectDb = null;
let highlighter = null;
let selectedNodes = null;
let elementFinder = null;

/**
 * Main function used to dynamically import classes.
 */
export function main() {
    highlighter = new Highlighter();
    pageObjectDb = new PageObjectDatabase();
    selectedNodes = new MemberNodeDescriptorCollection();
    elementFinder = new ElementFinder(uri => pageObjectDb.getPageObject(uri));

    updatePageObjectDatabase(Messages.CONTENT_SCRIPT_INITIALIZED);
    setHighlighterStyle();

    // Adds a listener for messages sent from other parts of the browser extension.
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Commented log lines for ease of debugging. Uncomment below to trace messages.
        // console.log("Content script received message:");
        // console.log(message);
        switch(message.type) {
            case Messages.UPDATE_PAGE_OBJECT_DATABASE:
                // Because updatePageObjectCache returns a Promise, we cannot use the
                // synchronous sendResponse() to return the result, because we must
                // wait for the Promise to be fulfilled. Note that we also cannot use
                // async/await, as the listener function cannot be async.
                updatePageObjectDatabase(Messages.PAGE_OBJECT_DATABASE_UPDATED);
                break;
            case Messages.HIGHLIGHT_ELEMENT:
                highlighter.highlight(
                    findElementToHighlight(
                        message.data.parent,
                        message.data.element,
                        message.data.args));
                break;
            case Messages.CLEAR_HIGHLIGHT:
                highlighter.clear();
                break;
            case Messages.UPDATE_HIGHLIGHTER_FORMAT:
                setHighlighterStyle();
                break;
            case Messages.EXPAND_NODE:
                sendResponse(
                    expandNode(
                        message.data.nodeId,
                        message.data.element,
                        message.data.parentNodeId,
                        message.data.args));
                break;
            case Messages.GET_CONTAINER_CONTENT_TYPES:
                sendResponse(
                    queryContainerContentTypes(
                        message.data.nodeId,
                        message.data.element,
                        message.data.parentNodeId,
                        message.data.args));
                break;
            case Messages.UPDATE_CONTAINER_CONTENT_TYPE:
                sendResponse(
                    updateContainerContentType(
                        message.data.nodeId,
                        message.data.contentType));
                break;
            case Messages.LOCATE_ROOT_PAGE_OBJECTS:
                highlighter.clear();
                sendResponse(locateValidRootPageObjects());
                break;
        }
        return false;
    });
}
