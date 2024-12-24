<!-- src/routes/game/+page.svelte -->
<script lang="ts">
	import { Board } from '$lib/board';
	import * as Cards from '$lib/cards';
	import { generateDeckForRyuu } from '$lib/decks';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	const board = writable<Board | null>(null);
	const hand = writable<any[]>([]);
	const previewImage = writable<string | null>(null);

	onMount(async () => {
		const newBoard = new Board();
		const ryuu = Cards.Ryuu;
		newBoard.spawnUnit(ryuu);
		board.set(newBoard);

		const deck = await generateDeckForRyuu();
		hand.set(deck.slice(0, 5));
	});

	function playCard(card: any, position: { x: number; y: number }) {
		$board?.playLand(card, position);
		hand.update((h) => h.filter((c) => c !== card));
	}

	function endTurn() {
		$board?.endTurn();
	}

	function handlePreview(imageUrl: string) {
		previewImage.set('img' + imageUrl);
	}

	function clearPreview() {
		previewImage.set(null);
	}
</script>

<div class="game-container">
	{#if $previewImage}
		<div class="preview-overlay">
			<img src={$previewImage} alt="Card Preview" class="preview-image" />
		</div>
	{/if}

	<div class="board">
		{#if $board}
			{#each Array(8) as _, x}
				<div class="col col-{x}">
					{#each Array(8) as _, y}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="tile"
							onmouseenter={() => {
								const land = $board.lands.find((l) => l.pos.x === x && l.pos.y === y);
								if (land) handlePreview(land.land.image);
							}}
							onmouseleave={clearPreview}
						>
							<img
								class="land"
								src={`/img/lands/${
									$board.lands.find((l) => l.pos.x === x && l.pos.y === y)?.land.id
								}.png`}
								alt="Land"
							/>
						</div>
					{/each}
				</div>
			{/each}
		{/if}
	</div>

	<div class="player-area">
		<button onclick={endTurn}>End Turn</button>
		<div class="hand">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			{#each $hand as card}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="card"
					onclick={() => playCard(card, { x: 0, y: 0 })}
					onmouseenter={() => handlePreview(card.image)}
					onmouseleave={clearPreview}
				>
					<img src={'img' + card.image} alt={card.name} />
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.game-container {
		display: grid;
		grid-template-columns: 1fr 300px;
		height: 100vh;
		padding: 20px;
		gap: 20px;
		position: relative;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 2px;
		background: #2a2a2a;
		padding: 10px;
		border-radius: 8px;
	}

	.player-area {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.hand {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	:global(.preview-overlay) {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1000;
		pointer-events: none;
	}

	:global(.preview-image) {
		max-height: 80vh;
		max-width: 80vw;
		object-fit: contain;
		border-radius: 10px;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
	}

	:global(.card) {
		background: #3a3a3a;
		padding: 10px;
		border-radius: 8px;
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	.card:hover {
		transform: scale(1.05);
	}

	:global(.tile) {
		aspect-ratio: 1;
		background: #3a3a3a;
		border-radius: 4px;
		overflow: hidden;
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	:global(.tile:hover) {
		transform: scale(1.05);
	}

	/* Optional: Add animation for the preview */
	.preview-overlay {
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
