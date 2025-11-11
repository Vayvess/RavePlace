<script>
    import Phaser from "phaser";
    import { onMount } from "svelte";
    import { phaserGame, editorScene } from "./gameStore.js";
    import Editor from "./old.js";

    let container;
    let nodeText = "";

    function spawnRaveNode() {
        editorScene.update(scene => {
            if (scene) scene.spawnRaveNode(nodeText.trim());
            else console.warn("Scene not ready yet");
            return scene;
        });
        nodeText = "";
    }

    onMount(() => {
        const game = new Phaser.Game({
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            backgroundColor: "#1a1a1a",
            parent: container,
            scene: [Editor]
        });

        phaserGame.set(game);

        game.events.once(Phaser.Core.Events.READY, () => {
            const scene = game.scene.keys["Editor"];
            editorScene.set(scene);
        });

        return () => {
            phaserGame.set(null);
            editorScene.set(null);
            game.destroy(true);
        };
    });
</script>

<main>
    <div bind:this={container} class="w-full h-full"></div>

    <div>
        <input
            type="text"
            bind:value={nodeText}
            placeholder="Enter node text..."
        />
        <button on:click={spawnRaveNode}>Spawn</button>
    </div>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: #222;
        color: white;
    }
</style>
