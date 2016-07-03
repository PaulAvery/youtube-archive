import $ from 'koa-route';
import fs from 'fs-extra';
import path from 'path';
import stream from 'koa-stream';
import convert from 'koa-convert';
import {promise, exists} from '../../utils';

/*
 * This component handles the storage of all youtube videos.
 * Currently it can simply import them from another location on-disk.
 */
export default async function storage(app, config) {
	/* Path which contains files by id */
	let idPath = path.join(config.directory, 'byId');

	/* Ensure neccessary directories exist */
	await promise(cb => fs.mkdirs(idPath, cb));

	/* Load existing files into in-memory array */
	let videoCache = await promise(cb => fs.readdir(idPath, cb)).then(files => files.map(f => path.basename(f, '.mkv')));

	/* Get the filename for a given id */
	let toFile = id => path.join(idPath, id + '.mkv');

	/* Add a given file to storage */
	let add = async (id, file) => {
		/* Move over */
		await promise(cb => fs.rename(file, toFile(id), cb));

		/* Add to store */
		videoCache.push(id);
	};

	/* Serve the videos for streaming */
	(await app.webserver).use($.get('/video/:file', async (ctx, file) => {
		await convert(function *() {
			yield stream.file(this, file, { root: idPath, allowDownload: true });
		})(ctx, () => {});
	}));

	/* Expose methods to remaining app */
	return {
		has: id => videoCache.indexOf(id) > -1,
		import: (id, file) => add(id, file),
		getVideos: () => videoCache
	};
}

exports.default.config = {
	directory: path.join(process.cwd(), 'data', 'videos')
};
