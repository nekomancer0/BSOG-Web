<script lang="ts">
	import { Board } from '$lib/board';
	import * as Cards from '$lib/cards';
	import { generateDeckForRyuu } from '$lib/decks';
	import { Artifact, Card, Companion, Hero, Land, Spell, Unit } from '$lib/types';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	const board = writable<Board | null>(null);
	const previewImage = writable<string | null>(null);
	const hand = writable<(Spell<any> | Land<any> | Hero<any> | Companion<any> | Artifact<any>)[]>(
		[]
	);

	onMount(async () => {
		const newBoard = new Board();
		const ryuu = Cards.Ryuu;
		newBoard.spawnUnit(ryuu);
		board.set(newBoard);

		// Génère le deck du joueur
		const deck = await generateDeckForRyuu();
		hand.set(deck.slice(0, 5)); // Exemple : prend les 5 premières cartes comme main de départ
	});

	function handlePreview(imageUrl: string) {
		previewImage.set(imageUrl);
	}

	function clearPreview() {
		previewImage.set(null);
	}

	function playCard(
		card: Spell<any> | Land<any> | Hero<any> | Companion<any> | Artifact<any>,
		position: { x: number; y: number }
	) {
		board.update((b) => {
			if (card instanceof Land) {
				console.log('Played', card);
				b?.playLand(card, position);
			}
			return b;
		});

		let index = $hand.indexOf(card);
		// Supprime la carte jouée de la main
		hand.set($hand.filter((_, i) => i !== index));
	}

	function endTurn() {
		board.update((b) => {
			b?.endTurn();
			return b;
		});
	}
</script>

<div class="container">
	<div class="board">
		{#if $board}
			{#each Array(8) as _, x}
				<div class="col col-{x}">
					{#each Array(8) as _, y}
						<div
							class="tile"
							onclick={() =>
								handlePreview(
									`/img/lands/${$board!.lands.find((l) => l.pos.x === x && l.pos.y === y)?.land.id}.png`
								)}
						>
							<img
								class="land"
								src={`/img/lands/${$board!.lands.find((l) => l.pos.x === x && l.pos.y === y)?.land.id}.png`}
								alt="Land"
							/>
						</div>
					{/each}
				</div>
			{/each}
		{/if}
	</div>

	{#if $previewImage}
		<div class="preview" onclick={clearPreview}>
			<img src={$previewImage} alt="Preview" />
		</div>
	{/if}

	<div class="player-view">
		<button class="draw" onclick={() => console.log('Draw card functionality pending!')}
			>Draw</button
		>
		<button class="end-turn" onclick={endTurn}>End Turn</button>
		<div class="hand">
			{#each $hand as card}
				<div class="card" onclick={() => playCard(card, { x: 0, y: 0 })}>
					{#if card instanceof Land}
						<img src={`/img/lands/${card.id}.png`} alt={card.name} />
						<p>{card.name}</p>
					{:else}
						<img src={`/img/cards/${card.id}.png`} alt={card.name} />
						<p>{card.name}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<img class="hero-card" alt="Hero" src="" />
</div>

<style>
	.container {
		position: relative;
		width: 100%;
		height: 100vh;
	}

	.hero-card {
		position: absolute;
		bottom: 20px;
		left: 20px;
		z-index: 1;
	}

	.player-view {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 10px;
		position: absolute;
		right: 20px;
		z-index: 1;
		top: 20px;
	}

	.player-view .hand {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	:global(.preview) {
		position: absolute;
		width: 37%;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		z-index: 2;
	}
	.player-view .card {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100px;
		cursor: pointer;
	}

	.player-view button {
		padding: 10px;
		font-size: 1.2rem;
		border-radius: 5px;
		border: 1px solid black;
	}

	.board {
		position: absolute;

		left: 20%;
		top: 1%;

		display: grid;
		grid-template-columns: repeat(8, 1fr);
		width: 60%;
		margin: 0 auto;
	}

	.tile {
		position: relative;
		width: 100%;
		padding-bottom: 100%;
	}

	.tile img {
		position: absolute;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
