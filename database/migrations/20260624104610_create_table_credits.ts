import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('credits', table => {
		table.string('roblox_id', 20).primary();
		table.foreign('roblox_id')
			.references('roblox_id')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		table.smallint('amount').notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('credits');
}
