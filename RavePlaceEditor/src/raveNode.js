export default class RaveNode {
    constructor(scene, x, y, text) {
        this.scene = scene;
        this.x = x;
        this.y = y;

        this.nodeText = scene.add.text(0, 0, text, {
            fontSize: "16px",
            color: "#ffffff",
        }).setOrigin(0.5);

        this.width = 128;
        this.height = 32;
        this.rect = scene.add.rectangle(0, 0, this.width, this.height, 0x3498db);
        this.rect.setStrokeStyle(2, 0x000000);

        this.container = scene.add.container(x, y, [this.rect, this.nodeText]);
        this.container.setSize(this.width, this.height);

        this.setText(text);
    }

    setText(text) {
        this.nodeText.setText(text);

        const temp = this.scene.add.text(0, 0, text, {
            fontSize: "32px",
        }).setVisible(false);

        const width = temp.width + 16;
        const height = temp.height + 8;
        temp.destroy();

        this.rect.setSize(width, height);
        this.width = width;
        this.height = height;
    }

    destroy() {
        this.container.destroy();
    }
}