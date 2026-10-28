import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('trainings', table => {
		table.uuid('trainingId').primary();
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
		table.bigInteger('startingTimestamp').notNullable().unique();
		table.boolean('isReminded').defaultTo(false);
		table.boolean('isStarted').defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('trainings');
}
