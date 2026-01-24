import { join } from 'node:path';
import { EmbedBuilder, Client, Collection, GatewayIntentBits, REST, SlashCommandBuilder, SlashCommandSubcommandBuilder, Routes, type RESTPutAPIApplicationCommandsResult, Partials, type RESTPostAPIApplicationCommandsJSONBody, InteractionContextType, ApplicationIntegrationType, DefaultWebSocketManagerOptions } from 'discord.js';
import { execSync } from 'node:child_process';
import knex, { Knex } from 'knex';
import type { botCommand, botEvent } from './types/discord.ts';
import type { botSettingInfo } from './types/knex.ts';
import { Glob } from 'bun';
const __dirname = import.meta.dirname;

class Bot extends Client {
	name = 'ACSD Assistant';
	commands = new Collection<string, botCommand<SlashCommandBuilder>>();
	subcommands = new Collection<string, botCommand<SlashCommandSubcommandBuilder>>();
	apiCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];

	botSettings: botSettingInfo[] = [];

	logos = {
		checkmark: 'https://septik-komffort.ru/wp-content/uploads/2020/11/galochka_zel.png',
		warning: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Noto_Emoji_Oreo_2757.svg/1200px-Noto_Emoji_Oreo_2757.svg.png',
		heart: 'https://gas-kvas.com/grafic/uploads/posts/2024-01/gas-kvas-com-p-znak-serdtsa-na-prozrachnom-fone-44.png',
		questionmark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Orange_question_mark.svg/2048px-Orange_question_mark.svg.png',
		cross: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Not_allowed.svg/1200px-Not_allowed.svg.png',
		placeholder: 'https://static.wikia.nocookie.net/7d5db291-d700-4b6a-944b-eb0c84bf5781/scale-to-width/755',
		trashbin: 'https://cdn-icons-png.freepik.com/512/8367/8367793.png'
	} as const;

	highRanks = ['Administrator', 'Director of Defense', 'Deputy Director of Defense', 'Executive Director'];

	commit: string | null;

	knex!: Knex;

	get embed() {
		return new EmbedBuilder()
			.setTimestamp()
			.setFooter({ text: `${this.name}${this.commit ? ` • ${this.commit.substring(0, 7)}` : ''}` });
	}

	get embeds() {
		return {
			'accessDenied': this.embed
				.setColor('Red')
				.setTitle('Access denied.')
				.setThumbnail(this.logos.cross),
			'error': this.embed
				.setColor('Red')
				.setTitle('Error.')
				.setThumbnail(this.logos.warning),
			'warning': this.embed
				.setColor('Yellow')
				.setTitle('Warning.')
				.setThumbnail(this.logos.warning),
			'success': this.embed
				.setColor('Green')
				.setTitle('Success.')
				.setThumbnail(this.logos.checkmark),
			'cancel': this.embed
				.setTitle('Cancelled.')
				.setThumbnail(this.logos.trashbin),
			'notFound': this.embed
				.setColor('Grey')
				.setTitle('Not found.')
				.setThumbnail(this.logos.placeholder)
		} as const;
	}

	private readonly glob = new Glob('*');

	private async initCommands() {
		const cmdsFolderPath = join(__dirname, 'commands');

		for (const item of this.glob.scanSync({ cwd: cmdsFolderPath, onlyFiles: false })) { // for each item in commands folder
			if (item.endsWith('.ts')) { // if a child is a ts file
				const filePath = join(cmdsFolderPath, item);
				const command: botCommand<SlashCommandBuilder> = (await import(`file://${filePath}`));

				if ('data' in command && 'execute' in command) {
					command.data
						.setContexts(InteractionContextType.Guild)
						.setIntegrationTypes(ApplicationIntegrationType.GuildInstall);

					this.commands.set(command.data.name, command);

					if (!Bun.argv.includes('--deploy')) continue;

					this.apiCommands.push(command.data.toJSON());
				} else console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
			} else { // otherwise, if it's a folder
				const command: botCommand<SlashCommandBuilder> = {
					data: new SlashCommandBuilder()
						.setName(item)
						.setDescription(item)
						.setContexts(InteractionContextType.Guild)
						.setIntegrationTypes(ApplicationIntegrationType.GuildInstall),
					execute: () => Promise.resolve(undefined)
				} // make a command with folder name

				const path = join(cmdsFolderPath, item);

				for (const file of this.glob.scanSync({ cwd: path })) { // for each subcommand file
					const subcommand: botCommand<SlashCommandSubcommandBuilder> = (await import(`file://${join(path, file)}`));

					if ('data' in subcommand && 'execute' in subcommand) {
						command.data.addSubcommand(subcommand.data);

						this.subcommands.set(`${command.data.name}:${subcommand.data.name}`, subcommand);
					} else console.warn(`[WARNING] The subcommand at ${path} is missing a required "data" or "execute" property.`);
				}

				this.commands.set(command.data.name, command);

				if (!Bun.argv.includes('--deploy')) continue;

				this.apiCommands.push(command.data.toJSON());
			}
		}

		if (Bun.argv.includes('--deploy')) {
			const rest = new REST().setToken(Bun.env.TOKEN);

			try {
				console.log(`Started refreshing ${this.apiCommands.length} application (/) commands.`);

				const data = await rest.put(
					Routes.applicationCommands(Bun.env.CLIENT_ID),
					{ body: this.apiCommands }
				) as RESTPutAPIApplicationCommandsResult;

				console.log(`Successfully reloaded ${data.length} application (/) commands.`);
			} catch (error) {
				console.error(error);

				process.exit(1);
			}
		}

		console.log('Commands initialized successfully.');
	}

	private async initEvents() {
		const eventsPath = join(__dirname, 'events');

		for (const file of this.glob.scanSync({ cwd: eventsPath })) {
			const filePath = join(eventsPath, file);
			const event: botEvent = (await import(`file://${filePath}`));

			event.once
				? this.once(file.split('.')[0]!, (...args) => event.execute(...args))
				: this.on(file.split('.')[0]!, (...args) => event.execute(...args));
		}

		console.log('Events loaded successfully.');
	}

	private async initDb() {
		this.knex = knex({
			client: 'mysql2',
			connection: {
				host: '127.0.0.1',
				port: Bun.env.DB_PORT,
				user: Bun.env.DB_USER ?? 'nologin',
				password: Bun.env.DB_PASS ?? 'nologin',
				database: 'acsd'
			}
		});

		console.log(`Connected to database successfully${!Bun.env.DB_USER ? ' (dummy connection)' : ''}.`);

		if (Bun.argv.includes('--nologin')) {
			console.log('[CI] Workflow test passed. Shutting down.');
			process.exit(0);
		}

		const settings = await this.knex<botSettingInfo>('botSettings')
			.select('*');

		settings.forEach(setting => this.botSettings.push(setting));
	}

	constructor() {
		Object.defineProperty(DefaultWebSocketManagerOptions.identifyProperties, 'browser', { value: 'Discord iOS' });

		super({
			intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
			partials: [Partials.Message]
		});

		this.removeAllListeners();

		this.initCommands()
			.then(() => this.initEvents())
			.then(() => this.initDb());

		try {
			this.commit = execSync('git rev-parse HEAD', { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] })
				.toString()
				.trim();
		} catch (_) {
			this.commit = null;
		}

		if (Bun.argv.includes('--nologin')) return;

		this.login(Bun.env.TOKEN);
	}
}

export default new Bot();
