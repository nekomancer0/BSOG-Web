<script lang="ts">
	import { Board } from '$lib/board';
	import * as lands from '$lib/lands';
	import { onMount } from 'svelte';

	onMount(() => {
		let board = new Board();

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
					row.style.backgroundSize = `${img.width / 15}px ${img.height / 15}px`;
					row.style.height = `${img.height / 15}px`;
					row.style.width = `${img.width / 15}px`;

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
</div>

<style>
	:global(.container) {
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
		border: 1px solid black;
	}

	:global(.col) {
		display: flex;
		background-color: rgb(255, 255, 255);
	}
</style>
