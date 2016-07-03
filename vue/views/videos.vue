<template>
	<div class="v-videos">
		<Loader v-if="loading"></Loader>

		<ul v-else>
			<li v-for="video in videos">
				{{ video.id }}<br>
				{{ video.title }}<br>
				{{ video.date }}<br>
				{{ video.channel }}<br>
				{{ video.description }}<br>
				{{ video.thumbnail }}<br>
				<br/>

				<span v-for="tag in video.tags">
					{{ tag }}
				</span>
			</li>
		</ul>
	</div>
</template>

<script>
	export let name = 'Videos';

	export let computed = {
		loading() {
			return this.$store.state.videos.loading;
		},
		videos() {
			return this.$store.state.videos.videos;
		}
	}

	export function created() {
		this.fetchData();
	}

	export let methods = {
		fetchData() {
			this.$store.dispatch('fetchVideos');
		}
	}
</script>
