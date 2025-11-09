import cors from "cors";
import express from "express";

import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
app.use(cors());

const httpServer = createServer(app);

// THE PORT OF THE SVELTE CLIENT
const io = new Server(httpServer, {
    cors: { origin: "http://localhost:5173" }
});

app.get("/", (req, res) => {
    res.send("RavePlace API is running !");
});

// SYNCHRO
const gridSize = 64;
const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(" "));

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.emit("fullGrid", grid);

    socket.on("modifyCell", ({ x, y, z }) => {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            grid[y][x] = z;
            socket.broadcast.emit("cellUpdated", { x, y, z });
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
