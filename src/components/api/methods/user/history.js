export default async function list(app, $) {
	let yt = await app.youtube;
	let meta = await app.metadata;

	$.get('/user/history', async e => {
		if(!yt.authenticated()) e.unauthorized('Not logged in to YouTube');

		let userdata = (await yt.user.channels.list({ part: 'contentDetails', mine: true }));
		let playlistId = userdata.items[0].contentDetails.relatedPlaylists.watchHistory;

		let result = await yt.user.playlistItems.list({ part: 'snippet', playlistId: playlistId, maxResults: 10 });

		return result.items.map(i => meta.format(i.snippet));
	});
}
