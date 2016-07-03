export default async function add(app, $) {
	let dl = await app.downloader;

	$.delete('/download', async (e, { id }) => {
		let removed = await dl.remove(id);

		if(!removed) {
			e.missing('Download does not exist');
		}
	});
}
