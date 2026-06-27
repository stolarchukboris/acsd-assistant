import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('activemshifts', table => {
		table.specificType('shiftId', 'char(36)').primary();
		table.string('discordId', 20).notNullable().unique();
		table.string('robloxId', 20).notNullable().unique();
		table.string('robloxUsername', 20).notNullable().unique();
		table.datetime('startedTimestamp').defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('activemshifts');
}
