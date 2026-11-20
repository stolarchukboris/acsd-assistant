import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('pending_shiftlogs', table => {
		table.uuid('job_id').notNullable();
		table.string('wh_message_id', 20).primary();
		table.string('fw_message_id', 20).notNullable().unique();
		table.string('roblox_id', 20).notNullable();
		table.foreign('roblox_id')
			.references('roblox_id')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		table.bigInteger('started_timestamp').notNullable();
		table.bigInteger('ended_timestamp').notNullable();
		table.smallint('len_minutes').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('pending_shiftlogs');
}
