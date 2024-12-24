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
	const selectedCard = writable<any>(null);

	onMount(async () => {
		const newBoard = new Board();
		const ryuu = Cards.Ryuu;
		newBoard.spawnUnit(ryuu);
		board.set(newBoard);

		const deck = await generateDeckForRyuu();
		hand.set(deck.slice(0, 5));
	});

	$: {
		if ($previewImage) {
			console.log('Preview image updated:', $previewImage);
		}
	}

	function playCard(card: any, position: { x: number; y: number }) {
		if (!$board) return;

		if (card.type === 'Land') {
			$board.playLand(card, position);
		} else if (card.type === 'Hero' || card.type === 'Companion') {
			$board.spawnUnit(card);
		}

		hand.update((h) => h.filter((c) => c !== card));
	}

	function handlePhaseEnd() {
		$board?.advancePhase();
	}

	function handlePreview(imageUrl: string) {
		previewImage.set('img' + imageUrl);
	}

	function clearPreview() {
		previewImage.set(null);
	}
</script>

<div class="game-container">
	<div class="game-info">
		<div class="phase">Current Phase: {$board?.currentPhase}</div>
		<div class="resources">
			{#each Object.entries($board?.resources.elementalPower ?? {}) as [element, amount]}
				<div class="resource">
					<img src="/img/elements/{element}.png" alt={element} />
					<span>{amount}</span>
				</div>
			{/each}
		</div>
	</div>

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
		<button onclick={handlePhaseEnd}>
			End {$board?.currentPhase} Phase
		</button>

		<div class="hand">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			{#each $hand as card}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="card"
					class:selected={$selectedCard === card}
					onclick={() => selectedCard.set(card)}
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
		grid-template-rows: auto 1fr auto;
		height: 100vh;
		gap: 1rem;
		padding: 1rem;
	}

	.game-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: #2a2a2a;
		border-radius: 8px;
	}

	:global(.resources) {
		display: flex;
		gap: 1rem;
	}

	:global(.resource) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	:global(.resource img) {
		width: 50px;
		height: 50px;
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
		gap: 0.5rem; /* reduced gap between cards */
		padding: 1rem;
		justify-content: center;
		align-items: center;
		position: fixed;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
	}

	:global(.card) {
		width: 120px; /* reduced from default size */
		height: 168px; /* maintaining 1.4:1 aspect ratio */
		transition: transform 0.2s ease;
		cursor: pointer;
	}

	:global(.card:hover) {
		transform: translateY(-10px) scale(1.1);
		z-index: 10;
	}

	:global(.card img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 8px;
	}

	:global(.card.selected) {
		border: 2px solid #ffd700;
		transform: translateY(-10px);
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

	:global(.preview-overlay) {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 1000;
		pointer-events: none;
		background: rgba(0, 0, 0, 0.8);
		padding: 20px;
		border-radius: 10px;
	}

	:global(.preview-image) {
		max-height: 80vh;
		max-width: 80vw;
		object-fit: contain;
		border-radius: 10px;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
	}

	/* Add animation for smoother appearance */
	:global(.preview-overlay) {
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
