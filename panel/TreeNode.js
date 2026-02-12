/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import DataTypes from "../common/DataTypes.js";
import { Icon } from "./Icon.js";

/**
 * A node in the tree.
 */
class TreeNode {
    /**
     * Node types that will not have an expansion chevron in the tree.
     */
    static NON_EXPANDABLE_TYPES = new Set([
        DataTypes.METHOD,
        DataTypes.CONTAINER,
        DataTypes.VOID,
        DataTypes.STRING,
        DataTypes.NUMBER,
        DataTypes.BOOLEAN,
        DataTypes.DOCUMENT,
        DataTypes.NAVIGATION
    ]);

    /**
     * {string} The unique ID of the node in the tree.
     */
    #id;

    /**
     * {string} The ID of the node's parent in the tree.
     */
    parentNodeId;

    /**
     * {string} The display name shown in the tree.
     */
    displayName;

    /**
     * {Array} The list of arguments used to locate the element in the document.
     */
    args;

    /**
     * {string} The type of the item represented by this tree node.
     */
    type;

    #description;
    #category;
    #treeNodeElement;
    #expandButton = document.createElement("button");
    #infoButton = document.createElement("button");
    #childNodes = {}

    /**
     * Initializes a new instance of the TreeNode class.
     * @param {object} nodeInfo object containing information about the object represented by the tree node
     */
    constructor(nodeInfo) {
        const { parentNodeId, name, description, category, type, args, memberIdentifier, nodeLevel } = nodeInfo;
        this.#id = crypto.randomUUID();
        this.parentNodeId = parentNodeId;
        this.displayName = name;
        this.type = type;
        this.#category = category;
        this.#description = description;
        this.#create(parentNodeId, name, type, args, memberIdentifier, nodeLevel);
    }

    /**
     * Callback function called when the mouse is hovered over this node.
     * @param {Object} e object containing information about the mouse over operation
     */
    onMouseOver = (e) => { }

    /**
     * Callback function called when the mouse leaves this node.
     */
    onMouseOut = () => { }

    /**
     * Callback function called when the expand button is clicked on this node, if this node has children.
     * @param {Object} e object containing information about the expand operation
     */
    onExpand = (e) => { }

    /**
     * Callback function called when this node is selected in the tree.
     * @param {Object} e object containing information about the selection operation
     */
    onSelect = (e) => { }

    /**
     * Callback function called when this node is selected in the tree and the node or one of its arguments is container object.
     * @param {Object} e object containing information about the selection operation
     */
    onContainerSelect = (e) => { }

    /**
     * Callback function called when the node's info button is clicked.
     * @param {Element} button the info button element being clicked
     */
    onInfoButtonClicked = (button) => { };

    #createIcon() {
        const icon = new Icon("slds-button__icon", "slds-button__icon_small");
        icon.setExternalLinkPath("../img/utility-icons.svg#chevronright");
        return icon.getDomElement();
    }

    #createAssistiveTextElement() {
        const buttonAssistiveTextElement = document.createElement("span");
        buttonAssistiveTextElement.classList.add("slds-assistive-text");
        buttonAssistiveTextElement.innerText = "Expand";
        return buttonAssistiveTextElement;
    }

    #configureExpandButton(type) {
        this.#expandButton.classList.add("slds-button", "slds-button_icon", "slds-m-right_x-small");
        if (TreeNode.NON_EXPANDABLE_TYPES.has(type)) {
            this.hideExpandButton();
        }
        this.#expandButton.ariaHidden = "true";
        this.#expandButton.tabIndex = "-1";

        const iconElement = this.#createIcon();
        const buttonAssistiveTextElement = this.#createAssistiveTextElement();
        this.#expandButton.appendChild(iconElement);
        this.#expandButton.appendChild(buttonAssistiveTextElement);
    }

    #configureInfoButton() {
        this.#infoButton.classList.add("slds-button", "slds-button_icon", "slds-hide");

        const icon = new Icon("slds-button__icon", "slds-button__icon_small");
        icon.setExternalLinkPath("../img/utility-icons.svg#help");
        icon.getDomElement().style.transform = "none";
        this.#infoButton.appendChild(icon.getDomElement());

        const assistiveText = document.createElement("span");
        assistiveText.classList.add("slds-assistive-text");
        assistiveText.textContent = "Info";
        this.#infoButton.appendChild(assistiveText);
        this.#infoButton.addEventListener("click", e => {
            e.stopPropagation();
            this.onInfoButtonClicked(e.currentTarget);
        });
    }

    #createTextElement(name) {
        const treeItemTextElement = document.createElement("span");
        treeItemTextElement.classList.add("slds-has-flexi-truncate");

        const innerSpan = document.createElement("span");
        innerSpan.classList.add("slds-tree__item-label", "slds-truncate");
        innerSpan.title = name;
        treeItemTextElement.appendChild(innerSpan);
        return treeItemTextElement;
    }

    #create(parentNodeId, name, type, args, memberIdentifier, nodeLevel) {
        this.#configureExpandButton(type);
        this.#expandButton.addEventListener("click", e => {
            e.stopPropagation();
            const buttonTreeItem = e.currentTarget.parentNode.parentNode;
            if (buttonTreeItem.querySelector("ul")) {
                if (buttonTreeItem.ariaExpanded === "true") {
                    buttonTreeItem.ariaExpanded = "false";
                } else {
                    buttonTreeItem.ariaExpanded = "true";
                }
            } else {
                const elementName = parentNodeId !== "" ? memberIdentifier : buttonTreeItem.getAttribute("data-page-object-type");
                this.onExpand({
                    parentNodeId: parentNodeId,
                    element: elementName,
                    nodeId: this.#id,
                    args: args
                });
            }
        });
    
        const treeItemTextElement = this.#createTextElement(name);
        this.#configureInfoButton();
   
        const treeItemElement = document.createElement("div");
        treeItemElement.classList.add("slds-tree__item");
        treeItemElement.appendChild(this.#expandButton);
        treeItemElement.appendChild(treeItemTextElement);
        treeItemElement.appendChild(this.#infoButton);

        this.#treeNodeElement = document.createElement("li");
        this.#treeNodeElement.setAttribute("data-tree-node-id", this.#id);
        this.#treeNodeElement.role = "treeitem";
        this.#treeNodeElement.ariaLevel = nodeLevel.toString();
        this.#treeNodeElement.appendChild(treeItemElement);

        if (args) {
            this.args = args;
            if (type === DataTypes.CONTAINER) {
                this.args.push({ name: "pageObjectType", type: DataTypes.PAGE_OBJECT });
            }
        }
    
        this.updateCaption();
    
        this.#treeNodeElement.addEventListener("mousemove", e => {
            e.stopPropagation();
            this.onMouseOver({
                parent: parentNodeId,
                element: memberIdentifier,
                args: this.args
            });
        });
        this.#treeNodeElement.addEventListener("mouseout", e => {
            this.onMouseOut();
        });
        this.#treeNodeElement.addEventListener("click", e => {
            e.stopPropagation();
            [...document.querySelectorAll("li[aria-selected='true']")].forEach(el => el.ariaSelected = "false");
            e.currentTarget.ariaSelected = "true";
            [...document.querySelectorAll("li button.slds-show")].forEach(el => {
                el.classList.remove("slds-show");
                el.classList.add("slds-hide");
            });
            this.#infoButton.classList.remove("slds-hide");
            this.#infoButton.classList.add("slds-show");
            if (type === DataTypes.CONTAINER) {
                this.onContainerSelect({
                    nodeId: this.#id,
                    element: memberIdentifier,
                    parentNodeId: parentNodeId,
                    args: args
                });
            } else {
                this.onSelect({
                    nodeId: this.#id,
                    element: memberIdentifier,
                    args: args,
                    methodCallPath: this.getMethodCallPath()
                });
            }
        });
    
        if (type.includes("/")) {
            this.#treeNodeElement.setAttribute("data-page-object-type", type);
        }
        if (type !== memberIdentifier) {
            this.#treeNodeElement.setAttribute("data-page-object-method-name", memberIdentifier);
        }
    }

    #getArgumentString() {
        let paramText = "";
        if (this.args) {
            this.args.forEach(arg => {
                if (paramText.length) {
                    paramText = paramText + ", ";
                }
                if (arg.value) {
                    if (arg.type === "string") {
                        paramText = paramText + "\"" + arg.value + "\"";
                    } else if (arg.type === DataTypes.PAGE_OBJECT) {
                        const uri = arg.value;
                        const firstSlash = uri.indexOf("/");
                        const secondSlash = uri.indexOf("/", firstSlash + 1);
                        paramText = paramText + uri.slice(0, firstSlash) + uri.slice(secondSlash);
                    } else {
                        paramText = paramText + arg.value;
                    }
                } else {
                    paramText = paramText + arg.name;
                }
            });    
        }
        return paramText;
    }

    /**
     * Gets the ID of this tree node.
     * @returns the ID of this tree node
     */
    getId() {
        return this.#id;
    }

    /**
     * Gets the DOM element representing this node in the tree.
     * @returns {Element} the DOM element representing this node in the tree
     */
    getDomElement() {
        return this.#treeNodeElement;
    }

    /**
     * Adds a TreeNode as a child of this node.
     * @param {TreeNode} node the child node to add to this node
     */
    addChildNode(node) {
        this.addChildNodes([node])
    }

    /**
     * Adds a list of TreeNodes as children to this node.
     * @param {Array} nodes the list of child nodes to add to this node
     */
    addChildNodes(nodes) {
        let listElement = this.#treeNodeElement.querySelector("ul");
        if (!listElement) {
            listElement = document.createElement("ul");
            listElement.role = "group";
            this.#treeNodeElement.append(listElement);
        }
        nodes.forEach(node => {
            listElement.append(node.getDomElement());
            this.#childNodes[node.getId()] = node;
        });
        this.#treeNodeElement.ariaExpanded = "true";
    }

    /**
     * Removes the child nodes from this node.
     * @returns {Array} the list of IDs of all nodes reomved by this operation
     */
    removeChildNodes() {
        const removedNodes = [];
        for (const nodeId in this.#childNodes) {
            removedNodes.push(...this.#childNodes[nodeId].removeChildNodes());
            delete this.#childNodes[nodeId];
            removedNodes.push(nodeId);
        }
        const listElement = this.#treeNodeElement.querySelector("ul");
        if (listElement) {
            listElement.remove();
        }
        return removedNodes;
    }

    /**
     * Shows the button used to expand the node to display its children.
     */
    showExpandButton() {
        this.#expandButton.classList.remove("slds-hidden");
    }

    /**
     * Hides the button used to expand the node to display its children.
     */
    hideExpandButton() {
        this.#expandButton.classList.add("slds-hidden");
    }

    /**
     * Updates the displayed text of this tree node.
     */
    updateCaption() {
        let caption = this.displayName;
        if (this.args) {
            caption = caption + "(" + this.#getArgumentString() + ")";
        }
        this.#treeNodeElement.querySelector("span.slds-tree__item-label").innerText = caption;
    }

    /**
     * Gets the list of methods from the root used to navigate to this tree node.
     * @returns {Array} the list of methods from the root used to navigate to this tree node
     */
    getMethodCallPath() {
        let element = this.#treeNodeElement;
        const methodCallPath = [];
        while (element.parentNode.tagName.toLowerCase() == "ul") {
            const span = element.querySelector("span.slds-tree__item-label");
            const displayText = "." + span.innerText;
            methodCallPath.push(displayText);
            element = element.parentNode.parentNode;
        }
        methodCallPath.reverse();
        return methodCallPath;
    }

    /**
     * Gets the description of this tree node.
     * @returns {string} the description of this tree node.
     */
    getDescription() {
        if (this.#description) {
            if (this.#category === "root") {
                return `${this.#description}<br><br>Root Page Object`;
            }
            return `${this.#description}<br><br>returns: ${this.type}`;
        } else {
            if (this.#category === "root") {
                return `Root page object of type ${this.type}`;
            } else if (this.#category === "method") {
                return `Method on Page Object<br><br>returns: ${this.type}`;
            } else if (this.#category === "basic" || this.#category === "pageobject") {
                return `Element getter<br><br>returns: ${this.type}`;
            } else if (this.#category === "container") {
                if (this.type === "container") {
                    return "Container element requiring selection of contained content";
                } else {
                    return `Container element containing Page Object of type ${this.type}`;
                }
            }
        }

        return `Method returning ${this.type}`;
    }

    /**
     * Gets the level or depth of the node in the tree.
     * @returns the level or depth of the node in the tree
     */
    getNodeLevel() {
        return parseInt(this.#treeNodeElement.ariaLevel);
    }
}

export { TreeNode }
