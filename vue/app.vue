<template>
	<div class="app">
		<div class="header">
			<h1>Youtube Archive</h1>
			<router-link to="/history">HISTORY</router-link>
			<router-link to="/downloads">DOWNLOADS</router-link>
			<router-link to="/videos">VIDEOS</router-link>
		</div>
		<div class="content">
			<router-view></router-view>
		</div>
	</div>
</template>

<style lang="sass">
	html {
		background:
			radial-gradient(rgb(40, 75, 87) 15%, transparent 16%) 0 0,
			radial-gradient(rgb(40, 75, 87) 15%, transparent 16%) 8px 8px,
			radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 0 1px,
			radial-gradient(rgba(255,255,255,.1) 15%, transparent 20%) 8px 9px;

		background-color: rgb(57, 107, 124);
		background-size:16px 16px;

		* {
			box-sizing: border-box;
		}
	}

	.app {
		color: rgb(78, 81, 94);
		max-width: 600px;
		margin: 100px auto;
		font-family: 'Open Sans';
		background: rgb(254, 254, 254);
		box-shadow: 0px 0px 4px -2px rgba(0,0,0,0.75);

		.header {
			padding: 50px 22px 0px 22px;
			border-bottom: 1px solid rgb(216, 223, 229);

			h1 {
				margin: 0 0 50px 23px;
				font-size: 25px;
				font-weight: normal;
			}

			a {
				float: left;
				color: rgb(138, 149, 165);
				margin: 0 23px;
				padding-bottom: 15px;
				text-decoration: none;
				font-size: 14px;
				font-weight: bold;
			}

			a.router-link-active {
				color: rgb(78, 81, 94);
				border-bottom: 3px solid rgb(21, 164, 250);
			}
		}

		.header:after {
			visibility: hidden;
			content: ' ';
			display: block;
			clear: both;
			height: 0;
		}

		.content {
			padding: 25px;
			border-top: 1px solid rgb(229, 235, 240);
			background-color: rgb(236, 242, 246);
		}
	}
</style>

<script>
	import Vue from 'vue';
	import * as Loader from './components/loader.vue';
	import * as Download from './components/download.vue';
	import * as YoutubeVideo from './components/youtube-video.vue';

	Vue.component('Loader', Loader);
	Vue.component('Download', Download);
	Vue.component('YoutubeVideo', YoutubeVideo);

	export {default as store} from './store';
	export {default as router} from './router';
</script>
