export let up = async (db) => {
	await db.schema.createTable('metadata', table => {
		table.string('id').primary();
		table.string('title');
		table.integer('date');
		table.string('channel');
		table.text('description');
		table.string('thumbnail');
		table.text('tags');
	});
};

export let down = async (db) => {
	await db.schema.dropTable('metadata');
};
