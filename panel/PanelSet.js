/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import { ArtifactImporter } from "./ArtifactImporter.js";
import { ActionsTab } from "./ActionsTab.js";
import { SettingsTab } from "./SettingsTab.js";
import { TabSet } from "./TabSet.js";

/**
 * A panel in the browser extension.
 */
class Panel {
    /**
     * The unique ID of the panel.
     */
    id;

    #panelElement;

    /**
     * Initializes a new instance of the Panel class.
     * @param {string} id the unique ID of the panel
     * @param {Element} panelElement the element in the DOM that represents the panel.
     */
    constructor(id, panelElement) {
        this.id = id;
        this.#panelElement = panelElement;
    }

    /**
     * Shows the panel.
     */
    show() {
        this.#panelElement.classList.remove("slds-hide");
    }

    /**
     * Hides the panel.
     */
    hide() {
        this.#panelElement.classList.add("slds-hide");
    }
}

/**
 * The panel displayed when there is no connection to
 * the content script in the document being browsed.
 */
class NoConnectionPanel extends Panel {
    constructor() {
        super("no-connection-panel", document.getElementById("no-connection-panel"));
        document.getElementById("reload-button").addEventListener("click", e => this.onReloadClick());        
    }

    /**
     * Callback function called when the Reload button of the panel is clicked.
     */
    onReloadClick = () => { }
}

/**
 * The panel displayed when there are no Page Objects imported
 * into the browser extension storage.
 */
class ImportPanel extends Panel {
    #importer = new ArtifactImporter();

    /**
     * Initializes a new instance of the ImportPanel class.
     */
    constructor() {
        const panelElement = document.getElementById("import-panel");
        super("import-panel", panelElement);
        this.#importer.setButtonText("Import");
        this.#importer.setButtonStyling("slds-button_neutral");
        this.#importer.onImportStart = () => this.onImportStart();
        this.#importer.onImportCompleted = () => this.onImportCompleted();
        panelElement.appendChild(this.#importer.getDomElement());
    }

    /**
     * Callback function called when the import is starting.
     */
    onImportStart = () => { }

    /**
     * Callback function called when the import has completed.
     */
    onImportCompleted = () => { }
}

/**
 * Panel displayed while a Page Object artifact is being imported.
 */
class LoadingPanel extends Panel {
    /**
     * Initializes a new instance of the LoadingPanel class.
     */
    constructor() {
        super("loading-panel", document.getElementById("loading-panel"));
    }
}

/**
 * Panel displayed when starting the process of locating
 * a Page Object in the document being browsed.
 */
class StartPanel extends Panel {
    #pageObjectCountElement = document.getElementById("page-object-count");

    /**
     * Initializes a new instance of the StartPanel class.
     */
    constructor() {
        super("start-panel", document.getElementById("start-panel"));
        document.getElementById("start-button").addEventListener("click", e => this.onStartClick());
    }

    /**
     * Callback function called when the Find button of the panel is clicked.
     */
    onStartClick = () => { }

    /**
     * Sets the Page Object count displayed in the panel caption.
     * @param {string} count the Page Object count displayed in the panel caption
     */
    setPageObjectCount(count) {
        this.#pageObjectCountElement.innerText = count;
    }
}

/**
 * The main panel used to locate Page Objects in the browser extension.
 */
class MainPanel extends Panel {
    actionsTab = new ActionsTab();
    settingsTab = new SettingsTab();

    /**
     * The tab set of the main panel.
     */
    #tabSet = new TabSet();

    /**
     * Initializes a new instance of the MainPanel class.
     */
    constructor() {
        const panelElement = document.getElementById("main-panel");
        super("main-panel", panelElement);
        this.#tabSet.appendTab(this.actionsTab);
        this.#tabSet.appendTab(this.settingsTab);
        this.#tabSet.onTabActivated = (tab) => {
            if (tab.id === SettingsTab.SETTINGS_TAB_ID) {
                this.settingsTab.updateHighlighter();
            }
        };
        panelElement.appendChild(this.#tabSet.getDomElement());
    }

    async initializeTabs() {
        // Set the actions tab language selector to the default value from storage.
        // Note: Must call settingsTab.update() to load settings from storage.
        await this.settingsTab.update();
        this.actionsTab.details.setLanguage(this.settingsTab.getDefaultLanguage());
    }
}

/**
 * The set of panels loaded in the browser extension.
 */
class PanelSet {
    #panels = {}

    /**
     * Initializes a new instance of the PanelSet class.
     */
    constructor() {
        this.addPanel(new NoConnectionPanel());
        this.addPanel(new ImportPanel());
        this.addPanel(new LoadingPanel());
        this.addPanel(new StartPanel());
        this.addPanel(new MainPanel());
    }

    /**
     * Adds a Panel to the set.
     * @param {Panel} panel the Panel to add to the set.
     */
    addPanel(panel) {
        this.#panels[panel.id] = panel;
    }

    /**
     * Shows the indicated panel from the set, hiding all others.
     * @param {string} panelIdentifier the unique identifier for the panel within the set
     */
    showPanel(panelIdentifier) {
        for (const id in this.#panels) {
            if (panelIdentifier === this.#panels[id].id) {
                this.#panels[id].show();
            } else {
                this.#panels[id].hide();
            }
        }
    }

    /**
     * Gets a panel from the set.
     * @param {string} panelIdentifier the unique identifier for the panel within the set
     * @returns {Panel|undefined} the panel from the set, or undefined if the ID is not in the set
     */
    getPanel(panelIdentifier) {
        if (panelIdentifier in this.#panels) {
            return this.#panels[panelIdentifier];
        }

        return undefined;
    }
}

export { PanelSet }
