import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('pendingShiftlogs', table => {
		table.uuid('jobId').notNullable();
		table.string('whMessageId', 20).primary();
		table.string('fwMessageId', 20).notNullable().unique();
		table.string('robloxId', 20).notNullable();
		table.foreign('robloxId')
			.references('robloxId')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		table.bigInteger('startedTimestamp').notNullable();
		table.bigInteger('endedTimestamp').notNullable();
		table.smallint('lenMinutes').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('pendingShiftlogs');
}
