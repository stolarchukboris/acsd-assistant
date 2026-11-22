import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('pending_regs', table => {
		table.string('roblox_id', 20).primary();
		table.string('discord_id', 20).notNullable().unique();
		table.string('roblox_username', 22).notNullable().unique();
		table.string('challenge', 100).notNullable().unique();

		table.timestamp('created_at').defaultTo(knex.fn.now());
		table.index('created_at', 'idx_pendingregs_created_at');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('pendingRegs');
}
