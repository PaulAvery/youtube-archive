export default async function add(app, $) {
	let dl = await app.downloader;

	$.post('/download', async (e, {id}) => {
		if(encodeURIComponent(id) !== id) {
			e.invalid('Invalid Video ID');
		}

		await dl.add(id);
	});
}
