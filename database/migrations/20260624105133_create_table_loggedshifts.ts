import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('logged_shifts', table => {
		table.uuid('shift_id').primary();

		table.string('roblox_id', 20).notNullable();
		table.foreign('roblox_id')
			.references('roblox_id')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');

		table.timestamp('started_at').notNullable();
		table.timestamp('ended_at').notNullable();
		table.index('ended_at', 'idx_loggedshifts_ended_at');

		table.smallint('len_minutes').notNullable();

		table.text('proof').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('logged_shifts');
}
