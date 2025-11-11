import Phaser from "phaser";
import RaveNode from "./raveNode";
import { editorScene } from "./gameStore.js";


export default class Editor extends Phaser.Scene {
    constructor() {
        super("Editor");

        this.nodes = [];
        this.worldBounds = {
            x: -2000,
            y: -2000,
            width: 4000,
            height: 4000
        };

        this.dragStart = {
            x: 0,
            y: 0
        };

        this.marker = null;
        this.selectedPosition = null;
    }

    preload() {

    }

    clampCameraToBounds() {
        const cam = this.cameras.main;
        const halfW = cam.width * 0.5 / cam.zoom;
        const halfH = cam.height * 0.5 / cam.zoom;

        const minX = this.worldBounds.x + halfW;
        const maxX = this.worldBounds.x + this.worldBounds.width - halfW;
        const minY = this.worldBounds.y + halfH;
        const maxY = this.worldBounds.y + this.worldBounds.height - halfH;

        cam.scrollX = Phaser.Math.Clamp(cam.scrollX, minX - halfW, maxX - halfW);
        cam.scrollY = Phaser.Math.Clamp(cam.scrollY, minY - halfH, maxY - halfH);
    }

    spawnRaveNode(text) {
        
        const node = new RaveNode(this, this.selectedPosition.x, this.selectedPosition.y, text);
        this.nodes.push(node);
    }

    create() {
        // CAMERA SETUP
        this.cameras.main.setBounds(
            this.worldBounds.x,
            this.worldBounds.y,
            this.worldBounds.width,
            this.worldBounds.height
        );
        this.cameras.main.centerOn(0, 0);

        // MOUSE SETUP
        this.input.on("pointerdown", (pointer) => {
            if (pointer.leftButtonDown()) {
                this.isDragging = true;
                this.dragStart.x = pointer.x;
                this.dragStart.y = pointer.y;
            }

            if (pointer.rightButtonDown()) {
                const wp = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

                if (!this.marker) {
                    this.marker = this.add.circle(wp.x, wp.y, 8, 0xff00ff, 0.8);
                } else {
                    this.marker.setPosition(wp.x, wp.y);
                }

                this.selectedPosition = { x: wp.x, y: wp.y};
                this.game.events.emit("select-position", this.selectedPosition);
            }
        });

        this.input.on("pointerup", () => {
            this.isDragging = false;
        });

        this.input.on("pointermove", (pointer) => {
            if (!this.isDragging) return;

            const camera = this.cameras.main;
            const dragX = (pointer.x - this.dragStart.x) * (1 / camera.zoom);
            const dragY = (pointer.y - this.dragStart.y) * (1 / camera.zoom);
            camera.scrollX -= dragX;
            camera.scrollY -= dragY;

            this.dragStart.x = pointer.x;
            this.dragStart.y = pointer.y;

            this.clampCameraToBounds();
        });

        this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
            const camera = this.cameras.main;
            const zoomFactor = 0.001;
            camera.zoom -= deltaY * zoomFactor;
            camera.zoom = Phaser.Math.Clamp(camera.zoom, 0.3, 3);
            this.clampCameraToBounds();
        });

        this.input.mouse.disableContextMenu();
        this.add.grid(0, 0, 4000, 4000, 64, 64, 0x444444, 0.5, 0x888888, 0.5);
        editorScene.set(this);
    }

    update(time, delta) {

    }
}