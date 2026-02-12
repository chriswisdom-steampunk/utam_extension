/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/**
 * Class for the describing a node in the list of known nodes in the document.
 */
class MemberNodeDescriptor {
    /**
     * The ID of the node.
     */
    id;

    /**
     * The type of the value represented by this node.
     */
    type;

    /**
     * The DOM element connected to this node.
     */
    element;

    /**
     * The arguments used in resolving this node.
     */
    args;

    /**
     * Initializes a new instance of the MemberNodeDescriptor class.
     */
    constructor(id, type, element, args) {
        this.id = id;
        this.type = type;
        this.element = element;
        this.args = args;
    }
}


/**
 * A collection of selected MemberNodeDescriptor objects ih the Page Object tree.
 */
class MemberNodeDescriptorCollection {
    #selectedNodes = {};

    /**
     * Initializes a new instance of the MemberNodeDescriptorCollection class.
     */
    constructor() {
    }

    /**
     * Adds a MemberNodeDescriptor to the collection.
     * @param {string} nodeId the unique ID of the node
     * @param {MemberNodeDescriptor} nodeDescriptor the MemberNodeDescriptor to add to the collection
     */
    add(nodeId, nodeDescriptor) {
        this.#selectedNodes[nodeId] = nodeDescriptor;
    }

    /**
     * Gets a value indicating whether the specified ID exists in the collection.
     * @param {string} nodeId the ID of the node to check for
     * @returns {boolean} true if the node ID exists in the collection; otherwise false
     */
    contains(nodeId) {
        return this.#selectedNodes.hasOwnProperty(nodeId);
    }

    /**
     * Gets the MemberNodeDescriptor for the specified node ID.
     * @param {string} nodeId the ID of the node to retrieve
     * @returns {MemberNodeDescriptor|undefined} the MemberNodeDescriptor for the ID, or undefined if the node ID is invalid.
     */
    getMemberNodeDescriptor(nodeId) {
        return this.#selectedNodes[nodeId];
    }

    /**
     * Updates the node descriptor with the given ID to have the specified type, if it exists.
     * @param {string} nodeId the ID of the node to update
     * @param {string} contentType the type to which to update the node
     */
    updateMemberNodeDescriptorType(nodeId, contentType) {
        let descriptor = this.getMemberNodeDescriptor(nodeId);
        if (descriptor) {
            descriptor.type = contentType;
        }
    }
}

export { MemberNodeDescriptor, MemberNodeDescriptorCollection };
