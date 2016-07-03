<template>
	<div class="v-download" :class="{ failed }">
		<label>
			<slot />
		</label>

		<progress :value="progress" max="1"></progress>

		<button v-if="failed" v-on:click="removeDownload">
			⨯
		</button>
	</div>
</template>

<style lang="sass" scoped>
	.v-download {
		label {
			top: 0px;
			left: 0px;
			padding: 10px;
			position: absolute;
		}

		button {
			top: 0px;
			right: 0px;
			border: none;
			padding: 10px;
			cursor: pointer;
			position: absolute;
			background: transparent;
		}

		progress {
			width: 100%;
			height: 40px;
			border: none;
			overflow: hidden;
			border-radius: 3px;
			box-shadow: 0px 2px 1px -2px rgba(0,0,0,0.3);
			background-color: white;
		}

		progress::-moz-progress-bar {
			background: repeating-linear-gradient(
				45deg,
				rgb(55, 168, 175),
				rgb(55, 168, 175) 20px,
				rgb(71, 186, 193) 20px,
				rgb(71, 186, 193) 40px
			);
		}

		.failed {
			progress::-moz-progress-bar {
				background: rgb(174, 105, 175);
			}
		}
	}
</style>

<script>
	export let props = [ 'id', 'progress', 'label', 'failed' ];

	export let methods = {
		removeDownload() {
			this.$store.dispatch('removeDownload', this.id);
		}
	}
</script>
