import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('credittransactions', table => {
		table.specificType('transactionId', 'char(36)').primary();
		table.string('execRbxId', 20).notNullable();
		table.string('targetRbxId', 20).notNullable();
		table.smallint('balanceBefore').notNullable();
		table.smallint('balanceAfter').notNullable();
		table.text('reason').notNullable();
		table.datetime('createdAt').defaultTo(knex.fn.now());
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('credittransactions');
}
