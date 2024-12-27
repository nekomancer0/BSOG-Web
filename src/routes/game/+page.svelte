<!-- src/routes/game/+page.svelte -->
<script lang="ts">
	import { Board } from '$lib/board';
	import * as Cards from '$lib/cards';
	import { generateDeckForRyuu } from '$lib/decks';
	import { BaseThing, Unit, type AbilityCost, type Type } from '$lib/types';
	import { onMount } from 'svelte';

	let board: Board | null = $state(new Board());
	let hand: any[] = $state([]);
	let previewImage: string | null = $state(null);
	let selectedCard: any = $state(null);
	let myResources: AbilityCost = $state([]);
	let phase: 'Draw' | 'Main' | 'Combat' | 'End' = $state('Draw');

	let selectedUnit: Unit | null = $state(null);
	let validMoves: Array<{ x: number; y: number }> = $state([]);
	let validAttacks: Array<{ x: number; y: number }> = $state([]);

	onMount(async () => {
		// Initialize board if not already done

		// Place Ryuu on the board
		const ryuu = Cards.Ryuu;
		ryuu.pos = { x: 2, y: 2 };
		board?.placeUnit(ryuu, { x: 2, y: 2 });

		// Get deck and hand
		const deck = await generateDeckForRyuu();
		hand = [...deck.slice(0, 4), Cards.DummyCompanion].filter((c) => typeof c !== 'undefined');
	});

	let i = 0;
	$effect(() => {
		if (!board) return;

		i++;

		if (i === 2) {
			i = 0;

			console.log('Current board state:', {
				units: board.units,
				lands: board.lands
			});

			myResources = [
				{ amount: 5, type: getDeckResources().filter((c) => typeof c !== 'undefined')[0].type }
			];
		}

		if (previewImage) {
			console.log('Preview image updated:', previewImage);
		}
	});

	$effect(() => {
		if (!board) return;

		hand = board.hand.filter((c) => typeof c !== 'undefined');
	});

	function handleTileClick(x: number, y: number) {
		if (!board) return;
		if (isProcessing) return;

		isProcessing = true;

		try {
			if (selectedCard && (selectedCard.type === 'Hero' || selectedCard.type === 'Companion')) {
				// Handle unit placement
				const success = board.placeUnit(selectedCard, { x, y });
				if (success) {
					hand = hand.filter((c) => c.name !== selectedCard.name);
					selectedCard = null;
				}
			} else if (selectedUnit) {
				// Handle unit movement
				const targetPos = { x, y };
				if (validMoves.some((pos) => pos.x === x && pos.y === y)) {
					const success = board.moveUnit(selectedUnit, targetPos);
					if (success) {
						// Force a UI update by creating a new reference
						board = board;
						// Clear selection after successful move
						selectedUnit = null;
						validMoves = [];
						validAttacks = [];
					}
				}
			}
		} finally {
			setTimeout(() => {
				isProcessing = false;
			}, 100);
		}
	}

	let isProcessing = false;

	// Function to get unique resources from the deck
	function getDeckResources() {
		const resources: AbilityCost = [];
		hand.forEach((card: BaseThing<any>) => {
			if (card.cost && card.cost.length > 0 && !resources.includes(card.cost[0])) {
				card.cost.forEach((resource) => {
					resources.push(resource);
				});
			}
		});

		return resources;
	}

	function handlePhaseEnd() {
		board?.advancePhase();
	}

	function handlePreview(imageUrl: string) {
		previewImage = imageUrl;
	}

	function clearPreview() {
		previewImage = null;
	}

	function handleUnitClick(unit: Unit) {
		if (!board) return;

		// Prevent processing during animations
		if (isProcessing) return;
		isProcessing = true;

		try {
			if (selectedUnit === unit) {
				selectedUnit = null;
				validMoves = [];
				validAttacks = [];
			} else {
				selectedUnit = unit;
				validMoves = [];
				validAttacks = [];

				// Calculate valid moves
				for (let x = 0; x < 8; x++) {
					for (let y = 0; y < 8; y++) {
						if (board.canMoveTo(unit, { x, y })) {
							validMoves.push({ x: x, y: y });
						}
						if (board.canAttack(unit, { x, y })) {
							validAttacks.push({ x: x, y: y });
						}
					}
				}
			}
		} finally {
			// Ensure processing flag is reset
			setTimeout(() => {
				isProcessing = false;
			}, 100);
		}
	}
</script>

<div class="game-container">
	<!-- Sticky game info panel -->
	<div class="game-info-panel">
		<div class="phase">
			Current Phase: {phase}
		</div>

		<div class="resources">
			{#each myResources as { amount, type }}
				<div class="resource">
					<img src="/elements/{type}.png" alt={type} />
					<span>{amount}</span>
				</div>
			{/each}
		</div>

		<div class="controls">
			<button onclick={handlePhaseEnd}>
				End {board?.currentPhase} Phase
			</button>
		</div>
	</div>

	<!-- Keep the preview overlay -->
	{#if previewImage}
		<div class="preview-overlay">
			<img src={previewImage} alt="Card Preview" class="preview-image" />
		</div>
	{/if}

	<div class="board">
		{#if board}
			{#each { length: 8 }, x}
				<div class="col col-{x}">
					{#each { length: 8 }, y}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="tile row row-{y}"
							class:valid-move={validMoves.some((pos) => pos.x === x && pos.y === y)}
							class:valid-attack={validAttacks.some((pos) => pos.x === x && pos.y === y)}
							onclick={() => handleTileClick(x, y)}
						>
							<!-- Land -->
							<img
								class="land"
								src={`/lands/${board?.lands.find((l) => l.pos.x === x && l.pos.y === y)?.land.id}.png`}
								alt="Land"
							/>

							<!-- Unit -->
							{#if board?.getUnitAt({ x: x, y: y })}
								{@const unit = board?.getUnitAt({ x: x, y: y })}

								<div
									class="unit"
									class:selected={selectedUnit === unit}
									onclick={() => handleUnitClick(unit!)}
								>
									<img src={unit?.image} alt={unit?.name} />
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		{/if}
	</div>

	<div class="player-area">
		<div class="hand">
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			{#each hand as card}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="card"
					class:selected={selectedCard === card}
					onclick={() => (selectedCard = card)}
					onmouseenter={() => handlePreview(card.image)}
					onmouseleave={clearPreview}
				>
					<img src={card.image} alt={card.name} />
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

	:global(.debug-info) {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 10000;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		font-size: 0.8em;
		text-align: center;
	}

	:global(.land) {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: -3;
	}

	:global(.valid-move) {
		background: rgba(0, 255, 0, 0.3) !important;
		box-shadow: inset 0 0 15px rgba(0, 255, 0, 0.5);
		z-index: 2;
	}

	:global(.valid-attack) {
		background: rgba(255, 0, 0, 0.3) !important;
		box-shadow: inset 0 0 15px rgba(255, 0, 0, 0.5);
		z-index: 2;
	}

	:global(.valid-move) {
		background: rgba(0, 255, 0, 0.3) !important;
		box-shadow: inset 0 0 15px rgba(0, 255, 0, 0.5);
		z-index: 2;
	}

	:global(.valid-attack) {
		background: rgba(255, 0, 0, 0.3) !important;
		box-shadow: inset 0 0 15px rgba(255, 0, 0, 0.5);
		z-index: 2;
	}

	:global(.tile) {
		position: relative;
		aspect-ratio: 1;
		border-radius: 4px;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:global(.tile:hover) {
		transform: scale(1.05);
		z-index: 3;
	}

	:global(.unit) {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 80%;
		height: 80%;
		transition: all 0.3s ease;
		z-index: 3;
	}

	:global(.unit.selected) {
		box-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
		transform: translate(-50%, -50%) scale(1.1);
	}
</style>
