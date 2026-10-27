import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('activeMShifts', table => {
		table.specificType('shiftId', 'char(36)').primary();
		table.string('discordId', 20).notNullable().unique();
		table.string('robloxId', 20).notNullable().unique();
		table.foreign('robloxId')
			.references('robloxId')
			.inTable('personnel')
			.onUpdate('CASCADE')
			.onDelete('CASCADE');
		table.string('robloxUsername', 22).notNullable().unique();
		table.datetime('startedTimestamp').defaultTo(knex.fn.now());
		table.index('startedTimestamp', 'idx_started_timestamp');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('activemshifts');
}
