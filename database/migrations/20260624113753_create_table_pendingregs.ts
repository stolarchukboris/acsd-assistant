import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('pendingRegs', table => {
		table.string('robloxId', 20).primary();
		table.string('discordId', 20).notNullable().unique();
		table.string('robloxUsername', 22).notNullable().unique();
		table.string('challenge', 100).notNullable().unique();
		table.integer('entryCreated').unsigned().notNullable();
		table.index('entryCreated', 'idx_entry_created');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('pendingregs');
}
