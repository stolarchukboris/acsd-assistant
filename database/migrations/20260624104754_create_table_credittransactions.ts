import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('credit_transactions', table => {
		table.uuid('transaction_id').primary();

		table.string('exec_rbx_id', 20).notNullable();
		table.index('exec_rbx_id', 'idx_credittransactions_exec_rbx_id');

		table.string('target_rbx_id', 20).notNullable();
		table.index('target_rbx_id', 'idx_credittransactions_target_rbx_id');

		table.smallint('balance_before').notNullable();
		table.smallint('balance_after').notNullable();

		table.text('reason').notNullable();

		table.timestamp('created_at').defaultTo(knex.fn.now());
		table.index('created_at', 'idx_credittransactions_created_at');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('creditTransactions');
}
