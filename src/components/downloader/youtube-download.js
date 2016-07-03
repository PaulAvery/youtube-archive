import fs from 'fs-extra';
import path from 'path';
import ytdl from 'ytdl-core';
import {exists, promise, idToUrl, UserError} from '../../utils';
import {EventEmitter} from 'events';
import Download from './download';

/* List of itags ordered by desirability */
const itags = {
	video: [
		'315', // 2160 HFR
		'308', // 1440 HFR
		'299', // 1080 HFR
		'303', // 1080 HFR
		'298', // 720 HFR
		'302', // 720 HFR
		'138', // 2160
		'266', // 2160
		'313', // 2160
		'271', // 1440
		'264', // 1440
		'137', // 1080
		'248', // 1080
		'136', // 720
		'247' // 720
	],
	audio: [
		'141',
		'140',
		'171'
	]
};

export default class YoutubeDownload extends EventEmitter {
	/* "Enum" of possible states */
	static get state() {
		return {
			WAITING: 0,
			DOWNLOADING: 1,
			CONVERTING: 2,
			DONE: 3,
			FAILED: 4
		};
	}

	constructor(app, id, directory) {
		super();

		this.id = id;
		this.app = app;
		this.directory = path.join(directory, id);
		this.audioFile = path.join(this.directory, 'audio');
		this.videoFile = path.join(this.directory, 'video');
		this.mergedFile = path.join(this.directory, 'merged');

		this.error = null;
		this.state = YoutubeDownload.state.WAITING;
		this.getProgress = () => 0;

		this.promise = new Promise((res, rej) => { this.resolve = res; this.reject = rej; });

		this.promise.then(() => {
			this.progress = 1;
			this.state = YoutubeDownload.state.DONE;
		});

		this.promise.catch(e => {
			this.error = e;
			this.state = YoutubeDownload.state.FAILED;
		});

		/* Create the directory so we may resume even waiting downloads */
		fs.mkdirsSync(this.directory);
	}

	get progress() {
		return this.getProgress();
	}

	/* Start the download */
	start() {
		this.state = YoutubeDownload.state.DOWNLOADING;

		this.promise = this.download().then(() => {
			this.state = YoutubeDownload.state.CONVERTING;
			return this.merge();
		}).then(this.resolve, this.reject);
	}

	/* Stop this download and remove all remaints of it */
	async destroy() {
		await promise(cb => fs.remove(this.directory, cb));
	}

	/* Get the best video and audio streams for a given id */
	async getBestStreams() {
		let meta = await promise(cb => ytdl.getInfo(idToUrl(this.id), cb));
		let formats = meta.formats;

		let tags = {
			video: itags.video.find(itag => formats.find(format => format.itag === itag)),
			audio: itags.audio.find(itag => formats.find(format => format.itag === itag))
		};

		return {
			video: formats.find(format => format.itag === tags.video),
			audio: formats.find(format => format.itag === tags.audio)
		};
	}

	/* Start / resume the download */
	async download() {
		let streams = await this.getBestStreams();

		if(!streams.video || !streams.audio) {
			throw new UserError('No fitting quality found!');
		}

		let audio = new Download(this.audioFile, streams.audio.url);
		let video = new Download(this.videoFile, streams.video.url);

		this.getProgress = () => ((audio.progress + video.progress) / (audio.size + video.size)) || 0;

		this.audio = new Promise((res, rej) => {
			audio.once('error', rej);
			video.once('done', res);
		});

		this.video = new Promise((res, rej) => {
			video.once('error', rej);
			video.once('done', res);
		});

		await audio.start();
		await video.start();

		return Promise.all([this.audio, this.video]);
	}

	/* Convert the file if neccessary */
	async merge() {
		let tempMergedFile = this.mergedFile + '.tmp';

		/* Remove existing temporary merge file */
		await promise(cb => fs.remove(tempMergedFile, cb));

		if(await exists(this.mergedFile)) {
			/* We merged the files already, so return */
			return;
		} else {
			let progress = 0;
			let ff = await this.app.ffmpeg;

			this.getProgress = () => progress;

			/* Run conversion */
			await new Promise((res, rej) => {
				let conversion = ff()
					.input(this.audioFile)
					.audioCodec('copy')

					.input(this.videoFile)
					.videoCodec('copy')

					.output(tempMergedFile)
					.format('matroska');

				conversion.on('start', cmd => this.app.logger.info('Running conversion', {id: this.id, cmd}));
				conversion.on('progress', ({ percent }) => { progress = percent / 100; });
				conversion.on('error', rej);
				conversion.on('end', res);

				conversion.run();
			});

			/* Move file over */
			await promise(cb => fs.rename(tempMergedFile, this.mergedFile, cb));
		}
	}
}
