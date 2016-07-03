<template>
	<div class="v-spinner">
		<div>
			<div></div>
			<div></div>
		</div>
	</div>
</template>


<style lang="sass" scoped>
	.v-spinner > div {
		position: relative;
		height: 60px;
		width: 60px;
		margin: 0 auto;
	}

	.v-spinner > div > div {
		background-color: #15a4fa;
		height: 60px;
		width: 60px;
		border-radius: 100%;
		opacity: 0.6;
		position: absolute;
		top: 0;
		left: 0;
	}

	.v-spinner > div > div:first-child {
		animation: v-bounceStretchDelay 2s 1s infinite ease-in-out;
		animation-fill-mode: both;
	}

	.v-spinner > div > div:last-child {
		animation: v-bounceStretchDelay 2s 0s infinite ease-in-out;
		animation-fill-mode: both;
	}

	@keyframes v-bounceStretchDelay {
		0%,
		100% { transform: scale(0); }
		50% { transform: scale(1.0); }
	}
</style>

<script>
	export let name = 'Loader';
</script>
