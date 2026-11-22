import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('active_shifts', table => {
		table.uuid('job_id').notNullable();

		table.string('wh_message_id', 20).primary();
		table.string('fw_message_id', 20).notNullable().unique();
		table.string('roblox_id', 20).notNullable().unique();
		table.foreign('roblox_id')
			.references('roblox_id')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');

		table.timestamp('started_at').defaultTo(knex.fn.now());
		table.index('started_at', 'idx_activeshifts_started_at');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('activeShifts');
}
