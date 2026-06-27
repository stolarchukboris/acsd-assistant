import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('pendingregs', table => {
		table.string('robloxId', 20).primary();
		table.string('discordId', 20).notNullable().unique();
		table.string('robloxUsername', 20).notNullable().unique();
		table.string('acsdRank', 50).notNullable();
		table.string('adminMessageId', 20).defaultTo(null).unique();
		table.datetime('entryCreated').defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('pendingregs');
}
