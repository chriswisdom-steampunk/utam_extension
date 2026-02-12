/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Contains string values for the messages used by the browser extension.
 */
class Messages {
    static INITIALIZE_PANEL = "init";
    static RECONNECT_PANEL = "reconnect";

    static CONTENT_SCRIPT_INITIALIZED = "initContent";

    static RELOAD_BROWSER_PAGE = "reload";
    static BROWSER_PAGE_RELOADED = "tabNavigated";

    static UPDATE_PAGE_OBJECT_DATABASE = "updateCache";
    static PAGE_OBJECT_DATABASE_UPDATED = "cacheUpdated";

    static HIGHLIGHT_ELEMENT = "highlight";
    static CLEAR_HIGHLIGHT = "clearHighlight";
    static UPDATE_HIGHLIGHTER_FORMAT = "updateHighlighterFormat";

    static EXPAND_NODE = "expand";
    static EXPAND_NODE_RESULT = "expandChildren";

    static GET_CONTAINER_CONTENT_TYPES = "queryContainerContentTypes";
    static CONTAINER_CONTENT_TYPES_RESULT = "containerContentTypeQueryResults";

    static UPDATE_CONTAINER_CONTENT_TYPE = "updateContainerContentType";
    static CONTAINER_CONTENT_TYPE_UPDATED = "containerContentTypeUpdated";
    static CONTAINER_CONTENT_TYPE_RESET = "containerContentTypeReset";

    static LOCATE_ROOT_PAGE_OBJECTS = "locate";
    static ROOT_PAGE_OBJECTS_LOCATED = "locatedRootPageObjects";

    static ERROR = "error";
}

export default Messages;
