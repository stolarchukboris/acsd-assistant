import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('activeShifts', table => {
		table.specificType('jobId', 'char(36)').notNullable();
		table.string('whMessageId', 20).primary();
		table.string('fwMessageId', 20).notNullable().unique();
		table.string('robloxId', 20).notNullable().unique();
		table.foreign('robloxId')
			.references('robloxId')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		table.integer('startedTimestamp').unsigned().notNullable();
		table.index('startedTimestamp', 'idx_started_timestamp');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('activeshifts');
}
