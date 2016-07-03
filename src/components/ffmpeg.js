import os from 'os';
import fs from 'fs-extra';
import tar from 'tar-fs';
import path from 'path';
import lzma from 'lzma-native';
import https from 'https';
import unzip from 'unzip';
import {exists, promise} from '../utils';
import fluentFFmpeg from 'fluent-ffmpeg';

/*
 * This component provides an instance of fluent-ffmpeg to the application.
 * It is able to download the latest version of a statically compiled FFmpeg binary on startup.
 */
export default async function ffmpeg(app, config) {
	/* Download FFmpeg into the given directory */
	async function downloadFFmpeg(directory) {
		switch(os.platform()) {
			case 'win32':
				await downloadFFmpegWindows(directory);
				break;
			case 'linux':
				await downloadFFmpegLinux(directory);
				break;
			case 'darwin':
				await downloadFFmpegOSX(directory);
				break;
			default:
				throw new Error(`FFMpeg download for platform ${os.platform()} not implemented!`);
				break;
		}
	}

	/* Download FFmpeg on linux into the given directory  */
	async function downloadFFmpegLinux(directory) {
		let url = 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-64bit-static.tar.xz';
		let tempDir = directory + '.tmp';

		app.logger.info('Starting download of FFmpeg', {url});

		/* Remove directories */
		await promise(cb => fs.remove(tempDir, cb));
		await promise(cb => fs.remove(directory, cb));

		/* Start the actual download */
		await new Promise((res, rej) => {
			https.get(url, r => {
				if(r.statusCode !== 200) {
					rej(new Error(`Download of FFmpeg failed with status ${r.statusCode}`));
				} else {
					let decompress = lzma.createDecompressor();
					let extract = tar.extract(tempDir);

					/* Try to handle errors */
					r.on('error', rej);
					decompress.on('error', rej);
					extract.on('error', rej);

					extract.on('finish', res);

					r.pipe(decompress).pipe(extract);
				}
			}).on('error', rej);
		});

		/* Get the toplevel subdirectory we just extracted */
		let dir = (await promise(cb => fs.readdir(tempDir, cb)))[0];

		/* Move it over */
		await promise(cb => fs.rename(path.join(tempDir, dir), directory, cb));

		/* And delete the temporary directory */
		await promise(cb => fs.remove(tempDir, cb));
	}

	/* Download FFmpeg on Windows into the given directory */
	async function downloadFFmpegWindows(directory) {
		let url = 'https://ffmpeg.zeranoe.com/builds/win64/static/ffmpeg-latest-win64-static.zip'
		let tempDir = directory + '.tmp';

		app.logger.info('Starting download of FFmpeg', {url});

		/* Remove directories */
		await promise(cb => fs.remove(tempDir, cb));
		await promise(cb => fs.remove(directory, cb));

		/* Start the actual download */
		await new Promise((res, rej) => {
			https.get(url, r => {
				if(r.statusCode !== 200) {
					rej(new Error(`Download of FFmpeg failed with status ${r.statusCode}`));
				} else {
					let extract = unzip.Extract({ path: tempDir });

					/* Try to handle errors */
					r.on('error', rej);
					extract.on('error', rej);

					extract.on('close', res);
					r.pipe(extract);
				}
			}).on('error', rej);
		});

		/* Move over the extracted toplevel directory */
		await promise(cb => fs.rename(path.join(tempDir, 'ffmpeg-latest-win64-static/bin'), directory, cb));

		/* And delete the temporary directory */
		await promise(cb => fs.remove(tempDir, cb));
	}

	/* Download FFmpeg on OSX into the given directory */
	async function downloadFFmpegOSX(directory) {
		throw new Error('FFmpeg download under OSX not implemented');
	}

	/* Set up everything */
	let ff = fluentFFmpeg;

	if(!config.useSystemBinaries) {
		app.logger.info('Using own FFmpeg');

		let ffmpegPath = path.join(config.directory, 'ffmpeg' + (os.platform() === 'win32' ? '.exe' : ''));
		let ffprobePath = path.join(config.directory, 'ffprobe' + (os.platform() === 'win32' ? '.exe' : ''));

		if(!(await exists(ffmpegPath) && await exists(ffprobePath))) {
			await downloadFFmpeg(config.directory);

			app.logger.info('Finished download of FFmpeg');
		}

		ff.setFfmpegPath(ffmpegPath);
		ff.setFfprobePath(ffprobePath);
	} else {
		app.logger.info('Using system FFmpeg');
	}

	/* Test the FFmpeg binary */
	await promise(cb => ff.getAvailableFormats(cb));

	return ff;
}

exports.default.config = {
	directory: path.join(process.cwd(), 'data', 'ffmpeg'),
	useSystemBinaries: true
};
