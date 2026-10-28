import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('botSettings', table => {
		table.string('settingName', 30).primary();
		table.text('settingDesc').notNullable();
		table.string('settingValue', 20).notNullable().unique();

		table.timestamp('entryUpdated').defaultTo(knex.fn.now());
		table.string('lastUpdatedBy', 20).notNullable();
	});

	await knex.raw(`
		CREATE TRIGGER update_bot_settings_last_updated
		BEFORE UPDATE ON bot_settings
		FOR EACH ROW
		EXECUTE PROCEDURE update_entry_updated_column();
	`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw('DROP TRIGGER IF EXISTS update_bot_settings_last_updated ON bot_settings');

	await knex.schema.dropTableIfExists('botSettings');
}
