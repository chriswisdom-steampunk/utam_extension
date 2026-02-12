/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { Icon } from "./Icon.js";
import { Popover } from "./Popover.js";

/**
 * The tree of TreeNodes representing the hierarchy of Page Objects in the document being browsed.
 */
class Tree {
    #rootElement = document.createElement("div");
    #resetButtonElement = document.createElement("button");
    #labelElement = document.createElement("h4");
    #treeRoot = document.createElement("ul");
    #popover = new Popover(Popover.CALLOUT_POSITION_RIGHT, Popover.POPOVER_SIZE_LARGE);
    #nodes = {}

    /**
     * Initializes a new instance of the Tree class.
     * @param {string} id the ID to use for the tree
     */
    constructor(id) {
        this.#rootElement.classList.add("slds-tree_container", "utam-tree-container");

        this.#configureResetButton();
        this.#configureLabel(id);
        
        const headerDiv = this.#createHeader();
        this.#rootElement.appendChild(headerDiv);

        this.#configureTreeRoot(id);
        this.#rootElement.appendChild(this.#treeRoot);

        this.#popover.onCloseClicked = () => {
            this.#clearAllInfoPopups();
        };
        this.#rootElement.appendChild(this.#popover.getDomElement());
    }

    #createHeader() {
        const headerDiv = document.createElement("div");
        headerDiv.classList.add("slds-float_clearfix");

        const resetButtonWrapper = document.createElement("div");
        resetButtonWrapper.classList.add("slds-float_right");

        resetButtonWrapper.appendChild(this.#resetButtonElement);
        headerDiv.appendChild(resetButtonWrapper);

        headerDiv.appendChild(this.#labelElement);
        
        return headerDiv;
    }

    #configureLabel(id) {
        this.#labelElement.classList.add("slds-tree__group-header", "utam-tree-header");
        this.#labelElement.id = `${id}-label`;
    }

    #configureTreeRoot(id) {
        this.#treeRoot.classList.add("slds-tree");
        this.#treeRoot.id = id;
        this.#treeRoot.role = "tree";
        this.#treeRoot.setAttribute("aria-labelledby", `${id}-label`);
    }

    #configureResetButton() {
        this.#resetButtonElement.classList.add("slds-button", "slds-button_icon", "slds-button_icon-container");
        this.#resetButtonElement.id = "reset-selection";

        const icon = new Icon("slds-button__icon");
        icon.setExternalLinkPath("../img/utility-icons.svg#refresh");
        this.#resetButtonElement.appendChild(icon.getDomElement());

        const assistiveText = document.createElement("span");
        assistiveText.classList.add("slds-assistive-text");
        assistiveText.textContent = "Reset Selection";
        this.#resetButtonElement.appendChild(assistiveText);
        this.#resetButtonElement.addEventListener("click", e => {
            e.stopPropagation();
            this.onResetClicked();
        });
    }

    #showSelectedItemInfoPopover(showInfoButton, popoverHeaderText, popoverBodyText) {
        // Clear all aria-haspopup = "true" first.
        this.#clearAllInfoPopups();
        if (showInfoButton.offsetParent) {
            showInfoButton.offsetParent.appendChild(this.#popover.getDomElement());
            const left = showInfoButton.offsetLeft;
            const top = showInfoButton.offsetTop + (showInfoButton.getBoundingClientRect().height / 2);
            this.#popover.setHeaderText(popoverHeaderText);
            this.#popover.setText(popoverBodyText);
            this.#popover.showPopover();
            showInfoButton.ariaHasPopup = "true";
            this.#popover.setLocation(left, top);
        }
     }

    #clearAllInfoPopups() {
        return [...document.querySelectorAll("li [aria-haspopup='true")]
            .forEach(el => el.ariaHasPopup = "false");
    }

    /**
     * Gets the root element of the tree.
     * @returns {Element} the root element of the tree
     */
    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Called when the reset button is clicked.
     */
    onResetClicked = () => { };

    /**
     * Sets the label text of the tree.
     * @param {string} labelText the text to which to set the label
     */
    setLabelText(labelText) {
        this.#labelElement.textContent = labelText;
    }

    /**
     * Adds a TreeNode to the tree as children of the specified parent node.
     * @param {string} parentNodeId the ID of the parent node to which to add the TreeNode
     * @param {TreeNode} treeNode the node to add to the tree
     */
    addNode(parentNodeId, treeNode) {
        this.addNodes(parentNodeId, [treeNode]);
    }

    /**
     * Adds a list of TreeNodes to the tree as children of the specified parent node.
     * @param {string} parentNodeId the ID of the parent node to which to add the TreeNode
     * @param {TreeNode[]} treeNodes the list of nodes to add to the tree
     */
    addNodes(parentNodeId, treeNodes) {
        treeNodes.forEach(treeNode => {
            treeNode.onInfoButtonClicked = (e => {
                this.#showSelectedItemInfoPopover(e, treeNode.displayName, treeNode.getDescription());
            });
            this.#nodes[treeNode.getId()] = treeNode;

            // If there is no parent ID, we are adding nodes to the tree root.
            if (parentNodeId === "") {
                this.#treeRoot.append(treeNode.getDomElement());
            }
        });

        // We are adding nodes to a child node already in the tree.
        if (parentNodeId !== "") {
            this.#nodes[parentNodeId].addChildNodes(treeNodes);
        }
    }

    /**
     * Removes a TreeNode with the specified ID from the tree.
     * @param {string} treeNodeId the node to remove from the tree
     */
    removeNode(treeNodeId) {
        this.removeNodes([treeNodeId]);
    }

    /**
     * Removes a list of TreeNode with the specifed IDs from the tree.
     * @param {string[]} treeNodeIdList the list of IDs of nodes to remove from the tree
     */
    removeNodes(treeNodeIdList) {
        treeNodeIdList.forEach(treeNodeId => delete this.#nodes[treeNodeId]);
    }

    /**
     * Gets the currently selected node in the tree.
     * @returns {TreeNode} the currently selected node in the tree
     */
    getSelectedNode() {
        const selectedNode = document.querySelector("li[aria-selected='true']");
        const nodeId = selectedNode.getAttribute("data-tree-node-id");
        return this.getNode(nodeId);
    }

    /**
     * Gets the TreeNode from the tree with the specified ID.
     * @param {string} nodeId the ID of the node to get from the tree
     * @returns {TreeNode|undefined} the node from the tree or undefined if the node ID does not exist in the tree
     */
    getNode(nodeId) {
        return this.#nodes[nodeId];
    }

    /**
     * Clears the tree of all nodes.
     */
    clear() {
        let removedNodes = [];
        for (const nodeId in this.#nodes) {
            removedNodes.push(...this.#nodes[nodeId].removeChildNodes(), nodeId);
        }
        this.removeNodes(removedNodes);
        while (this.#treeRoot.firstChild) {
            this.#treeRoot.firstChild.remove();
        }
    }
}

export { Tree }
