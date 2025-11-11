import cytoscape from "cytoscape";
import cytoscapePopper from 'cytoscape-popper';
import edgehandles from "cytoscape-edgehandles";
import contextMenus from "cytoscape-context-menus";
import "cytoscape-context-menus/cytoscape-context-menus.css";

function popperFactory(ref, content, opts = {}) {
    // Update function positions the content above the node
    function update() {
        const refRect = ref.getBoundingClientRect();

        const centerX = refRect.left + refRect.width / 2;
        const centerY = refRect.top + refRect.height / 2;

        Object.assign(content.style, {
            position: "absolute",
            transform: "translate(-35%, -35%)",
            left: `${centerX}px`,
            top: `${centerY}px`,
        });
    }

    // Initial placement
    update();

    // Return compatible object for cytoscape-popper
    return { update };
}

export function initcy(container) {
    cytoscape.use(edgehandles);
    cytoscape.use(contextMenus);
    cytoscape.use(cytoscapePopper(popperFactory));

    const nodeStyle = {
        selector: "node",
        style: {
            "background-color": "#0074D9",
            "color": "#fff",
            "font-size": "18px",
            "width": 50,
            "height": 50,
            "border-width": 2,
            "border-color": "#001F3F",
            "text-outline-width": 1,
            "text-outline-color": "#0074D9",
        },
    };

    const labelStyle = {
        selector: "node[label]",
        style: {
            "label": "data(label)",
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

    const selectedStyle = {
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
            labelStyle,
            edgeStyle,
            selectedStyle,
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
    const eh = cy.edgehandles();

    let popperNode;
    let popper;
    let popperDiv;
    let started = false;

    function start() {
        eh.start(popperNode);
        // Important: Hide the popper handle immediately after starting the edge drawing
        // to prevent it from interfering with the dragging.
        removeHandle();
    }

    function stop() {
        eh.stop();
    }

    function removeHandle() {
        if (popperDiv) {
            popperDiv.remove();
            popperDiv = null;
        }

        popper = null;
        popperNode = null;
    }

    function setHandleOn(node) {
        if (started) { return; }
        if (popperNode === node) { return; }

        removeHandle();
        popperNode = node;

        popperDiv = document.createElement('div');
        popperDiv.classList.add('popper-handle');
        Object.assign(popperDiv.style, {
            backgroundColor: 'red',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            cursor: 'pointer',
        });

        popperDiv.addEventListener('mousedown', start);
        document.body.appendChild(popperDiv);

        popper = node.popper({
            content: popperDiv,
            popper: {
                offset: [0, 0],
            },
        });
    }

    // --- Event Listeners ---

    cy.on('mouseover', 'node', function (e) {
        // Only set the handle if the left mouse button is not pressed (i.e., not dragging a selection box)
        if (e.originalEvent && e.originalEvent.buttons === 1) return;
        setHandleOn(e.target);
    });

    // When moving the mouse over the node, we can update the handle's position
    cy.on('mousemove', 'node', function (e) {
        if (popper && popperNode === e.target) {
            popper.update();
        }
    });

    cy.on('mouseout', 'node', function (e) {
        // Only remove the handle if we are not currently drawing an edge
        if (!started && popperNode === e.target) {
            removeHandle();
        }
    });

    cy.on('grab', 'node', removeHandle); // Remove when node dragging starts

    // Use tap/click on background to remove handle
    cy.on('tap', function (e) {
        if (e.target === cy) {
            removeHandle();
        }
    });

    cy.on('zoom pan', removeHandle); // Remove handle on graph interaction

    window.addEventListener('mouseup', function (e) {
        // If the edgehandle creation process stopped (e.g., edge was dropped)
        if (started) {
            stop();
        }
    });

    cy.on('ehstart', function () {
        started = true;
    });

    cy.on('ehstop', function () {
        started = false;
        // Optionally re-set the handle on the last node if the mouse is still over it
        // This is complex, so let's keep it simple for now and rely on mouseover/out
    });

    return eh;
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
