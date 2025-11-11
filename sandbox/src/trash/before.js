import cytoscape from "cytoscape";
import edgehandles from "cytoscape-edgehandles";
import contextMenus from "cytoscape-context-menus";
import "cytoscape-context-menus/cytoscape-context-menus.css";

function initcy(container) {
    cytoscape.use(edgehandles);
    cytoscape.use(contextMenus);

    const cy = cytoscape({
        container,
        elements: [],
        style: []
    });

    return cy;
}

function setupContextMenu(cy, nextIdRef) {
    const addItem = {
        id: "add-node",
        content: "add node",
        selector: "node",
        coreAsWell: true,
        onClickFunction: (event) => {
            const id = `n${nextIdRef.value++}`;
            const text = prompt("Enter node text:", "new node");

            cy.add({
                data: { id, label: id, text },
                position: event.position,
            });
        }
    }

    const removeItem = {
        id: "remove",
        content: "remove",
        selector: "node, edge",
        onClickFunction: (event) => {
            event.target.remove();
        },
    };

    const eh = cy.edgehandles();
    const addEdgeItem = {
        id: "add-edge",
        content: "add edge",
        selector: "node",
        onClickFunction: (event) => {
            eh.start(event.target);
        }
    };

    return cy.contextMenus({
        evtType: "cxttap",
        menuItems: [addItem, removeItem, addEdgeItem]
    });
}

export function setupSimpleTooltip(cy) {
    const tooltip = document.createElement("div");
    tooltip.className = "cy-tooltip";
    tooltip.style.position = "absolute";
    tooltip.style.pointerEvents = "none";
    tooltip.style.padding = "6px 8px";
    tooltip.style.borderRadius = "6px";
    tooltip.style.background = "rgba(0,0,0,0.8)";
    tooltip.style.color = "white";
    tooltip.style.fontSize = "24px";

    tooltip.style.display = "none";
    document.body.appendChild(tooltip);

    function show(node, pageX, pageY) {
        tooltip.textContent = node.data("text") || "(no text)";
        tooltip.style.left = pageX + 10 + "px";
        tooltip.style.top = pageY + 10 + "px";
        tooltip.style.display = "block";
    }

    function move(pageX, pageY) {
        tooltip.style.left = pageX + 10 + "px";
        tooltip.style.top = pageY + 10 + "px";
    }

    function hide() {
        tooltip.style.display = "none";
    }

    cy.on("mouseover", "node", (evt) => {
        const node = evt.target;
        const e = evt.originalEvent || {};
        show(node, e.pageX || 0, e.pageY || 0);
    });

    cy.on("mousemove", "node", (evt) => {
        const e = evt.originalEvent || {};
        move(e.pageX || 0, e.pageY || 0);
    });

    cy.on("mouseout", "node", hide);

    // cleanup helper
    return () => {
        cy.removeListener("mouseover");
        cy.removeListener("mousemove");
        cy.removeListener("mouseout");
        tooltip.remove();
    };
}

export default {
    initcy,
    setupContextMenu,
    setupSimpleTooltip
};