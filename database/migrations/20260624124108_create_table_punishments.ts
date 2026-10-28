import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('punishments', table => {
		table.uuid('punishmentId').primary();
		table.string('targetRbxId', 20).notNullable();
		table.index('targetRbxId', 'idx_punishments_target_rbx_id');
		table.string('execRbxId', 20).notNullable();
		table.index('execRbxId', 'idx_punishments_exec_rbx_id');
		table.enum('punishmentType', ['warn', 'strike']).notNullable();
		table.text('reason').notNullable();
		table.timestamp('createdAt').defaultTo(knex.fn.now());
		table.index('createdAt', 'idx_punishments_created_at');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('punishments');

	await knex.raw('DROP TYPE IF EXISTS punishment_type;');
}
