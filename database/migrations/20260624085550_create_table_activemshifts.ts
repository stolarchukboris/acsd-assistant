import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('active_m_shifts', table => {
		table.uuid('shift_id').primary();

		table.string('discord_id', 20).notNullable().unique();
		table.string('roblox_id', 20).notNullable().unique();
		table.foreign('roblox_id')
			.references('roblox_id')
			.inTable('personnel')
			.onUpdate('CASCADE')
			.onDelete('CASCADE');

		table.string('roblox_username', 22).notNullable().unique();

		table.timestamp('started_at').defaultTo(knex.fn.now());
		table.index('started_at', 'idx_activemshifts_started_at');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('active_m_shifts');
}
