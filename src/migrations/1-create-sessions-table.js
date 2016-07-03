export let up = async (db) => {
	await db.schema.createTable('sessions', table => {
		table.string('id').primary();
		table.text('data');
		table.integer('expires');
	});
};

export let down = async (db) => {
	await db.schema.dropTable('sessions');
};
