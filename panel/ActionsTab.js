/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { DetailsPane } from "./DetailsPane.js"
import { Tab } from "./TabSet.js";
import { Tree } from "./Tree.js"

/**
 * The Actions tab of the main panel.
 */
class ActionsTab extends Tab {
    static ACTIONS_TAB_ID = "tab-default-actions";

    #actionsTabElement = document.createElement("div");
    #gridElement = document.createElement("div");
    #resizeObserver = new ResizeObserver((entries) => {
        this.#setGridOrientation();
    });

    /**
     * The tree containing Page Objects and their members.
     * @type {Tree}
     */
    tree = new Tree("tree-root");

    /**
     * The details pane containing details about the currently selected node in the tree.
     * @type {DetailsPane}
     */
    details = new DetailsPane();

    /**
     * Initializes a new instance of the ActionsTab class.
     */
    constructor() {
        super(ActionsTab.ACTIONS_TAB_ID, "Actions");
        this.setAdditionalStyling("utam-extension-fixed", "utam-tab-content");
        this.#gridElement.classList.add("slds-grid", "utam-extension-fixed");
        this.#gridElement.appendChild(this.#createPageObjectColumn());
        this.#gridElement.appendChild(this.#createDetailsColumn());
        this.#resizeObserver.observe(this.#gridElement);
        this.#actionsTabElement.appendChild(this.#gridElement);
        this.addContent(this.#actionsTabElement);
    }

    #createPageObjectColumn() {
        const column = document.createElement("div");
        column.classList.add("slds-col", "slds-size_2-of-3", "slds-scrollable", "utam-extension-fixed", "utam-tree");
        this.tree.setLabelText("Select Page Object Methods:");
        column.appendChild(this.tree.getDomElement());
        return column;
    }

    #createDetailsColumn() {
        const column = document.createElement("div");
        column.classList.add("slds-col", "slds-size_1-of-3", "slds-scrollable", "utam-extension-fixed");
        column.appendChild(this.details.getDomElement());
        return column;
    }

    #setGridOrientation() {
        if (this.#gridElement.offsetHeight > this.#gridElement.offsetWidth) {
            this.#gridElement.classList.add("slds-grid_vertical");
            let columns = this.#gridElement.querySelectorAll(".slds-col");
            columns[0].classList.remove("slds-size_2-of-3")
            columns[1].classList.remove("slds-size_1-of-3")
        } else {
            this.#gridElement.classList.remove("slds-grid_vertical");
            let columns = this.#gridElement.querySelectorAll(".slds-col");
            columns[0].classList.add("slds-size_2-of-3")
            columns[1].classList.add("slds-size_1-of-3")
        }
    }
}

export { ActionsTab }
