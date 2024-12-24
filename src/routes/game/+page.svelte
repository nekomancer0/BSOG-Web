<!-- src/routes/game/+page.svelte -->
<script lang="ts">
	import { Board } from '$lib/board';
	import * as Cards from '$lib/cards';
	import { generateDeckForRyuu } from '$lib/decks';
	import { BaseThing, type AbilityCost, type Type } from '$lib/types';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	const board = writable<Board | null>(null);
	const hand = writable<any[]>([]);
	const previewImage = writable<string | null>(null);
	const selectedCard = writable<any>(null);
	const myResources = writable<AbilityCost>([]);

	$: {
		if ($board) {
			myResources.set([{ amount: 5, type: getDeckResources()[0].type }]);
		}
	}

	onMount(async () => {
		const newBoard = new Board();
		const ryuu = Cards.Ryuu;
		newBoard.spawnUnit(ryuu);
		board.set(newBoard);

		const deck = await generateDeckForRyuu();
		hand.set(deck.slice(0, 5));

		$board?.on('phaseChange', (phase: string) => {
			console.log('Phase changed:', phase);
		});

		setInterval(() => {
			board.set($board);
		}, 1000);
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

	// Function to get unique resources from the deck
	function getDeckResources() {
		const resources: AbilityCost = [];
		$hand.forEach((card: BaseThing<any>) => {
			if (card.cost && !resources.includes(card.cost[0])) {
				card.cost.forEach((resource) => {
					resources.push(resource);
				});
			}
		});

		return Array.from(resources);
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
	<!-- Sticky game info panel -->
	<div class="game-info-panel">
		<div class="phase">
			Current Phase: {$board?.currentPhase}
		</div>

		<div class="resources">
			{#each $myResources as { amount, type }}
				<div class="resource">
					<img src="/img/elements/{type}.png" alt={type} />
					<span>{amount}</span>
				</div>
			{/each}
		</div>

		<div class="controls">
			<button onclick={handlePhaseEnd}>
				End {$board?.currentPhase} Phase
			</button>
		</div>
	</div>

	<!-- Keep the preview overlay -->
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

	<!-- Hand should be separate from the info panel -->
	<div class="hand">
		{#each $hand as card}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
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
	:global(.game-info-panel) {
		position: fixed;
		top: 20px;
		right: 20px;
		background: rgba(42, 42, 42, 0.95);
		padding: 1rem;
		border-radius: 8px;
		z-index: 100;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
		max-width: 300px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	:global(.phase) {
		color: white;
		font-size: 1.1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	:global(.resources) {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
	}

	:global(.resource) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.4rem;
		border-radius: 6px;
	}

	:global(.resource img) {
		width: 30px;
		height: 30px;
	}

	:global(.controls) {
		margin-top: auto;
	}

	:global(.controls button) {
		width: 100%;
		padding: 0.8rem;
		background: #4a5568;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s;
	}

	:global(.controls button:hover) {
		background: #2d3748;
	}

	/* Keep your existing hand styles */
	.hand {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		justify-content: center;
		align-items: center;
		position: fixed;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
	}

	.game-container {
		display: grid;
		grid-template-rows: auto 1fr auto;
		height: 100vh;
		gap: 1rem;
		padding: 1rem;
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
