import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('loggedshifts', table => {
		table.specificType('shiftId', 'char(36)').primary();
		table.string('robloxId', 20).notNullable();
		table.foreign('robloxId')
			.references('robloxId')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		table.integer('startedTimestamp').unsigned().notNullable();
		table.integer('endedTimestamp').unsigned().notNullable();
		table.index('endedTimestamp', 'idx_ended_timestamp');
		table.smallint('lenMinutes').unsigned().notNullable();
		table.text('proof').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('loggedshifts');
}
