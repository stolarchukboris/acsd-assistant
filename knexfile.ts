import type { Knex } from "knex";
import camelCase from "lodash.camelcase";
import snakeCase from "lodash.snakecase";

function convertKeysToCamel(obj: any): any {
	if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
		return obj;
	}
	if (Array.isArray(obj)) {
		return obj.map(convertKeysToCamel);
	}
	return Object.keys(obj).reduce((acc, key) => {
		acc[camelCase(key)] = convertKeysToCamel(obj[key]);
		return acc;
	}, {} as any);
}


const config: { [key: string]: Knex.Config } = {
	development: {
		client: "pg",
		connection: {
			host: Bun.env.DB_HOST,
			port: Bun.env.DB_PORT,
			user: Bun.env.DB_USER,
			password: Bun.env.DB_PASS,
			database: Bun.env.DB_NAME,
		},

		pool: {
			min: 2,
			max: 10,
		},

		migrations: {
			directory: "./database/migrations",
			extension: "ts",
			loadExtensions: ['.ts']
		},

		wrapIdentifier: (value, origImpl) => {
			if (value === "*") return origImpl(value);
			return origImpl(snakeCase(value));
		},

		postProcessResponse: result => {
			return convertKeysToCamel(result);
		}
	}
};

export default config;
