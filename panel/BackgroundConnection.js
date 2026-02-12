/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import Messages from "../common/Messages.js"

/**
 * Logging options for logging communication traffic with the background service worker script.
 */
class ConnectionLogOptions {    
    /**
     * A list of messages to ignore when logging.
     * @type {string[]}
     */
    #ignoredMessages = [];

    /**
     * Gets or sets a value indicating whether to log connection messages
     * to the background service worker script. Defaults to false.
     * @type {boolean}
     */
    logConnectionMessages = false;

    /**
     * Gets or sets a value indicating whether to log messages sent
     * to the background service worker script. Defaults to false.
     * @type {boolean}
     */
    logSentMessages = false;

    /**
     * Gets or sets a value indicating whether to log messages received
     * from the background service worker script. Defaults to false.
     * @type {boolean}
     */
    logReceivedMessages = false;

    /**
     * Intializes a new instance of the ConnectionLogOptions class.
     * @param {boolean} logConnectionMessages value indicating whether to log connection messages (defaults to false)
     * @param {boolean} logSentMessages value indicating whether to log messages sent to the background service worker script (defaults to false)
     * @param {boolean} logReceivedMessages value indicating whether to log messages received from the background worker service script (defaults to false)
     * @param  {...string} ignoredMessages a list of messages to be ignored during traffic logging
     */
    constructor(logConnectionMessages = false, logSentMessages = false, logReceivedMessages = false, ...ignoredMessages) {
        this.logConnectionMessages = logConnectionMessages;
        this.logSentMessages = logSentMessages;
        this.logReceivedMessages = logReceivedMessages;
        this.#ignoredMessages.push(...ignoredMessages);
    }

    /**
     * Checks to see if a message should be ignored during logging.
     * @param {string} message the message to check if it is ignored for logging
     * @returns {boolean} true if the message should be ignored; otherwise false
     */
    isIgnoredMessage(message) {
        return this.#ignoredMessages.includes(message);
    }

    /**
     * Ignores specific messages when logging.
     * @param  {...string} messages a list of messages to be ignored when logging message traffic
     */
    ignoreMessages(...messages) {
        this.#ignoredMessages.push(...messages);
    }

    /**
     * Clears all previously ignored messages when logging.
     */
    clearIgnoredMessages() {
        this.#ignoredMessages.length = 0;
    }
}

/**
 * A class to handle communication with the background service worker script.
 */
class BackgroundConnection {
    #backgroundPageConnection

    /**
     * Gets or sets the logging options for this background connection.
     * @type {ConnectionLogOptions}
     */
    logOptions;

    /**
     * Initializes a new instance of the BackgroundConnection class.
     * @param {ConnectionLogOptions} logOptions the options for logging traffic in the background connection
     */
    constructor(logOptions = new ConnectionLogOptions()) {
        this.logOptions = logOptions;
        this.#createConnection(true);
    }

    #createConnection(isInitialConnection) {
        // Create a connection to the background page
        this.#backgroundPageConnection = chrome.runtime.connect({
            name: `utam-devtools-page-${crypto.randomUUID()}`
        });

        if (this.logOptions.logConnectionMessages) {
            const connectionLog = isInitialConnection
                ? `Created initial connection to background script ${this.#backgroundPageConnection.name}`
                : `Previous connection to background script terminated; created new connection ${this.#backgroundPageConnection.name}`;
            this.#logMessage(connectionLog);
        }

        // Set up listner for incoming messages.
        this.#backgroundPageConnection.onMessage.addListener(message => {
            if (this.logOptions.logReceivedMessages && !this.logOptions.isIgnoredMessage(message.type)) {
                this.#logMessage(`Received message from background script:\n${JSON.stringify(message)}`);
            }
            this.onMessage(message);
        });

        // Set up listner for disconnection.
        this.#backgroundPageConnection.onDisconnect.addListener(port => {
            this.#backgroundPageConnection = null;
            if (this.logOptions.logConnectionMessages) {
                this.#logMessage(`Port for ${port.name} disconnecting; next command must reconnect`);
            }
        });

        // We send a different message to the background service worker script
        // depending on whether this is the initial connection, or a reconnection
        // from a disconnected port.
        const connectionMessage = isInitialConnection ? Messages.INITIALIZE_PANEL : Messages.RECONNECT_PANEL;
        this.postMessage(connectionMessage, { tabId: chrome.devtools.inspectedWindow.tabId });
    }

    #logMessage(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    /**
     * Callback function called when a message is received from the background service worker script.
     */
    onMessage = (message) => { };

    /**
     * Posts a message to the background service worker.
     * @param {string} messageType the type of message to post
     * @param {Object} messageContent the data of the message to post (defaults to an empty object)
     */
    postMessage(messageType, messageContent = {}) {
        // The background connnection will be null if the remote end
        // disconnects (e.g., when the background service worker gets
        // suspended)l
        if (!this.#backgroundPageConnection) {
            this.#createConnection();
        }

        const message = { type: messageType, data: messageContent };

        if (this.logOptions.logSentMessages && !this.logOptions.isIgnoredMessage(messageType)) {
            this.#logMessage(`Posting message to background script:\n${JSON.stringify(message)}`);
        }

        this.#backgroundPageConnection.postMessage(message);
    }
}

export { BackgroundConnection, ConnectionLogOptions }
