/*
 * A component to get metadata information about a given video.
 * It caches the results from youtube in the database
 */
export default async function metadata(app) {
	let yt = await app.youtube;
	let db = await app.database;

	function formatSnippetToMeta(snippet, id = false) {
		let thumbnails = Object.keys(snippet.thumbnails).map(key => snippet.thumbnails[key]);

		thumbnails.sort((a, b) => {
			return a.width < b.width;
		});

		return {
			id: id || snippet.resourceId.videoId,
			title: snippet.title,
			date: new Date(snippet.publishedAt).getTime(),
			channel: snippet.channelTitle,
			description: snippet.description,
			thumbnail: thumbnails[0].url,
			tags: snippet.tags,
			source: 'youtube'
		};
	}

	/* Try to retrieve the data from the database */
	async function getFromDb(id) {
		let raw = await db('metadata').select().where('id', id);

		if(raw.length > 0) {
			let meta = raw[0];
			meta.tags = JSON.parse(meta.tags);
			meta.source = 'cache';

			return meta;
		} else {
			return null;
		}
	}

	/* Retrieves the data directly from youtube */
	async function getFromYoutube(id) {
		let raw = (await yt.system.videos.list({id, part: 'snippet'})).items[0];

		return formatSnippetToMeta(raw.snippet, id);
	}

	/* Adds data to the database */
	async function addToDb(raw) {
		let data = {
			id: raw.id,
			title: raw.title,
			date: raw.date,
			channel: raw.channel,
			description: raw.description,
			thumbnail: raw.thumbnail,
			tags: JSON.stringify(raw.tags)
		};

		await db('metadata').insert(data);
	}

	/* Get data from database cache or api */
	let mt = async (id) => {
		let data = await getFromDb(id);

		if(!data) {
			data = await getFromYoutube(id);
			addToDb(data);
		}

		return data;
	};

	/* Small utility to format youtube snippet responses */
	mt.format = formatSnippetToMeta;

	return mt;
}
