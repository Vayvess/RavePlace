<script>
    import { onMount, onDestroy } from "svelte";
    import { Editor } from "./editor";

    let container;
    let editor;
    let nextId = { value: 1 };

    onMount(() => {
        initStrudel();
        editor = new Editor(container, nextId);
    });

    onDestroy(() => {
        editor?.destroy();
    });
</script>

<main>
    <div id="cy" bind:this={container}></div>
</main>

<style>
    main {
        display: flex;
        justify-content: center;
        align-items: center;
        background: #a2e3c4;
        padding: 1rem;
    }

    #cy {
        width: 800px;
        height: 600px;
        background-color: #2a2a32;
        border: 8px solid #3a3a45;
    }
</style>
