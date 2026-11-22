import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('personnel', table => {
		table.string('roblox_id', 20).primary();
		table.string('discord_id', 20).notNullable().unique();
		table.string('roblox_username', 22).notNullable().unique();
		table.string('acsd_rank', 50).notNullable();

		table.timestamps(true, true);
		table.timestamp('to_be_deleted_at');

		table.index('to_be_deleted_at', 'idx_personnel_to_be_deleted_at');
	});

	await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

	await knex.raw(`
    CREATE TRIGGER update_personnel_updated_at
    BEFORE UPDATE ON personnel
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw('DROP TRIGGER IF EXISTS update_personnel_updated_at ON personnel');

	await knex.schema.dropTableIfExists('personnel');
}
