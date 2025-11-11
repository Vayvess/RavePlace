import cytoscape from "cytoscape";
import edgehandles from "cytoscape-edgehandles";
import contextMenus from "cytoscape-context-menus";
import "cytoscape-context-menus/cytoscape-context-menus.css";

cytoscape.use(edgehandles);
cytoscape.use(contextMenus);

export class Editor {
    constructor(container, nextIdRef) {
        this.container = container;
        this.nextIdRef = nextIdRef;
        this.tooltip = null;
        this.cy = this._initCy();
        this.eh = this.cy.edgehandles();
        this.menu = this._setupContextMenu();
        this.cleanupTooltip = this._setupTooltip();
    }

    _initCy() {
        // "text-valign": "center",
        // "text-halign": "center",
        const baseNodeStyle = {
            selector: "node",
            style: {
                "background-color": "#66ccff",
                "color": "#fff",
                "font-size": "16px",
            }
        };

        const labelStyle = {
            selector: "node[label]",
            style: {
                "label": "data(label)",
            }
        };

        const edgeStyle = {
            selector: "edge",
            style: {
                "width": 4,
                "line-color": "#aaa",
                "target-arrow-color": "#aaa",
                "target-arrow-shape": "triangle",
                "curve-style": "bezier",
            }
        };

        return cytoscape({
            container: this.container,
            elements: [],
            style: [
                baseNodeStyle,
                labelStyle,
                edgeStyle
            ]
        });
    }

    _evaluate(event) {
        const cy = this.cy;
        const visited = new Set();
        const paths = [];

        // Helper: pick random outgoing edge
        const getRandomOutgoingEdge = (node) => {
            const outgoing = node.outgoers("edge[target]");
            if (outgoing.length === 0) return null;
            return outgoing[Math.floor(Math.random() * outgoing.length)];
        };

        // Helper: traverse component starting from this node
        const traverse = (node) => {
            let current = node;
            const codeParts = [];

            while (current && !visited.has(current.id())) {
                visited.add(current.id());
                codeParts.push(current.data("text") || "");

                const edge = getRandomOutgoingEdge(current);
                if (!edge) break;

                const target = edge.target();
                current = target;
            }

            return codeParts.join("");
        };

        // Find all connected components
        const components = cy.elements().components();

        for (const comp of components) {
            const startNodes = comp.nodes().filter((n) => n.indegree() === 0);

            if (startNodes.length === 0) {
                // No clear start — just pick a random node
                const randomNode = comp.nodes()[Math.floor(Math.random() * comp.nodes().length)];
                paths.push(traverse(randomNode));
            } else {
                for (const start of startNodes) {
                    paths.push(traverse(start));
                }
            }
        }

        // Build final code
        const finalCode = paths.join("\n\n");
        console.log("Generated Strudel Code:\n", finalCode);
        strudel.evaluate(finalCode);
    }

    _setupContextMenu() {
        const cy = this.cy;
        const eh = this.eh;
        const nextIdRef = this.nextIdRef;

        const addNode = {
            id: "add-node",
            content: "Add Node",
            selector: "",
            coreAsWell: true,
            onClickFunction: (event) => {
                const id = `n${nextIdRef.value++}`;
                const text = prompt("Enter node text:", "new node") || "Untitled";

                cy.add({
                    data: { id, label: id, text },
                    position: event.position,
                });
            }
        };

        const editNode = {
            id: "edit-node",
            content: "Edit Node",
            selector: "node",
            onClickFunction: (event) => {
                const node = event.target; // the node that was clicked
                const currentText = node.data("text") || "";

                // Show prompt prefilled with the current text
                const newText = prompt("Edit node text:", currentText);

                // If the user cancels, do nothing
                if (newText === null) return;

                // Update node data
                node.data("text", newText);
                node.data("label", node.data("id")); // keep label consistent if needed
            }
        };

        const addEdge = {
            id: "add-edge",
            content: "Add Edge",
            selector: "node",
            onClickFunction: (event) => {
                eh.start(event.target);
            }
        };

        const remove = {
            id: "remove",
            content: "Remove",
            selector: "node, edge",
            onClickFunction: (event) => {
                event.target.remove();
            }
        };

        const evaluate = {
            id: "evaluate",
            content: "Evaluate",
            selector: "",
            coreAsWell: true,
            onClickFunction: (event) => {
                this._evaluate(event);
            }
        };

        const save = {
            id: "save",
            content: "Save Graph",
            selector: "",
            coreAsWell: true,
            onClickFunction: (event) => {
                const json = cy.json();
                const blob = new Blob([JSON.stringify(json.elements, null, 2)], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "graph.json";
                a.click();
                URL.revokeObjectURL(a.href);
            }
        };

        const load = {
            id: "load",
            content: "Load Graph",
            selector: "",
            coreAsWell: true,
            onClickFunction: (event) => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "application/json";

                input.addEventListener("change", (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        try {
                            const data = JSON.parse(evt.target.result);
                            cy.elements().remove(); // clear existing
                            cy.add(data); // add saved nodes & edges
                            cy.layout({ name: "preset" }).run(); // optional
                        } catch (err) {
                            alert("Invalid JSON file.");
                            console.error(err);
                        }
                    };
                    reader.readAsText(file);
                });

                input.click();
            }
        };


        return cy.contextMenus({
            evtType: "cxttap",
            menuItems: [
                addNode, 
                editNode,
                addEdge,
                remove,
                evaluate,
                save,
                load
            ],
        });
    }
    
    _setupTooltip() {
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

        this.cy.on("mouseover", "node", (evt) => {
            const node = evt.target;
            const e = evt.originalEvent || {};
            show(node, e.pageX || 0, e.pageY || 0);
        });

        this.cy.on("mousemove", "node", (evt) => {
            const e = evt.originalEvent || {};
            move(e.pageX || 0, e.pageY || 0);
        });

        this.cy.on("mouseout", "node", hide);

        // cleanup helper
        return () => {
            this.cy.removeListener("mouseover");
            this.cy.removeListener("mousemove");
            this.cy.removeListener("mouseout");
            tooltip.remove();
        };
    }

    destroy() {
        this.cleanupTooltip?.();
        this.menu?.destroy?.();
        this.cy?.destroy?.();
        this.tooltip?.remove?.();
    }
}
