/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Class representing a tab.
 */
class Tab {
    #contentElement = document.createElement("div");
    #listItemElement = document.createElement("li");

    id;

    /**
     * Initializes a new instance of the Tab class.
     * @param {string} id the ID of the tab
     * @param {string} displayTitle the title to display in the tab bar
     */
    constructor(id, displayTitle) {
        this.id = id;
        this.#configurePanel(displayTitle);
    }

    #configurePanel(displayTitle) {
        this.#contentElement.classList.add("slds-tabs_default__content", "slds-hide");
        this.#contentElement.id = this.id;
        this.#contentElement.role = "tabpanel";
        this.#contentElement.setAttribute("aria-labelledby", `${this.id}__item`);
        this.#configureListItem(displayTitle)
    }

    #configureListItem(displayTitle) {
        this.#listItemElement.classList.add("slds-tabs_default__item");
        this.#listItemElement.title = displayTitle;
        this.#listItemElement.role = "presentation";

        const tabLink = document.createElement("a");
        tabLink.classList.add("slds-tabs_default__link");
        tabLink.id = `${this.id}__item`;
        tabLink.tabIndex = 0;
        tabLink.role = "tab";
        tabLink.href = `#${this.id}__item`;
        tabLink.ariaSelected = "true";
        tabLink.setAttribute("aria-controls", this.id);
        tabLink.innerText = displayTitle;
        tabLink.addEventListener("click", (e) => {
            e.stopPropagation();
            this.onTabLinkClicked(this);
        });
        this.#listItemElement.appendChild(tabLink);
    }

    /**
     * Callback called when the link for this tab is clicked.
     * @param {Tab} tab the tab for which the link was clicked
     */
    onTabLinkClicked = (tab) => { }

    /**
     * Adds additional classes to the style of the root element of the tab panel.
     * @param {string[]} additionalStyles additional classes to add to the style root element of the tab panel
     */
    setAdditionalStyling(...additionalStyles) {
        this.#contentElement.classList.add(...additionalStyles);
    }

    /**
     * Gets the element containing the tab content.
     * @returns {Element} the element containing the tab content
     */
    getContentPanel() {
        return this.#contentElement;
    }

    /**
     * Gets the element containing the tab activation link.
     * @returns {Element} the element containing the tab activation link
     */
    getTabListItem() {
        return this.#listItemElement;
    }

    /**
     * Adds content to the tab.
     * @param {Element} tabContent the element containing the content to add to the tab
     */
    addContent(tabContent) {
        this.#contentElement.appendChild(tabContent);
    }

    /**
     * Activates this tab.
     */
    activate() {
        this.#listItemElement.classList.add("slds-is-active", "slds-has-focus");
        this.#contentElement.classList.replace("slds-hide", "slds-show");
    }

    /**
     * Deactivates this tab.
     */
    deactivate() {
        this.#listItemElement.classList.remove("slds-is-active", "slds-has-focus");
        this.#contentElement.classList.replace("slds-show", "slds-hide");
    }
}

/**
 * A class representing a set of tabbed elements, allowing the user to select one tab
 * at a time to be visible.
 */
class TabSet {
    #rootElement = document.createElement("div");
    #tabList = document.createElement("ul");
    #activeTab;

    /**
     * Initializes a new instance of the TabBar class.
     */
    constructor() {
        this.#rootElement.classList.add("slds-tabs_default");

        this.#configureTabBar();
        this.#rootElement.appendChild(this.#tabList);
    }

    #configureTabBar() {
        this.#tabList.classList.add("slds-tabs_default__nav");
        this.#tabList.role = "tabList";
    }

    #setActiveTab(tab) {
        this.#activeTab?.deactivate();
        this.#activeTab = tab;
        tab.activate();
        this.onTabActivated(tab);
    }

    onTabActivated = (tab) => { }

    /**
     * Gets the root element of the tab set.
     * @returns {Element} the root element of the tab set
     */
    getDomElement() {
        return this.#rootElement;
    }

    /**
     * Appends a tab into the tab set.
     * @param {Tab} tab the tab to append
     */
    appendTab(tab) {
        this.#rootElement.appendChild(tab.getContentPanel());
        this.#tabList.appendChild(tab.getTabListItem());
        tab.onTabLinkClicked = tab => this.#setActiveTab(tab);
        if (!this.#activeTab) {
            this.#setActiveTab(tab);
        }
    }
}

export { Tab, TabSet }
