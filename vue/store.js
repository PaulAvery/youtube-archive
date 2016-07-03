import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

/* Wrapper to catch and handle API Errors */
let act = (call) => {
	return async function(...args) {
		let commit = args[0].commit;

		try {
			await call(...args);

			commit('authorize');
		} catch(e) {
			if(! (e instanceof api.ApiError)) {
				throw e;
			}

			if(e instanceof api.UnauthorizedError) {
				commit('unauthorize');
			} else {
				commit('addApiError', e);
			}
		}
	};
};

export default new Vuex.Store({
	state: {
		authorized: false,
		errors: {
			api: []
		},
		downloads: {
			loaded: false,
			running: [],
			failed: []
		},
		history: {
			loaded: false,
			videos: []
		},
		videos: {
			loaded: false,
			videos: []
		}
	},
	mutations: {
		authorize: state => state.authorized = true,
		unauthorize: state => state.authorized = false,

		addApiError: (state, error) => {
			state.errors.api.push(error);
		},

		setDownloads: (state, { failed, running }) => {
			state.downloads.failed = failed;
			state.downloads.running = running;

			state.downloads.loaded = true;
		},
		setHistory: (state, videos) => {
			state.history.videos = videos;

			state.history.loaded = true;
		},
		setVideos: (state, videos) => {
			state.videos.videos = videos;

			state.videos.loaded = true;
		}
	},
	actions: {
		fetchDownloads: act(async ({ commit }) => commit('setDownloads', await api.downloads.list())),
		fetchHistory: act(async ({ commit }) => commit('setHistory', await api.user.history())),
		fetchVideos: act(async ({ commit }) => commit('setVideos', await api.videos.list())),
		addDownload: act(async ({ dispatch }, id) => {
			await api.downloads.add({ id });
			await dispatch('fetchDownloads');
		}),
		removeDownload: act(async ({ dispatch }, id) => {
			await api.downloads.remove({ id });
			await dispatch('fetchDownloads');
		})
	}
});
