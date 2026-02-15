import { ApplicationCommandRegistries, container, LogLevel, RegisterBehavior, SapphireClient } from "@sapphire/framework";
import { Collection, DefaultWebSocketManagerOptions, EmbedBuilder, Partials } from "discord.js";
import knex from "knex";
import type { botSettingInfo } from "./types/knex.ts";
import axios from "axios";

new class extends SapphireClient {
	public constructor() {
		Object.defineProperty(DefaultWebSocketManagerOptions.identifyProperties, 'browser', { value: 'Discord iOS' });

		super({
			intents: ['Guilds', 'GuildMessages', 'MessageContent'],
			partials: [Partials.Message],
			logger: {
				level: process.env.NODE_ENV === 'development' ? LogLevel.Debug : LogLevel.Info
			}
		});

		ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

		container.axios = axios;
		container.name = this.name;
		container.globalSettings = this.globalSettings;
		container.logos = this.logos;
		container.highRanks = this.highRanks;
		container.getGlobalSetting = this.getGlobalSetting;
		container.embed = this.embed;
		container.embeds = this.embeds;

		try {
			container.commit = Bun.spawnSync(['git', 'rev-parse', 'HEAD'], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] }).stdout
				.toString()
				.trim();
		} catch (_) { };

		this.start();
	}

	private readonly name = 'ACSD Assistant';

	private readonly globalSettings = new Collection<string, botSettingInfo>();

	private readonly logos = {
		checkmark: 'https://septik-komffort.ru/wp-content/uploads/2020/11/galochka_zel.png',
		warning: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Noto_Emoji_Oreo_2757.svg/1200px-Noto_Emoji_Oreo_2757.svg.png',
		heart: 'https://gas-kvas.com/grafic/uploads/posts/2024-01/gas-kvas-com-p-znak-serdtsa-na-prozrachnom-fone-44.png',
		questionmark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Orange_question_mark.svg/2048px-Orange_question_mark.svg.png',
		cross: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Not_allowed.svg/1200px-Not_allowed.svg.png',
		placeholder: 'https://static.wikia.nocookie.net/7d5db291-d700-4b6a-944b-eb0c84bf5781/scale-to-width/755',
		trashbin: 'https://cdn-icons-png.freepik.com/512/8367/8367793.png'
	};

	private readonly highRanks = ['Administrator', 'Director of Defense', 'Deputy Director of Defense', 'Executive Director'];

	private getGlobalSetting(name: string) {
		return container.globalSettings.get(name)?.settingValue;
	}

	private embed() {
		return new EmbedBuilder()
			.setTimestamp()
			.setFooter({ text: `${this.name}${container.commit ? ` • ${container.commit.substring(0, 7)}` : ''}` });
	}

	private embeds() {
		return {
			'accessDenied': this.embed()
				.setColor('Red')
				.setTitle('Access denied.')
				.setThumbnail(container.logos.cross),
			'error': this.embed()
				.setColor('Red')
				.setTitle('Error.')
				.setThumbnail(container.logos.warning),
			'warning': this.embed()
				.setColor('Yellow')
				.setTitle('Warning.')
				.setThumbnail(container.logos.warning),
			'success': this.embed()
				.setColor('Green')
				.setTitle('Success.')
				.setThumbnail(container.logos.checkmark),
			'cancel': this.embed()
				.setTitle('Cancelled.')
				.setThumbnail(container.logos.trashbin),
			'notFound': this.embed()
				.setColor('Grey')
				.setTitle('Not found.')
				.setThumbnail(container.logos.placeholder)
		};
	}

	private async initDb() {
		container.knex = knex({
			client: 'mysql2',
			connection: {
				host: '127.0.0.1',
				port: Bun.env.DB_PORT,
				user: Bun.env.DB_USER ?? 'nologin',
				password: Bun.env.DB_PASS ?? 'nologin',
				database: 'acsd'
			}
		});

		await container.knex.raw('select 1');

		console.log(`Connected to database successfully.`);

		const gSettings = await container.knex<botSettingInfo>('botSettings')
			.select('*');

		gSettings.forEach(setting => container.globalSettings.set(setting.settingName, setting));
	}

	private async start() {
		try {
			if (Bun.argv.includes('--nologin')) {
				console.log('[CI] Workflow test passed. Shutting down.');

				process.exit(0);
			}

			await this.initDb();
			await this.login(Bun.env.TOKEN);
		} catch (error) {
			console.error(`Bot startup failure: ${error}`);

			process.exit(1);
		}
	}
}
