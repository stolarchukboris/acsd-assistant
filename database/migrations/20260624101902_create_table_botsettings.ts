import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('botsettings', table => {
		table.string('settingName', 30).primary();
		table.text('settingDesc').notNullable();
		table.string('settingValue', 20).notNullable().unique();
		table.datetime('lastUpdatedAt').defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'));
		table.string('lastUpdatedBy', 20).notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists('botsettings');
}
