import fs from 'fs-extra';
import path from 'path';
import {promise, exists} from '../../utils';
import {EventEmitter} from 'events';
import Mtd from 'zeltice-mt-downloader';

export default class Download extends EventEmitter {
	constructor(pth, url) {
		super();

		this.url = url;
		this.path = pth;
		this.mtdPath = this.path + '.mtd';

		this.size = 0;
		this.done = false;
		this.error = null;
		this.getProgress = () => 0;
	}

	get progress() {
		return this.getProgress();
	}

	async start() {
		await promise(cb => fs.mkdirp(path.dirname(this.path), cb));

		if(await exists(this.path)) {
			this.done = true;
			this.getProgress = () => this.size;

			this.emit('done');
		} else if(await exists(this.mtdPath)) {
			let download = new Mtd(this.mtdPath, null, {
				onStart: meta => {
					this.size = meta.size;
					this.getProgress = () => meta.threads.map(t => t.position - t.start).reduce((a, b) => a + b);
				},
				onEnd: (e, r) => {
					if(e) {
						this.error = e;

						this.emit('error', e);
					} else {
						this.done = true;
						this.getProgress = () => 1;

						this.emit('done', r);
					}
				}
			});

			download.start();
		} else {
			let download = new Mtd(this.path, this.url, {
				onStart: meta => {
					this.size = meta.size;
					this.getProgress = () => meta.threads.map(t => t.position - t.start).reduce((a, b) => a + b);
				},
				onEnd: (e, r) => {
					if(e) {
						this.error = e;

						this.emit('error', e);
					} else {
						this.done = true;
						this.getProgress = () => 1;

						this.emit('done', r);
					}
				}
			});

			download.start();
		}
	}
}
