declare module "bun" {
	interface Env {
		TOKEN: string;

		CLIENT_ID: string;
		GUILD_ID: string;
		OWNER_ID: string;

		BACKUP_SHIFT_LOGS_CH_ID: string;
		DEV_SHIFT_LOGS_CH_ID: string;
		DEV_WEBHOOK_ID: string;
		DEV_GUILD_ID: string;

		OPEN_CLOUD_API_KEY: string;
		ROBLOX_COOKIE: string;

		DB_PASS: string;
		DB_USER: string;
		DB_PORT: number;

	}
}
