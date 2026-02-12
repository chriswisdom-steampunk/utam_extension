/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import ErrorCodes from "../common/ErrorCodes.js";
import Messages from "../common/Messages.js";

const connections = {};

/**
 * Gets the DevTools tab name for the connection with the specified browser tab ID.
 * @param {number} tabId the ID of the browser tab for which to get the DevTools tab name
 * @returns {string|null} the DevTools tab name if it exists for the browser tab ID; otherwise, null
 */
function getDevToolsTabNameForTabId(tabId) {
    for (const devToolsTabName in connections) {
        if (connections[devToolsTabName].tabId === tabId) {
          return devToolsTabName;
        }
    }
    return null;
}

/**
 * Gets the port for the browser tab with the specified browser tab ID
 * @param {number} tabId the ID of the browser tab for which to retrieve the port
 * @returns the Port object for the specified tab ID; or null if it does not exist
 */
function getPortForTab(tabId) {
    const devToolsTabName = getDevToolsTabNameForTabId(tabId);
    if (devToolsTabName) {
        return connections[devToolsTabName].port;
    }
    return null;
}

// Adds listener for the DevTools page
chrome.runtime.onConnect.addListener(port => {
    // Listen to messages sent from the DevTools page
    port.onMessage.addListener((message, sender) => {
        // Commented log lines for ease of debugging. Uncomment below to trace messages.
        // console.log("Background script received message from port " + sender.name + ":");
        // console.log(message);
        switch (message.type) {
            case Messages.INITIALIZE_PANEL:
            case Messages.RECONNECT_PANEL:
                // The original connection event doesn't include the tab ID of the
                // DevTools page, so we need to send it explicitly.
                connections[sender.name] = { port: port, tabId: message.data.tabId };
                if (message.type === Messages.INITIALIZE_PANEL) {
                    chrome.tabs.sendMessage(message.data.tabId, { type: Messages.UPDATE_PAGE_OBJECT_DATABASE })
                        .catch((err) => port.postMessage(
                            { type: Messages.ERROR, data: { error: ErrorCodes.NO_CONTENT_SCRIPT_CONNECTION, message: err.message } }));
                }
                break;
            case Messages.RELOAD_BROWSER_PAGE:
                chrome.tabs.reload(connections[sender.name].tabId);
                break;
            case Messages.UPDATE_PAGE_OBJECT_DATABASE:
            case Messages.LOCATE_ROOT_PAGE_OBJECTS:
            case Messages.HIGHLIGHT_ELEMENT:
            case Messages.CLEAR_HIGHLIGHT:
            case Messages.UPDATE_HIGHLIGHTER_FORMAT:
            case Messages.EXPAND_NODE:
            case Messages.GET_CONTAINER_CONTENT_TYPES:
            case Messages.UPDATE_CONTAINER_CONTENT_TYPE:
                // Forward the message from the sender (the DevTools panel) directly on
                // to the content script in the tab without modification of the data.
                const tabId = connections[sender.name].tabId;
                chrome.tabs.sendMessage(tabId, message)
                    .then((response) => {
                        if (response) {
                            const tabPort = getPortForTab(tabId);
                            tabPort.postMessage(response);
                        }
                    })
                    .catch((err) => connections[sender.name].port.postMessage(
                        { type: Messages.ERROR, data: { error: ErrorCodes.NO_CONTENT_SCRIPT_CONNECTION, message: err.message } }));
                break;
        };
    });

    // Listen for disconnection of the port (e.g., when the DevTools window is closed),
    // and remove it from the list of active connections
    port.onDisconnect.addListener(port => {
        delete connections[port.name];
    });
});

// Receive message from content script and relay to the DevTools page for the current tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Messages from content scripts should have sender.tab set
    if (sender.tab) {
        const tabId = sender.tab.id;
        const port = getPortForTab(tabId);
        if (port) {
            port.postMessage(message);
        } else {
            console.log("Tab not found in connection list.");
        }
    } else {
        console.log("sender.tab not defined.");
    }
    if (sendResponse) {
        sendResponse({});
        return true;
    }
    return false;
});

// Handle refreshes and navigation of a tab being monitored
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // On a refresh, the url property of changeInfo will be undefined.
    // On an explicit navigation, the url property will be populated
    // during the "loading" status.
    if (changeInfo.status === "loading" && changeInfo.url) {
        const port = getPortForTab(tabId);
        if (port) {
            port.postMessage({ type: Messages.BROWSER_PAGE_RELOADED });
        }
    }
});
