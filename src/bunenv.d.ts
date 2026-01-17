declare module "bun" {
	interface Env {
		TOKEN: string;

		CLIENT_ID: string;
		GUILD_ID: string;
		OWNER_ID: string;
		WEBHOOK_ID: string;

		ON_DUTY_VC_CHANNEL_CAT_ID: string;
		GAME_CHATS_CHANNEL_ID: string;

		TRAINING_CHANNEL_ID: string;
		TRAINING_REMINDER_CHANNEL_ID: string;
		TRAINING_PING_ROLE_ID: string;

		PENDING_REGS_CH_ID: string;

		SHIFT_LOGS_CH_ID: string;

		BACKUP_SHIFT_LOGS_CH_ID: string;
		DEV_SHIFT_LOGS_CH_ID: string;
		DEV_WEBHOOK_ID: string;
		DEV_GUILD_ID: string;

		OPEN_CLOUD_API_KEY: string;
		ROBLOX_COOKIE: string;
		PLACE_ID: number;

		DB_PASS: string;
		DB_USER: string;
		DB_PORT: number;

	}
}
