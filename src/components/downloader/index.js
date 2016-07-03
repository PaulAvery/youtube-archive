import path from 'path';
import Downloader from './downloader';

/*
 * This component provides the download logic for youtube videos.
 * It can handle aplication restarts and downloads youtube videos based on ID.
 */
export default async function downloader(app, config) {
	let dl = new Downloader(app, config.directory);

	await dl.reload();

	return dl;
}

exports.default.config = {
	directory: path.join(process.cwd(), 'data', 'downloads')
};
