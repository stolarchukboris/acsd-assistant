import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('trainings', table => {
		table.specificType('trainingId', 'char(36)').primary();
		table.string('hostDiscordId', 20).notNullable();
		table.string('hostRobloxUsername', 20).notNullable();
		table.string('messageId', 20).defaultTo(null).unique();
		table.integer('startingTimestamp').unsigned().notNullable().unique();
		table.boolean('isReminded').defaultTo(false);
		table.boolean('isStarted').defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('trainings');
}
