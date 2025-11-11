<script>
    import { onDestroy, onMount } from "svelte";
    import {
        initcy,
        setupEdges,
        setupMenus,
        setupSimpleTooltip,
    } from "./setupEditor";

    let cy;
    let container;
    let nextId = { value: 1 };

    onMount(() => {
        cy = initcy(container);
        const menu = setupMenus(cy, nextId);
        const eh = setupEdges(cy);
        const cleanupTooltip = setupSimpleTooltip(cy);

        onDestroy(() => {
            cleanupTooltip();
            eh.disable();
            menu.destroy();
            cy.destroy();
        });
    });

    onDestroy(() => {});
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
