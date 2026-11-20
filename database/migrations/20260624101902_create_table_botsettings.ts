import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('bot_settings', table => {
		table.string('setting_name', 30).primary();
		table.text('setting_desc').notNullable();
		table.string('setting_value', 20).notNullable().unique();

		table.timestamp('entry_updated').defaultTo(knex.fn.now());
		table.string('last_updated_by', 20).notNullable();
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

	await knex.schema.dropTableIfExists('bot_settings');
}
