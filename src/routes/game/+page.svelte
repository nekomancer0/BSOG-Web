<script lang="ts">
	import { Board } from '$lib/board';
	import * as Cards from '$lib/cards';
	import { generateDeckForRyuu, isHeroUnit } from '$lib/decks';
	import { onMount } from 'svelte';

	let ryuu = new Cards.Ryuu();

	let keys = Object.keys(Cards) as (keyof typeof Cards)[];

	keys.forEach((key) => {
		let card = Cards[key];
		if (isHeroUnit(card)) {
			console.log(card);
		}
	});

	onMount(async () => {
		let board = new Board();

		let deck = await generateDeckForRyuu();
		console.log(deck);
		board.spawnUnit(ryuu);

		// Generer les divs pour accueillir les terrains sur le board

		for (let x = 0; x <= 8; x++) {
			let col = document.createElement('div');
			col.classList.add('col', `col-${x}`);

			for (let y = 0; y <= 8; y++) {
				let row = document.createElement('div');
				row.classList.add('row', `row-${y}`);

				col.appendChild(row);
			}

			document.querySelector('.board')!.appendChild(col);
		}

		function getRowByPos(pos: { x: number; y: number }) {
			return document.querySelector<HTMLDivElement>(`.col-${pos.x} .row-${pos.y}`);
		}

		board.lands.forEach((entry) => {
			let row = getRowByPos(entry.pos);
			if (row) {
				let fullUrlImage = `/img/lands/${entry.land.id}.png`;

				// Set background image
				row.style.backgroundImage = `url(${fullUrlImage})`;

				// Apply right size of the div
				let img = new Image();
				img.src = fullUrlImage;

				img.onload = () => {
					row.style.backgroundSize = `${img.width / 14}px ${img.height / 14}px`;
					row.style.height = `${img.height / 14}px`;
					row.style.width = `${img.width / 14}px`;

					// Listen for Alt key to see the land bigger
					row.addEventListener('click', (event) => {
						event.preventDefault();
						let previewDiv = document.querySelector('.preview')!;

						let img = document.createElement('img');
						img.src = fullUrlImage;

						previewDiv.innerHTML = '';
						previewDiv.appendChild(img);

						// Preview image clear

						let func = () => {
							previewDiv.innerHTML = '';

							previewDiv.removeEventListener('click', func);
						};

						previewDiv.addEventListener('click', func);
					});
				};
			}
		});
	});
</script>

<div class="container">
	<div class="board"></div>
	<div class="preview"></div>

	<div class="player-view">
		<button class="draw">Draw</button>
		<button class="end-turn">End Turn</button>
		<div class="hand"></div>
	</div>
</div>

<style>
	:global(.container) {
	}

	.player-view {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		gap: 10px;
		background-color: rgb(255, 255, 255);
		position: absolute;
		bottom: 20px;
		right: 20px;
		z-index: 1;
		box-sizing: border-box;
		font-size: 1.5rem;
		font-family: 'Dosis', sans-serif;
		color: rgb(0, 0, 0);
		font-weight: 600;
		font-style: normal;
	}

	.player-view button {
		background-color: cyan;
		border-radius: 15px;
		padding: 5px;
		border: 1px solid #0f0f0f;
		font-size: 1.3rem;
		font-family: 'Dosis', sans-serif;
		font-weight: 600;
		font-style: normal;
	}

	:global(.board) {
		display: flex;
		flex-direction: column;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		z-index: -1;
	}

	:global(.preview) {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);

		width: 30%;
	}

	:global(.row) {
		background-color: rgb(255, 255, 255);
	}

	:global(.col) {
		display: flex;
		background-color: rgb(255, 255, 255);
	}
</style>
