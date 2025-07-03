"use strict";
figma.showUI(__html__, { width: 400, height: 600 });
const getStructure = (node) => {
    const structure = {
        id: node.id,
        name: node.name,
        type: node.type,
        children: [],
    };
    if ('children' in node && node.children) {
        structure.children = node.children.map(getStructure);
    }
    return structure;
};
const countNodes = (node) => {
    let count = 1; // Count the node itself
    if ('children' in node && node.children) {
        for (const child of node.children) {
            count += countNodes(child);
        }
    }
    return count;
};
figma.ui.onmessage = msg => {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
        figma.ui.postMessage({ type: 'no-selection' });
        return;
    }
    const selectedNode = selection[0];
    if (msg.type === 'get-layer-data') {
        const structure = getStructure(selectedNode);
        const nodeCount = countNodes(selectedNode);
        let warning = undefined;
        if (nodeCount > 500) {
            warning = `Warning: The selected frame contains ${nodeCount} layers. This is a large selection and may result in a slow or failed request. For best results, select a smaller, more specific frame.`;
        }
        selectedNode.exportAsync({ format: 'JPG', constraint: { type: 'WIDTH', value: 1024 } })
            .then(imageData => {
            figma.ui.postMessage({ type: 'layer-data', structure, imageData, warning });
        })
            .catch(error => {
            figma.ui.postMessage({ type: 'error', message: error.message });
        });
    }
    else if (msg.type === 'get-screenshot') {
        selectedNode.exportAsync({ format: 'JPG', constraint: { type: 'WIDTH', value: 1024 } })
            .then(imageData => {
            figma.ui.postMessage({ type: 'screenshot-data', imageData });
        })
            .catch(error => {
            figma.ui.postMessage({ type: 'error', message: error.message });
        });
    }
};
