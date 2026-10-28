import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('personnel', table => {
		table.string('robloxId', 20).primary();
		table.string('discordId', 20).notNullable().unique();
		table.string('robloxUsername', 22).notNullable().unique();
		table.string('acsdRank', 50).notNullable();

		table.timestamp('entryCreated').defaultTo(knex.fn.now());
		table.timestamp('entryUpdated').defaultTo(knex.fn.now());

		table.integer('toBeDeletedAt');
		table.index('toBeDeletedAt', 'idx_personnel_deletion');
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
