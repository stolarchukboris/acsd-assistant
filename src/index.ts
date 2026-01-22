import { container, ApplicationCommandRegistries, RegisterBehavior, SapphireClient } from "@sapphire/framework";
import { EmbedBuilder, Partials } from "discord.js";
import { execSync } from 'child_process';
import knex from "knex";

export default class Bot extends SapphireClient {
	public constructor() {
		super({
			intents: ['Guilds', 'GuildMessages', 'MessageContent'],
			partials: [Partials.Message]
		});

		this.logger.info('Client initialized successfully.');

		ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite);

		// binding everything to container so we dont have to import bot in cmd scripts
		Object.defineProperties(container, {
			commit: { value: this.commit, enumerable: true },
			name: { value: this.name, enumerable: true },
			highRanks: { value: this.highRanks, enumerable: true },
			logos: { value: this.logos, enumerable: true },
			knex: { value: this.knex, enumerable: true },
			embed: { get: () => this.embed, enumerable: true },
			embeds: { get: () => this.embeds, enumerable: true }
		});

		this.logger.info('Client container augmented successfully.');

		if (Bun.argv.includes('--nologin')) {
			this.logger.info('[CI] Workflow test passed. Shutting down.');
			return;
		}

		this.login(Bun.env.TOKEN);
	}

	private get commit() {
		try {
			return execSync('git rev-parse HEAD', { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] })
				.toString()
				.trim();
		} catch (_) {
			return undefined;
		}
	}

	private readonly name = 'ACSD Assistant';
	private readonly highRanks = ['Administrator', 'Director of Defense', 'Deputy Director of Defense', 'Executive Director'];
	private readonly logos = {
		checkmark: 'https://septik-komffort.ru/wp-content/uploads/2020/11/galochka_zel.png',
		warning: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Noto_Emoji_Oreo_2757.svg/1200px-Noto_Emoji_Oreo_2757.svg.png',
		heart: 'https://gas-kvas.com/grafic/uploads/posts/2024-01/gas-kvas-com-p-znak-serdtsa-na-prozrachnom-fone-44.png',
		questionmark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Orange_question_mark.svg/2048px-Orange_question_mark.svg.png',
		cross: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Not_allowed.svg/1200px-Not_allowed.svg.png',
		placeholder: 'https://static.wikia.nocookie.net/7d5db291-d700-4b6a-944b-eb0c84bf5781/scale-to-width/755',
		trashbin: 'https://cdn-icons-png.freepik.com/512/8367/8367793.png'
	} as const;

	private readonly knex = knex({
		client: 'mysql2',
		connection: {
			host: '127.0.0.1',
			port: Bun.env.DB_PORT,
			user: Bun.env.DB_USER ?? 'nologin',
			password: Bun.env.DB_PASS ?? 'nologin',
			database: 'acsd'
		}
	});

	private get embed() {
		return new EmbedBuilder()
			.setTimestamp()
			.setFooter({ text: `${container.name}${container.commit ? ` • ${container.commit.substring(0, 7)}` : ''}` });
	}

	private get embeds() {
		return {
			'accessDenied': container.embed
				.setColor('Red')
				.setTitle('Access denied.')
				.setThumbnail(container.logos.cross),
			'error': container.embed
				.setColor('Red')
				.setTitle('Error.')
				.setThumbnail(container.logos.warning),
			'warning': container.embed
				.setColor('Yellow')
				.setTitle('Warning.')
				.setThumbnail(container.logos.warning),
			'success': container.embed
				.setColor('Green')
				.setTitle('Success.')
				.setThumbnail(container.logos.checkmark),
			'cancel': container.embed
				.setTitle('Cancelled.')
				.setThumbnail(container.logos.trashbin),
			'notFound': container.embed
				.setColor('Grey')
				.setTitle('Not found.')
				.setThumbnail(container.logos.placeholder)
		} as const;
	}
}

new Bot();
