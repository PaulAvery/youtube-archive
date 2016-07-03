<template>
	<div class="v-downloads">
		<Loader v-if="loading" />

		<div v-else>
			<div class="addDownload">
				<input type="text" v-model="id"></input>
				<button v-on:click="addDownload">Add</button>
			</div>

			<div class="running" v-if="running.length">
				<h2>Running</h2>
				<ul class="running">
					<li v-for="download in running" :key="download.id">
						<Download :id="download.id" :progress="download.progress">{{ download.id }} - {{download.status}}</Download>
					</li>
				</ul>
			</div>

			<div class="failed" v-if="failed.length">
				<h2>Failed</h2>
				<ul class="failed">
					<li v-for="download in failed" :key="download.id">
						<Download :id="download.id" :progress="download.progress" failed="true">{{ download.id }} - {{download.error}}</Download>
					</li>
				</ul>
			</div>

			<span class="placeholder" v-if="empty">
				No Downloads Running
			</span>
		</div>
	</div>
</template>

<style lang="sass" scoped>
	.addDownload {
		width: 100%;
		display: flex;
		overflow: hidden;
		box-shadow: 0px 0px 2px 0px rgba(0,0,0,0.3);
		border-radius: 3px;
		margin-bottom: 25px;

		* {
			border: none;
			padding: 12px;
			font-size: 14px;
		}

		input {
			flex: 4;
			color: rgb(111, 122, 139);
		}

		button {
			flex: 1;
			cursor: pointer;
			color: rgb(255, 255, 255);
			background-color: rgb(71, 186, 193);
		}
	}

	.addDownload:after {
		visibility: hidden;
		content: ' ';
		display: block;
		clear: both;
		height: 0;
	}

	h2 {
		color: rgb(89, 102, 121);
		margin: 25px 0 0 0;
		font-size: 16px;
		font-weight: bold;
		padding-left: 5px;
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;

		li {
			margin: 10px 0 0 0;
			position: relative;
		}
	}

	.placeholder {
		color: rgb(138, 149, 165);
		margin: 50px 0 25px 0;
		display: block;
		text-align: center;
		font-weight: bold;
	}
</style>

<script>
	export let name = 'Downloads';

	export function data() {
		return {
			id: ''
		};
	}

	export let computed = {
		loading() {
			return !this.$store.state.downloads.loaded;
		},
		empty() {
			return this.running.length === 0 && this.failed.length === 0
		},
		running() {
			return this.$store.state.downloads.running;
		},
		failed() {
			return this.$store.state.downloads.failed;
		}
	}

	export function created() {
		this.fetchData();

		if(typeof window !== 'undefined') {
			this.interval = window.setInterval(() => this.fetchData(), 1000);
		}
	}

	export function destroyed() {
		if(typeof window !== 'undefined') {
			window.clearInterval(this.interval);
		}
	}

	export let methods = {
		fetchData() {
			this.$store.dispatch('fetchDownloads');
		},
		addDownload() {
			this.$store.dispatch('addDownload', this.id);
		}
	}
</script>
