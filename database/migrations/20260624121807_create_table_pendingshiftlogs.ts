import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('pendingshiftlogs', table => {
		table.specificType('jobId', 'char(36)').notNullable();
		table.string('whMessageId', 20).primary();
		table.string('fwMessageId', 20).notNullable().unique();
		table.string('robloxId', 20).notNullable();
		table.integer('startedTimestamp').unsigned().notNullable();
		table.integer('endedTimestamp').unsigned().notNullable();
		table.smallint('lenMinutes').unsigned().notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('pendingshiftlogs');
}
