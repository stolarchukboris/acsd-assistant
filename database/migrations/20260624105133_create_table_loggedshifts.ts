import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('loggedShifts', table => {
		table.uuid('shiftId').primary();

		table.string('robloxId', 20).notNullable();

		table.foreign('robloxId')
			.references('robloxId')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');

		table.bigInteger('startedTimestamp').notNullable();
		table.bigInteger('endedTimestamp').notNullable();
		table.index('endedTimestamp', 'idx_loggedshifts_ended_timestamp');

		table.smallint('lenMinutes').notNullable();

		table.text('proof').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('loggedShifts');
}
