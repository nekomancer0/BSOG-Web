<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}

<style>
	@import url('https://fonts.googleapis.com/css2?family=Aclonica&family=Dosis:wght@200..800&display=swap');

	:global(h1) {
		font-family: 'Aclonica', sans-serif;
		font-size: 5rem;
		text-align: center;
		font-weight: 400;
		font-style: normal;
	}

	:global(h2) {
		text-align: center;
		font-size: 3rem;
	}

	:global(h3) {
		text-align: right;
		font-size: 1.4rem;
		text-decoration-line: underline;
		text-transform: uppercase;
	}

	:global(p) {
	}

	:global(*) {
		font-family: 'Dosis', sans-serif;
		font-optical-sizing: auto;
		font-weight: 400;
		font-style: normal;
	}
</style>
