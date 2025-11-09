<script>
    import { io } from "socket.io-client";

    const socket = io("http://localhost:3000");
    socket.on("connect", () => {
        console.log("Connected to server:", socket.id);
    });

    import { onMount } from "svelte";

    let canvas;
    const gridSize = 64;
    const cellSize = 24;
    let cursor = { x: 0, y: 0 };
    let grid = Array.from({ length: gridSize }, () =>
        Array(gridSize).fill(" "),
    );

    function render() {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.font = "24px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const px = x * cellSize;
                const py = y * cellSize;

                // Highlight the selected cell
                if (x === cursor.x && y === cursor.y) {
                    ctx.fillStyle = "rgba(0, 128, 255, 0.3)";
                    ctx.fillRect(px, py, cellSize, cellSize);
                    ctx.strokeStyle = "blue";
                    ctx.lineWidth = 2;
                } else {
                    ctx.strokeStyle = "#ccc";
                    ctx.lineWidth = 1;
                }
                ctx.strokeRect(px, py, cellSize, cellSize);

                // DRAW THE LETTER IF ANY
                const char = grid[y][x];
                if (char) {
                    ctx.fillStyle = "black";
                    ctx.fillText(
                        char,
                        px + cellSize / 2,
                        py + cellSize / 2 + 1,
                    );
                }
            }
        }
    }

    function moveCursor(key) {
        let dx = 0;
        let dy = 0;

        switch (key) {
            case "ArrowUp":
                dy = -1;
                break;
            case "ArrowDown":
                dy = 1;
                break;
            case "ArrowLeft":
                dx = -1;
                break;
            case "ArrowRight":
                dx = 1;
                break;
            default:
                return;
        }

        cursor.x = Math.max(0, Math.min(gridSize - 1, cursor.x + dx));
        cursor.y = Math.max(0, Math.min(gridSize - 1, cursor.y + dy));
    }

    function handleKey(e) {
        e.preventDefault();

        if (e.key.startsWith("Arrow")) {
            moveCursor(e.key);
        } else if (e.key === "Backspace") {
            grid[cursor.y][cursor.x] = " ";
            socket.emit("modifyCell", { x: cursor.x, y: cursor.y, z: " " });
        } else if (e.key.length === 1) {
            grid[cursor.y][cursor.x] = e.key;
            socket.emit("modifyCell", { x: cursor.x, y: cursor.y, z: e.key });
        }

        render();
    }

    function evalGrid() {
        const code = grid.map(row => row.join("")).join("\n");
        try {
            strudel.evaluate(code);
        } catch (err) {
            console.error("Strudel error:", err);
        }
    }

    onMount(() => {
        render();
        initStrudel();
        socket.on("fullGrid", (serverGrid) => {
            grid = serverGrid;
            render();
        });

        socket.on("cellUpdated", ({ x, y, z }) => {
            grid[y][x] = z;
            render();
        });

        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    });
</script>

<main>
    <canvas
        bind:this={canvas}
        width={gridSize * cellSize}
        height={gridSize * cellSize}
        class="bg-white border border-gray-400"
    ></canvas>
    <button on:click={evalGrid}>Eval Grid</button>
</main>

<style>
    canvas {
    }
</style>
