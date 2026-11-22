import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('punishments', table => {
		table.uuid('punishment_id').primary();

		table.string('target_rbx_id', 20).notNullable();
		table.index('target_rbx_id', 'idx_punishments_target_rbx_id');

		table.string('exec_rbx_id', 20).notNullable();
		table.index('exec_rbx_id', 'idx_punishments_exec_rbx_id');

		table.enum('punishment_type', ['warn', 'strike']).notNullable();

		table.text('reason').notNullable();

		table.timestamp('created_at').defaultTo(knex.fn.now());
		table.index('created_at', 'idx_punishments_created_at');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('punishments');

	await knex.raw('DROP TYPE IF EXISTS punishment_type;');
}
