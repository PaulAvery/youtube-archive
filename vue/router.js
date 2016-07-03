import Vue from 'vue';
import VueRouter from 'vue-router';
import * as Videos from './views/videos.vue';
import * as History from './views/history.vue';
import * as Downloads from './views/downloads.vue';

Vue.use(VueRouter);

export default new VueRouter({
	mode: 'history',
	routes: [
		{ path: '/', redirect: '/videos' },
		{ path: '/videos', component: Videos },
		{ path: '/history', component: History },
		{ path: '/downloads', component: Downloads }
	]
});
