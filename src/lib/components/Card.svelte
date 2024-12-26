<script lang="ts">
	import type { BaseThing } from '$lib/types';

	export let card: BaseThing<any>;
</script>

<div class="card">
	<img src={card.image} alt={card.name} />
</div>

<style>
	.card {
		cursor: pointer;
		transition: transform 0.2s ease;

		width: 120px; /* reduced from default size */
		height: 168px; /* maintaining 1.4:1 aspect ratio */

		&:hover {
			transform: translateY(-10px) scale(1.1);
			z-index: 10;
		}

		img {
			width: 100%;
			height: 100%;
		}
	}
</style>
