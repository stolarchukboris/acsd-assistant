import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
	development: {
		client: "pg",
		connection: {
			host: Bun.env.DB_HOST,
			port: parseInt(Bun.env.DB_PORT),
			user: Bun.env.DB_USER,
			password: Bun.env.DB_PASS,
			database: Bun.env.DB_NAME
		},

		pool: {
			min: 2,
			max: 10,
		},

		migrations: {
			directory: "./database/migrations",
			extension: "ts",
			loadExtensions: ['.ts']
		}
	}
};

export default config;
