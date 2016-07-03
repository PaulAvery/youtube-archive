<template>
	<div class="v-history">
		<div v-if="authorized">
			<Loader v-if="loading"></Loader>
			<ul v-else>
				<li :key="video.id" v-for="video in history">
					<YoutubeVideo :id="video.id" :title="video.title" :thumbnail="video.thumbnail" :description="video.description" />
				</li>
			</ul>
		</div>

		<div class="authorize" v-else>
			<p>You need to give this application access to your YouTube account to view your history.</p>
			<a href="/oauth">Authorize</a>
		</div>
	</div>
</template>

<style lang="sass" scoped>
	.authorize {
		margin: 25px;

		p {
			display: block;
			text-align: center;
			color: rgb(138, 149, 165);
			line-height: 1.5rem;
		}

		a {
			width: 160px;
			color: rgb(255, 255, 255);
			margin: 30px auto;
			padding: 12px;
			display: block;
			font-size: 14px;
			text-align: center;
			font-weight: bold;
			border-radius: 3px;
			text-decoration: none;
			background-color: rgb(71, 186, 193);
		}
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;

		li {
			margin-bottom: 25px;
		}

		li:last-child {
			margin-bottom: 0px;
		}
	}
</style>

<script>
	export let name = 'History';

	export let computed = {
		loading() {
			return !this.$store.state.history.loaded;
		},
		history() {
			return this.$store.state.history.videos;
		},
		authorized() {
			return this.$store.state.authorized;
		}
	}

	export function created() {
		return this.fetchData();
	}

	export let methods = {
		fetchData() {
			this.$store.dispatch('fetchHistory').then(() => { this.loading = false; });
		}
	}
</script>
