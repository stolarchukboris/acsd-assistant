import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('trainings', table => {
		table.uuid('training_id').primary();
		table.string('host_discord_id', 20).notNullable();
		table.foreign('host_discord_id')
			.references('discord_id')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		table.string('host_roblox_id', 20).notNullable();
		table.foreign('host_roblox_id')
			.references('roblox_id')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		table.string('host_roblox_username', 22).notNullable();
		table.foreign('host_roblox_username')
			.references('roblox_username')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		table.string('message_id', 20).defaultTo(null).unique();
		table.bigInteger('starting_timestamp').notNullable().unique();
		table.boolean('is_reminded').defaultTo(false);
		table.boolean('is_rtarted').defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('trainings');
}
