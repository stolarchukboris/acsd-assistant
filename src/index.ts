import { EmbedBuilder, Client, Collection, GatewayIntentBits, REST, SlashCommandBuilder, SlashCommandSubcommandBuilder, Routes, type RESTPutAPIApplicationCommandsResult, Partials, type RESTPostAPIApplicationCommandsJSONBody, InteractionContextType, ApplicationIntegrationType, DefaultWebSocketManagerOptions } from 'discord.js';
import { bundledCommands, bundledEvents } from './regManifest.ts';
import knex, { Knex } from 'knex';
import type { botCommand, botEvent } from './types/discord.ts';
import type { botSettingInfo } from './types/knex.ts';
import { configureServer, fetchApi } from 'rozod';
import { getUsersAuthenticated } from 'rozod/endpoints/usersv1';
import { join } from 'path';
import { getCloudV2UsersUserIdGenerateThumbnail } from 'rozod/opencloud/v2/cloud';

class Bot extends Client {
	name = 'ACSD Assistant';

	botSettings = new Collection<string, botSettingInfo>();
	commands = new Collection<string, botCommand<SlashCommandBuilder>>();
	subcommands = new Collection<string, botCommand<SlashCommandSubcommandBuilder>>();
	apiCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];

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

	getSetting(name: string) {
		return this.botSettings.get(name)?.settingValue;
	}

	async getRobloxPfp(robloxId: string) {
		try {
			const operation = await fetchApi(getCloudV2UsersUserIdGenerateThumbnail,
				{ user_id: robloxId, shape: 'SQUARE', format: 'PNG' },
				{ throwOnError: true }
			);

			const res = await fetch(`https://apis.roblox.com/cloud/v2/${operation.path}`, {
				method: 'GET',
				headers: {
					'Cookie': `.ROBLOSECURITY=${Bun.env.ROBLOX_COOKIE}`,
					'x-api-key': Bun.env.OPEN_CLOUD_API_KEY
				}
			});

			if (!res.ok) throw new Error;

			const result = await res.json() as any;

			return result.done && result.response ? result.response.imageUri : this.logos.placeholder;

		} catch (error) {
			console.error(error);

			return this.logos.placeholder;
		}
	}

	private async updateEnvCookie(newCookie: string, poolIndex: number) {
		try {
			const envPath = join(process.cwd(), '.env');
			const file = Bun.file(envPath);

			if (!(await file.exists())) throw new Error('.env file not found in the current working directory.');

			const content = await file.text();
			const lines = content.split('\n');

			let cookieUpdated = false;

			const updatedLines = lines.map(line => {
				const trimmed = line.trim();

				if (trimmed.startsWith('ROBLOX_COOKIE=')) {
					cookieUpdated = true;

					return `ROBLOX_COOKIE=${newCookie}`;
				}

				return line;
			});

			if (!cookieUpdated) updatedLines.push(`ROBLOX_COOKIE=${newCookie}`);

			await Bun.write(envPath, updatedLines.join('\n'));

			Bun.env.ROBLOX_COOKIE = newCookie;

			console.log(`Successfully updated the Roblox cookie for account ${poolIndex}.`);
		} catch (error) {
			console.error(`An error has occured while updating the Roblox cookie for account ${poolIndex}.\n${error}`);
		}
	}

	private async initCommands() {
		for (const item of bundledCommands) {
			const module = item.module as Partial<botCommand<SlashCommandBuilder | SlashCommandSubcommandBuilder>>;

			if (!(module.data && module.execute)) {
				console.warn(`Command at ${item.path} is missing a required \`data\` or \`execute\` property.`);

				continue;
			}

			const fileOrFolderName = item.path.split('/')[2] as string;

			let existingCommand = this.commands.get(fileOrFolderName);

			if (module.data instanceof SlashCommandSubcommandBuilder) {
				this.subcommands.set(`${fileOrFolderName}:${module.data.name}`, module as botCommand<SlashCommandSubcommandBuilder>);

				if (!existingCommand) existingCommand = {
					data: new SlashCommandBuilder()
						.setName(fileOrFolderName)
						.setDescription(fileOrFolderName)
						.setContexts(InteractionContextType.Guild)
						.setIntegrationTypes(ApplicationIntegrationType.GuildInstall),
					execute: () => Promise.resolve(undefined)
				};

				existingCommand.data.addSubcommand(module.data);
			} else if (module.data instanceof SlashCommandBuilder) existingCommand = {
				data: module.data
					.setContexts(InteractionContextType.Guild)
					.setIntegrationTypes(ApplicationIntegrationType.GuildInstall),
				execute: module.execute
			};

			this.commands.set(existingCommand!.data.name, existingCommand!);
		}

		if (Bun.argv.includes('--deploy')) {
			this.commands.forEach(command => this.apiCommands.push(command.data.toJSON()));

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
		for (const item of bundledEvents) {
			const event = item.module as Partial<botEvent>;

			if (!event.execute) {
				console.warn(`Event at ${item.path} is missing a required \`execute\` property.`);

				continue;
			}

			event.once
				? this.once(item.path.split('/').pop()!, (...args) => event.execute!(...args))
				: this.on(item.path.split('/').pop()!, (...args) => event.execute!(...args))
		}

		console.log('Events loaded successfully.');
	}

	private async initDb() {
		if (!(Bun.env.DB_HOST && Bun.env.DB_NAME && Bun.env.DB_PASS && Bun.env.DB_PORT && Bun.env.DB_USER))
			throw new Error('Database connection credentials missing in env.');

		this.knex = knex({
			client: 'mysql2',
			connection: {
				host: Bun.env.DB_HOST,
				port: Bun.env.DB_PORT,
				user: Bun.env.DB_USER,
				password: Bun.env.DB_PASS,
				database: Bun.env.DB_NAME
			},
			migrations: {
				extension: 'ts',
				directory: './database/migrations',
				loadExtensions: ['.ts']
			}
		});

		console.log('Starting database migrations...');

		const [batchNo, log]: [number, string[]] = await this.knex.migrate.latest();

		if (log.length === 0) console.log('Database is already up to date.');
		else {
			console.log(`${log.length} successful migrations (batch ${batchNo}).\nApplied files list:`);

			log.forEach(file => console.log(`	- ${file}`));
		}

		await this.knex.raw('select 1');

		console.log(`Connected to database successfully.`);

		const settings = await this.knex<botSettingInfo>('botSettings')
			.select('*');

		settings.forEach(setting => this.botSettings.set(setting.settingName, setting));
	}

	private async initRoblox() {
		if (!(Bun.env.ROBLOX_COOKIE && Bun.env.OPEN_CLOUD_API_KEY))
			throw new Error('Roblox connection credentials missing in env.');

		configureServer({
			cookies: Bun.env.ROBLOX_COOKIE,
			cloudKey: Bun.env.OPEN_CLOUD_API_KEY,
			onCookieRefresh: async ({ oldCookie, newCookie, poolIndex }) => await this.updateEnvCookie(newCookie, poolIndex)
		});

		const me = await fetchApi(getUsersAuthenticated, undefined, { throwOnError: true });

		console.log(`Logged into Roblox as ${me.name} (${me.id}).`);
	}

	private async start() {
		try {
			await this.initEvents();
			await this.initCommands();

			if (Bun.argv.includes('--nologin')) {
				console.log('[CI] Workflow test passed. Shutting down.');

				process.exit(0);
			}

			await this.initDb();
			await this.initRoblox();
			await this.login(Bun.env.TOKEN);
		} catch (error) {
			console.error(`Bot startup failure.\n${error}`);

			process.exit(1);
		}
	}

	constructor() {
		Object.defineProperty(DefaultWebSocketManagerOptions.identifyProperties, 'browser', { value: 'Discord iOS' });

		super({
			intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
			partials: [Partials.Message]
		});

		this.start();

		try {
			this.commit = Bun.spawnSync(['git', 'rev-parse', 'HEAD'], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] }).stdout
				.toString()
				.trim();
		} catch (_) {
			this.commit = null;
		}
	}
}

export default new Bot();
