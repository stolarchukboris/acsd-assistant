import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('loggedshifts', table => {
		table.specificType('shiftId', 'char(36)').primary();
		table.string('robloxId', 20).notNullable();
		table.integer('startedTimestamp').unsigned().notNullable();
		table.integer('endedTimestamp').unsigned().notNullable();
		table.smallint('lenMinutes').unsigned().notNullable();
		table.text('proof').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('loggedshifts');
}
