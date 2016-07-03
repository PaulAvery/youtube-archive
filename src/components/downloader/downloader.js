import fs from 'fs-extra';
import {UserError} from '../../utils';
import YoutubeDownload from './youtube-download';

export default class Downloader {
	constructor(app, directory) {
		this.app = app;
		this.downloads = [];
		this.directory = directory;

		/* Create directory if neccessary */
		fs.mkdirpSync(this.directory);
	}

	/* Reload previously running downloads */
	async reload() {
		let ids = await Promise.all(fs.readdirSync(this.directory).map(async (id) => {
			await this.add(id);

			return id;
		}));

		this.app.logger.info('Downloads resumed', {ids});
	}

	/* Get all non-failed downloads */
	getRunning() {
		return this.downloads.filter(d => !d.error);
	}

	/* Get all failed downloads */
	getFailed() {
		return this.downloads.filter(d => d.error);
	}

	/*
	 * Start a new download for a given id
	 */
	async add(id) {
		if(!this.getRunning().find(d => d.download.id === id)) {
			/* Remove eventual failed download */
			await this.remove(id);

			let dl = {
				error: null,
				download: new YoutubeDownload(this.app, id, this.directory)
			};

			dl.download.promise.then(async () => {
				/* Add it to storage */
				await (await this.app.storage).import(id, dl.download.mergedFile);

				/* And remove it from the downloader */
				await this.remove(id);

				this.app.logger.info('Download completed', {id});
			}).catch(e => {
				/* Save the error so we can filter it properly */
				dl.error = e || true;

				this.app.logger.error(`Download failed: ${e}`, {id});
			}).then(() => {
				/* Finally start the next download if available */
				let waiting = this.getRunning();

				if(waiting.length > 0) {
					waiting[0].download.start();
				}
			});

			/* Start only if nothing else is currently running */
			if(this.getRunning().length === 0) {
				dl.download.start();
			}

			this.downloads.push(dl);

			this.app.logger.info('Download added', {id});
		}
	}

	/*
	 * Remove a download from the list
	 */
	async remove(id) {
		for(let i in this.downloads) {
			if(this.downloads[i].download.id === id) {
				let dl = this.downloads.splice(i, 1)[0];
				await dl.download.destroy();

				return true;
			}
		}

		return false;
	}
}
