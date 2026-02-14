import type { Knex } from 'knex';
import type { botSettingInfo, personnelInfo } from './types/knex.ts';
import type { Collection, EmbedBuilder } from 'discord.js';

declare module '@sapphire/pieces' {
	interface Container {
		name: string;
		globalSettings: Collection<string, botSettingInfo>;
		highRanks: string[];
		logos: {
			checkmark: string;
			warning: string;
			heart: string;
			questionmark: string;
			cross: string;
			placeholder: string;
			trashbin: string;
		};
		commit?: string;
		knex: Knex;
		embed: () => EmbedBuilder;
		embeds: () => {
			'accessDenied': EmbedBuilder;
			'error': EmbedBuilder;
			'warning': EmbedBuilder;
			'success': EmbedBuilder;
			'cancel': EmbedBuilder;
			'notFound': EmbedBuilder;
		};
		getGlobalSetting: (name: string) => string | undefined;
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		highRank: never;
	}
}

declare module 'discord.js' {
	interface ChatInputCommandInteraction {
		cmdUser?: personnelInfo;
	}
}

declare module 'bun' {
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

export default undefined;
