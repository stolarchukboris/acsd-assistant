import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('personnel', table => {
		table.string('roblox_id', 20).primary();
		table.string('discord_id', 20).notNullable().unique();
		table.string('roblox_username', 22).notNullable().unique();
		table.string('acsd_rank', 50).notNullable();

		table.timestamp('entry_created').defaultTo(knex.fn.now());
		table.timestamp('entry_updated').defaultTo(knex.fn.now());

		table.integer('to_be_deleted_at');
		table.index('to_be_deleted_at', 'idx_personnel_deletion');
	});

	await knex.raw(`
    CREATE OR REPLACE FUNCTION update_entry_updated_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.entry_updated = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

	await knex.raw(`
    CREATE TRIGGER update_personnel_entry_updated
    BEFORE UPDATE ON personnel
    FOR EACH ROW
    EXECUTE PROCEDURE update_entry_updated_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw('DROP TRIGGER IF EXISTS update_personnel_entry_updated ON personnel');

	await knex.schema.dropTableIfExists('personnel');
}
