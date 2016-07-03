export default async function list(app, $) {
	let storage = await app.storage;
	let metadata = await app.metadata;

	$.get('/videos', async () => {
		let videos = await storage.getVideos();

		return Promise.all(videos.map(metadata));
	});
}
