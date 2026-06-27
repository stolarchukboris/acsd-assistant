import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('personnel', table => {
		table.string('robloxId', 20).primary();
		table.string('discordId', 20).notNullable().unique();
		table.string('robloxUsername', 20).notNullable().unique();
		table.string('acsdRank', 50).notNullable();
		table.string('regApprovedBy', 20).notNullable();
		table.datetime('entryCreated').defaultTo(knex.fn.now());
		table.datetime('entryUpdated').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('personnel');
}
