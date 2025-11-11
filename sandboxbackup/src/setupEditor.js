import cytoscape from "cytoscape";
import edgehandles from "cytoscape-edgehandles";
import contextMenus from "cytoscape-context-menus";
import "cytoscape-context-menus/cytoscape-context-menus.css";

export function initcy(container) {
    cytoscape.use(edgehandles);
    cytoscape.use(contextMenus);

    const nodeStyle = {
        selector: "node",
        style: {
            "background-color": "#0074D9",
            "label": "data(label)",
            "color": "#fff",
            "font-size": "12px",
            "width": 50,
            "height": 50,
            "border-width": 2,
            "border-color": "#001F3F",
            "text-outline-width": 1,
            "text-outline-color": "#0074D9",
        },
    };

    const edgeStyle = {
        selector: "edge",
        style: {
            width: 2,
            "line-color": "#ccc",
            "target-arrow-shape": "triangle",
            "target-arrow-color": "#ccc",
            "curve-style": "bezier",
        },
    };

    const selected = {
        selector: ":selected",
        style: {
            "background-color": "#FFD97D",
            "line-color": "#FFD97D",
            "target-arrow-color": "#FFD97D",
        }
    };

    const cy = cytoscape({
        container,
        elements: [],
        style: [
            nodeStyle,
            edgeStyle,
            selected
        ]
    });

    return cy;
}

export function setupMenus(cy, nextIdRef) {
    const removeItem = {
        id: "remove",
        content: "remove",
        selector: "node, edge",
        onClickFunction: (event) => {
            event.target.remove();
        },
    };

    const addItem = {
        id: "add-node",
        content: "add node",
        selector: "node, edge",
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

    const options = {
        evtType: "cxttap",
        menuItems: [removeItem, addItem]
    };
    return cy.contextMenus(options);
}

export function setupEdges(cy) {
    const eh = cy.edgehandles({
        handleColor: "#FFD97D",
        handleSize: 10,
        edgeType: () => "flat",
        loopAllowed: () => false,
    });

    eh.enable();
    return eh;
}

// call once after you create `cy`
export function setupSimpleTooltip(cy) {
    // create tooltip element
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
