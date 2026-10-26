import { EmbedBuilder, Client, Collection, GatewayIntentBits, REST, SlashCommandBuilder, SlashCommandSubcommandBuilder, Routes, type RESTPutAPIApplicationCommandsResult, Partials, type RESTPostAPIApplicationCommandsJSONBody, InteractionContextType, ApplicationIntegrationType, DefaultWebSocketManagerOptions, MessageFlags, CommandInteraction, Message, InteractionCallbackResponse, BaseGuildTextChannel, InteractionResponse, type APIContainerComponent, type Interaction } from 'discord.js';
import { bundledCommands, bundledEvents } from './regManifest.ts';
import knex, { Knex } from 'knex';
import type { botCommand, botEvent } from './types/discord.ts';
import type { botSettingInfo } from './types/knex.ts';
import { configureServer, fetchApi } from 'rozod';
import { getUsersAuthenticated } from 'rozod/endpoints/usersv1';
import { join } from 'path';
import { getCloudV2UsersUserIdGenerateThumbnail } from 'rozod/opencloud/v2/cloud';
import logger from './utils/logger.ts';
import { createTemplateContainers, createContainerPayload, type ContainerOptions, type ContainerPayload } from './utils/containers.ts';

class Bot extends Client {
	public name = 'ACSD Assistant';

	public botSettings = new Collection<string, botSettingInfo>();
	public commands = new Collection<string, botCommand<SlashCommandBuilder>>();
	public subcommands = new Collection<string, botCommand<SlashCommandSubcommandBuilder>>();
	public apiCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];

	public logos = {
		checkmark: 'static/checkmark.png',
		warning: 'static/exclamation-mark.webp',
		heart: 'static/heart.png',
		questionmark: 'static/question-mark.png',
		cross: 'static/cross.png',
		placeholder: 'static/placeholder.png',
		trashbin: 'static/trashbin.png'
	} as const;

	public highRanks = ['Administrator', 'Director of Defense', 'Deputy Director of Defense', 'Executive Director'];

	public commit: string | null;

	public knex!: Knex;

	public logger = logger;

	public containers: ReturnType<typeof createTemplateContainers> = createTemplateContainers(this);

	public createContainerPayload = (options: ContainerOptions) => createContainerPayload(this, options);

	public async sendContainer(
		target: CommandInteraction<'cached'>,
		type: keyof ReturnType<typeof createTemplateContainers> | ContainerPayload,
		options?: string | (Partial<ContainerOptions> & { withResponse?: boolean })
	): Promise<Message<true> | InteractionResponse<true>>

	public async sendContainer(
		target: Message,
		type: keyof ReturnType<typeof createTemplateContainers> | ContainerPayload,
		options?: string | Partial<ContainerOptions>
	): Promise<Message<true>>

	public async sendContainer(
		target: BaseGuildTextChannel,
		type: keyof ReturnType<typeof createTemplateContainers> | ContainerPayload,
		options?: string | Partial<ContainerOptions>
	): Promise<Message<true>>

	public async sendContainer(
		target: CommandInteraction<'cached'> | Message | BaseGuildTextChannel,
		type: keyof ReturnType<typeof createTemplateContainers> | ContainerPayload,
		options?: string | Partial<ContainerOptions> | (Partial<ContainerOptions> & { withResponse?: boolean })
	): Promise<Message<true> | InteractionResponse<true>> {
		const parsedOptions = typeof options === 'string' ? { description: options } : options;
		const containerData = typeof type === 'string' ? this.containers[type](parsedOptions) : type;
		const payload = {
			flags: MessageFlags.IsComponentsV2 as number,
			components: [containerData.container],
			files: containerData.files
		}

		if (target instanceof CommandInteraction) {
			const hasWithResponse = typeof options !== 'string'
				&& (options as (Partial<ContainerOptions> & { withResponse?: boolean }) | undefined)?.withResponse === true;

			if (target.replied || target.deferred) return await target.editReply(payload);
			else {
				const res = await target.reply({
					...payload,
					withResponse: hasWithResponse
				});

				if (hasWithResponse) return (res as unknown as InteractionCallbackResponse<true>).resource?.message as Message<true>;

				return res;
			}
		} else return target instanceof Message ? await target.reply(payload) as any : await target.send(payload);
	}

	get embed() {
		return new EmbedBuilder()
			.setTimestamp()
			.setFooter({ text: `${this.name}${this.commit ? ` • ${this.commit.substring(0, 7)}` : ''}` });
	}

	get embeds() {
		const bot = this;

		return {
			get accessDenied() {
				return bot.embed.setColor('Red').setTitle('Access denied.').setThumbnail(bot.logos.cross);
			},
			get error() {
				return bot.embed.setColor('Red').setTitle('Error.').setThumbnail(bot.logos.warning);
			},
			get warning() {
				return bot.embed.setColor('Yellow').setTitle('Warning.').setThumbnail(bot.logos.warning);
			},
			get success() {
				return bot.embed.setColor('Green').setTitle('Success.').setThumbnail(bot.logos.checkmark);
			},
			get cancel() {
				return bot.embed.setTitle('Cancelled.').setThumbnail(bot.logos.trashbin);
			},
			get notFound() {
				return bot.embed.setColor('Grey').setTitle('Not found.').setThumbnail(bot.logos.placeholder);
			}
		} as const;
	}

	public getSetting(name: string) {
		return this.botSettings.get(name)?.settingValue;
	}

	public async getRobloxPfp(robloxId: string) {
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
			this.logger.error(error);

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

			this.logger.log(`Successfully updated the Roblox cookie for account ${poolIndex}.`);
		} catch (error) {
			this.logger.error(`An error has occured while updating the Roblox cookie for account ${poolIndex}.\n${error}`);
		}
	}

	private async initCommands() {
		for (const item of bundledCommands) {
			const module = item.module as Partial<botCommand<SlashCommandBuilder | SlashCommandSubcommandBuilder>>;

			if (!(module.data && module.execute)) {
				this.logger.warn(`Command at ${item.path} is missing a required \`data\` or \`execute\` property.`);

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
				this.logger.log(`Started refreshing ${this.apiCommands.length} application (/) commands.`);

				const data = await rest.put(
					Routes.applicationCommands(Bun.env.CLIENT_ID),
					{ body: this.apiCommands }
				) as RESTPutAPIApplicationCommandsResult;

				this.logger.log(`Successfully reloaded ${data.length} application (/) commands.`);
			} catch (error) {
				this.logger.error(error);

				process.exit(1);
			}
		}

		this.logger.log('Commands initialized successfully.');
	}

	private async initEvents() {
		for (const item of bundledEvents) {
			const event = item.module as Partial<botEvent>;

			if (!event.execute) {
				this.logger.warn(`Event at ${item.path} is missing a required \`execute\` property.`);

				continue;
			}

			event.once
				? this.once(item.path.split('/').pop()!, (...args) => event.execute!(...args))
				: this.on(item.path.split('/').pop()!, (...args) => event.execute!(...args))
		}

		this.logger.log('Events loaded successfully.');
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

		this.logger.log('Starting database migrations...');

		const [batchNo, log]: [number, string[]] = await this.knex.migrate.latest();

		if (log.length === 0) this.logger.log('Database is already up to date.');
		else {
			this.logger.log(`${log.length} successful migrations (batch ${batchNo}).\nApplied files list:`);

			log.forEach(file => this.logger.log(`	- ${file}`));
		}

		await this.knex.raw('select 1');

		this.logger.log(`Connected to database successfully.`);

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

		this.logger.log(`Logged into Roblox as ${me.name} (${me.id}).`);
	}

	private async start() {
		try {
			await this.initEvents();
			await this.initCommands();

			if (Bun.argv.includes('--nologin')) {
				this.logger.log('[CI] Workflow test passed. Shutting down.');

				process.exit(0);
			}

			await this.initDb();
			await this.initRoblox();
			await this.login(Bun.env.TOKEN);
		} catch (error) {
			this.logger.error(`Bot startup failure.\n${error}`);

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
			this.commit = `${Bun.spawnSync(['git', 'rev-parse', 'HEAD'], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] }).stdout
				.toString()
				.trim()
				.substring(0, 7)}`;
		} catch (_) {
			this.commit = null;
		}
	}
}

export default new Bot();
