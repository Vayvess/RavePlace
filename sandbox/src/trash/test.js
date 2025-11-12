document.addEventListener('DOMContentLoaded', function () {
    _evaluate() {
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

    var cy = window.cy = cytoscape({
        container: document.getElementById('cy'),

        layout: {
            name: 'grid',
            rows: 2,
            cols: 2
        },

        style: [
            {
                selector: 'node[name]',
                style: {
                    'content': 'data(name)'
                }
            },

            {
                selector: 'edge',
                style: {
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle'
                }
            },

            // some style for the extension

            {
                selector: '.eh-handle',
                style: {
                    'background-color': 'red',
                    'width': 12,
                    'height': 12,
                    'shape': 'ellipse',
                    'overlay-opacity': 0,
                    'border-width': 12, // makes the handle easier to hit
                    'border-opacity': 0
                }
            },

            {
                selector: '.eh-hover',
                style: {
                    'background-color': 'red'
                }
            },

            {
                selector: '.eh-source',
                style: {
                    'border-width': 2,
                    'border-color': 'red'
                }
            },

            {
                selector: '.eh-target',
                style: {
                    'border-width': 2,
                    'border-color': 'red'
                }
            },

            {
                selector: '.eh-preview, .eh-ghost-edge',
                style: {
                    'background-color': 'red',
                    'line-color': 'red',
                    'target-arrow-color': 'red',
                    'source-arrow-color': 'red'
                }
            },

            {
                selector: '.eh-ghost-edge.eh-preview-active',
                style: {
                    'opacity': 0
                }
            }
        ],

        elements: {
            nodes: [
                { data: { id: 'j', name: 'Jerry' } },
                { data: { id: 'e', name: 'Elaine' } },
                { data: { id: 'k', name: 'Kramer' } },
                { data: { id: 'g', name: 'George' } }
            ],
            edges: [
                { data: { source: 'j', target: 'e' } },
                { data: { source: 'j', target: 'k' } },
                { data: { source: 'j', target: 'g' } },
                { data: { source: 'e', target: 'j' } },
                { data: { source: 'e', target: 'k' } },
                { data: { source: 'k', target: 'j' } },
                { data: { source: 'k', target: 'e' } },
                { data: { source: 'k', target: 'g' } },
                { data: { source: 'g', target: 'j' } }
            ]
        }
    });

    var eh = cy.edgehandles();

    document.querySelector('#draw-on').addEventListener('click', function () {
        eh.enableDrawMode();
    });

    document.querySelector('#draw-off').addEventListener('click', function () {
        eh.disableDrawMode();
    });

    document.querySelector('#start').addEventListener('click', function () {
        eh.start(cy.$('node:selected'));
    });

    var popperEnabled = false;

    document.querySelector('#popper').addEventListener('click', function () {
        if (popperEnabled) { return; }

        popperEnabled = true;

        // example code for making your own handles -- customise events and presentation where fitting
        // var popper;
        var popperNode;
        var popper;
        var popperDiv;
        var started = false;

        function start() {
            eh.start(popperNode);
        }

        function stop() {
            eh.stop();
        }

        function setHandleOn(node) {
            if (started) { return; }

            removeHandle(); // rm old handle

            popperNode = node;

            popperDiv = document.createElement('div');
            popperDiv.classList.add('popper-handle');
            popperDiv.addEventListener('mousedown', start);
            document.body.appendChild(popperDiv);

            popper = node.popper({
                content: popperDiv,
                popper: {
                    placement: 'top',
                    modifiers: [
                        {
                            name: 'offset',
                            options: {
                                offset: [0, -10],
                            },
                        },
                    ]
                }
            });
        }

        function removeHandle() {
            if (popper) {
                popper.destroy();
                popper = null;
            }

            if (popperDiv) {
                document.body.removeChild(popperDiv);
                popperDiv = null;
            }

            popperNode = null;
        }

        cy.on('mouseover', 'node', function (e) {
            setHandleOn(e.target);
        });

        cy.on('grab', 'node', function () {
            removeHandle();
        });

        cy.on('tap', function (e) {
            if (e.target === cy) {
                removeHandle();
            }
        });

        cy.on('zoom pan', function () {
            removeHandle();
        });

        window.addEventListener('mouseup', function (e) {
            stop();
        });

        cy.on('ehstart', function () {
            started = true;
        });

        cy.on('ehstop', function () {
            started = false;
        });
    });
});
