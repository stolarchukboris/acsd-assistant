import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('trainings', table => {
		table.specificType('trainingId', 'char(36)').primary();
		table.string('hostDiscordId', 20).notNullable();
		table.foreign('hostDiscordId')
			.references('discordId')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		table.string('hostRobloxId', 20).notNullable();
		table.foreign('hostRobloxId')
			.references('robloxId')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		table.string('hostRobloxUsername', 22).notNullable();
		table.foreign('hostRobloxUsername')
			.references('robloxUsername')
			.inTable('personnel')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		table.string('messageId', 20).defaultTo(null).unique();
		table.integer('startingTimestamp').unsigned().notNullable().unique();
		table.boolean('isReminded').defaultTo(false);
		table.boolean('isStarted').defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('trainings');
}
