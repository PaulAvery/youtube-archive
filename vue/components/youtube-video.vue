<template>
	<div class="v-youtube-video">
		<img :src="thumbnail" />

		<div class="meta">
			<h3>{{ title }}</h3>
			<p>{{ description }}</p>
		</div>

		<div class="actions">
			<a :href="url" target="_blank">Open</a>
			<button v-on:click="addDownload(id)">Add</a>
		</div>
	</div>
</template>

<style lang="sass" scoped>
	.v-youtube-video {
		box-shadow: 0px 2px 1px -2px rgba(0,0,0,0.3);
		background-color: rgb(255, 255, 255);
		border-radius: 3px;
		overflow: hidden;

		* {
			float: left;
		}

		img {
			width: 40%;
		}

		div.meta {
			width: 60%;
			padding: 15px;

			h3 {
				font-size: 14px;
				margin: 0;
			}
		}

		div.actions {

		}
	}
</style>

<script>
	export let name = 'YoutubeVideo';
	export let props = [ 'id', 'title', 'thumbnail', 'description' ];

	export let computed = {
		url: function() {
			return `https://www.youtube.com/watch?v=${this.id}`;
		}
	}

	export let methods = {
		addDownload(id) {
			this.$store.dispatch('addDownload', this.id);
		}
	}
</script>
