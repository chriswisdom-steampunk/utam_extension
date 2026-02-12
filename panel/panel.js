/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import ErrorCodes from "../common/ErrorCodes.js";
import Messages from "../common/Messages.js";
import { BackgroundConnection, ConnectionLogOptions } from "./BackgroundConnection.js";
import { PanelSet } from "./PanelSet.js";
import { TreeNode } from "./TreeNode.js";

// Create the panel set, and get the main panel from the set.
const panelSet = new PanelSet();
const mainPanel = panelSet.getPanel("main-panel");

// Attach event handlers to the panel set.
panelSet.getPanel("no-connection-panel").onReloadClick = () => backgroundConnection.postMessage(Messages.RELOAD_BROWSER_PAGE);
panelSet.getPanel("import-panel").onImportStart = () => panelSet.showPanel("loading-panel");
panelSet.getPanel("import-panel").onImportCompleted = async () => {
    backgroundConnection.postMessage(Messages.UPDATE_PAGE_OBJECT_DATABASE);
    await mainPanel.settingsTab.update();
};
panelSet.getPanel("start-panel").onStartClick = () => {
    backgroundConnection.postMessage(Messages.LOCATE_ROOT_PAGE_OBJECTS);
    panelSet.showPanel("main-panel");
    mainPanel.actionsTab.activate();
};

// Attach event handlers to main panel tabs, then initialize the tabs.
mainPanel.settingsTab.onImportStart = () => panelSet.showPanel("loading-panel");
mainPanel.settingsTab.onImportCompleted = async () => {
    backgroundConnection.postMessage(Messages.UPDATE_PAGE_OBJECT_DATABASE);
    await mainPanel.settingsTab.update();
};
mainPanel.settingsTab.onHighlightStyleChanged = () => {
    backgroundConnection.postMessage(Messages.UPDATE_HIGHLIGHTER_FORMAT);
};

mainPanel.actionsTab.details.argsDisplay.onArgumentChangesApplied = () => {
    // Update the tree node for the selected member once arguments have
    // been given values.
    let selectedTreeNode = mainPanel.actionsTab.tree.getSelectedNode();
    selectedTreeNode.args.forEach(arg => {
        const argValue = mainPanel.actionsTab.details.argsDisplay.getArgumentValue(arg.name);
        if (arg.type === "number") {
            arg.value = parseInt(argValue);
        } else {
            arg.value = argValue;
            if (arg.type === "pageobject") {
                const treeNodeId = selectedTreeNode.getId();
                backgroundConnection.postMessage(Messages.UPDATE_CONTAINER_CONTENT_TYPE, { nodeId: treeNodeId, contentType: arg.value });
            }
        }
    });
    selectedTreeNode.updateCaption();
    // Do not need to update the arguments display, because we've
    // just added values to arguments.
    mainPanel.actionsTab.details.codeDisplay.updateCodeLines(selectedTreeNode.getMethodCallPath());
    mainPanel.actionsTab.details.argsDisplay.toggleVisibility();
};

mainPanel.actionsTab.tree.onResetClicked = () => {
    backgroundConnection.postMessage(Messages.LOCATE_ROOT_PAGE_OBJECTS);
}

await mainPanel.initializeTabs();

// Debugging assistance: You can set properties of the log options
// to capture messaging traffic in the connection to the background
// service worker script. The default is to log no traffic at all.
const connectionLogOptions = new ConnectionLogOptions();
const backgroundConnection = new BackgroundConnection(connectionLogOptions);
backgroundConnection.onMessage = message => {
    switch (message.type) {
        case Messages.PAGE_OBJECT_DATABASE_UPDATED:
        case Messages.CONTENT_SCRIPT_INITIALIZED:
            if (message.data.pageObjectCount) {
                panelSet.getPanel("start-panel").setPageObjectCount(message.data.pageObjectCount);
                panelSet.showPanel("start-panel");
            } else {
                panelSet.showPanel("import-panel");
            }
            break;
        case Messages.BROWSER_PAGE_RELOADED:
            panelSet.showPanel("start-panel");
            break;
        case Messages.ROOT_PAGE_OBJECTS_LOCATED:
            listRootPageObjects(message.data.located);
            break;
        case Messages.EXPAND_NODE_RESULT:
            listPageObjectMembers(message.data.located, message.data.parent);
            break;
        case Messages.CONTAINER_CONTENT_TYPES_RESULT:
            listContainerContentTypes(message.data.nodeId, message.data.contentTypes);
            break;
        case Messages.CONTAINER_CONTENT_TYPE_UPDATED:
            containerContentTypeUpdated(message.data.nodeId, message.data.selectedType, message.data.members);
            break;
        case Messages.CONTAINER_CONTENT_TYPE_RESET:
            containerContentTypeReset(message.data.nodeId);
            break;
        case Messages.ERROR:
            if (message.data.error !== ErrorCodes.NO_MATCHING_ROOT_PAGE_OBJECTS) {
                showErrorPanel(message.data.error, message.data.message);
            }
            break;
    }
};

/**
 * Shows the error panel when an error is reported from the content script.
 * @param {string} errorCode the error code of the error
 * @param {string} errorMessage the message of the error reported
 */
function showErrorPanel(errorCode, errorMessage) {
    console.log("Received error '" + errorCode + "' from UTAM browser extension content script: " + errorMessage);
    panelSet.showPanel("no-connection-panel");
}

/**
 * Adds entries for valid root Page Objects, those with elements
 * matching their root selectors in the currently loaded document,
 * to the tree.
 * @param {Object} matchedPageObjects an object containing matched Page Object descriptions
 */
function listRootPageObjects(matchedPageObjects) {
    mainPanel.actionsTab.details.reset();
    mainPanel.actionsTab.tree.clear();
    for (const name in matchedPageObjects) {
        const matchedPageObject = matchedPageObjects[name];
        let treeNode = new TreeNode({
            parentNodeId: "",
            name: matchedPageObject.displayName,
            type: matchedPageObject.type,
            category: matchedPageObject.category,
            description: matchedPageObject.description,
            args: undefined,
            memberIdentifier: matchedPageObject.type,
            nodeLevel: 1
        });
        treeNode.onExpand = e => backgroundConnection.postMessage(Messages.EXPAND_NODE, e);
        treeNode.onMouseOver = e => backgroundConnection.postMessage(Messages.HIGHLIGHT_ELEMENT, e);
        treeNode.onMouseOut = () => backgroundConnection.postMessage(Messages.CLEAR_HIGHLIGHT);
        treeNode.onContainerSelect = e => backgroundConnection.postMessage(Messages.GET_CONTAINER_CONTENT_TYPES, e);
        treeNode.onSelect = e => mainPanel.actionsTab.details.update(e.methodCallPath, e.args);
        mainPanel.actionsTab.tree.addNode("", treeNode);
    }
}

/**
 * Adds entries for the members of a Page Object to the tree.
 * @param {Object} childElements an object containing descriptors of all of the members of the specified node
 * @param {string} parentNodeId the ID of the parent node in the tree to which to add child nodes for the members
 */
function listPageObjectMembers(childElements, parentNodeId) {
    let parentTreeNode = mainPanel.actionsTab.tree.getNode(parentNodeId);
    const nodeLevel = parentTreeNode.getNodeLevel();
    let treeNodes = [];
    for (const elementName in childElements) {
        const childElement = childElements[elementName];
        const type = Array.isArray(childElement.type) ?
            "Basic element implementing " + childElement.type.join(", ") :
            childElement.type ?? "Basic element";
        let treeNode = new TreeNode({
            parentNodeId,
            name: childElement.displayName,
            type,
            category: childElement.category,
            description: childElement.description,
            args: childElement.effectiveArgs,
            memberIdentifier: elementName,
            nodeLevel: nodeLevel + 1
        });
        treeNode.onExpand = e => backgroundConnection.postMessage(Messages.EXPAND_NODE, e);
        treeNode.onMouseOver = e => backgroundConnection.postMessage(Messages.HIGHLIGHT_ELEMENT, e);
        treeNode.onMouseOut = () => backgroundConnection.postMessage(Messages.CLEAR_HIGHLIGHT);
        treeNode.onContainerSelect = e => backgroundConnection.postMessage(Messages.GET_CONTAINER_CONTENT_TYPES, e);
        treeNode.onSelect = e => mainPanel.actionsTab.details.update(e.methodCallPath, e.args);
        treeNodes.push(treeNode);
    }
    treeNodes.sort((first, second) => first.displayName.localeCompare(second.displayName));
    mainPanel.actionsTab.tree.addNodes(parentNodeId, treeNodes);
}

/**
 * Creates entries for selecting the Page Object within a UTAM container.
 * @param {string} nodeId the ID of the node in the tree having the container
 * @param {Array} contentTypes a list of all Page Object types
 */
function listContainerContentTypes(nodeId, contentTypes) {
    let treeNode = mainPanel.actionsTab.tree.getNode(nodeId);
    mainPanel.actionsTab.details.update(treeNode.getMethodCallPath(), treeNode.args, contentTypes);
}

/**
 * Updates the tree with the members of a selected Page Object type when selected for a container.
 * @param {string} nodeId the ID of the node in the tree having the container
 * @param {string} selectedType the type of Page Object chosen to represent the contents of the container
 * @param {Object} members an object containing descriptors of all of the members of the Page Object type in the container
 */
function containerContentTypeUpdated(nodeId, selectedType, members) {
    let parentTreeNode = mainPanel.actionsTab.tree.getNode(nodeId);
    parentTreeNode.showExpandButton();
    parentTreeNode.type = selectedType;
    mainPanel.actionsTab.tree.removeNodes(parentTreeNode.removeChildNodes());
    listPageObjectMembers(members, nodeId);
}

/**
 * Removes the children of a tree node representing a container.
 * @param {string} nodeId the ID of the node in the tree having the container
 */
function containerContentTypeReset(nodeId) {
    let parentTreeNode = mainPanel.actionsTab.tree.getNode(nodeId);
    parentTreeNode.hideExpandButton();
    parentTreeNode.type = "container";
    mainPanel.actionsTab.tree.removeNodes(parentTreeNode.removeChildNodes());
}
