/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Contains the string values for error codes used by the browser extension.
 */
class ErrorCodes {
    static NO_CONTENT_SCRIPT_CONNECTION = "no remote end";
    static NO_PAGE_OBJECTS_LOADED = "no page objects loaded";
    static NO_MATCHING_ROOT_PAGE_OBJECTS = "no root page objects matched";
    static NO_SUCH_NODE = "no node found";
}

export default ErrorCodes;
