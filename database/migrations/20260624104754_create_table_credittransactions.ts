import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('creditTransactions', table => {
		table.uuid('transactionId').primary();

		table.string('execRbxId', 20).notNullable();
		table.index('execRbxId', 'idx_credittransactions_exec_rbx_id');

		table.string('targetRbxId', 20).notNullable();
		table.index('targetRbxId', 'idx_credittransactions_target_rbx_id');

		table.smallint('balanceBefore').notNullable();
		table.smallint('balanceAfter').notNullable();

		table.text('reason').notNullable();

		table.timestamp('createdAt').defaultTo(knex.fn.now());
		table.index('createdAt', 'idx_credittransactions_created_at');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('creditTransactions');
}
