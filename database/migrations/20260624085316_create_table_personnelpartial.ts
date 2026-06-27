import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('personnelpartial', table => {
		table.string('robloxId', 20).primary();
		table.string('robloxUsername', 20).notNullable().unique();
		table.datetime('entryCreated').defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('personnelpartial');
}
