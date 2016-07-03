import {serializeError} from '../../../../utils';

export default async function list(app, $) {
	let dl = await app.downloader;

	let format = d => {
		return {
			id: d.download.id,
			error: d.error ? serializeError(d.error) : false,
			status: ['Waiting', 'Downloading', 'Converting', 'Done', 'Failed'][d.download.state],
			progress: d.download.progress
		};
	};

	$.get('/downloads', () => {
		return {
			running: dl.getRunning().map(format),
			failed: dl.getFailed().map(format)
		};
	});
}
