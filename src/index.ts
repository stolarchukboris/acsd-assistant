import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { RestOrArray, APIEmbedField, EmbedBuilder, Client, Collection, GatewayIntentBits, REST, SlashCommandBuilder, SlashCommandSubcommandBuilder, Routes, RESTPutAPIApplicationCommandsResult, ChatInputCommandInteraction, InteractionReplyOptions } from 'discord.js';
import { config } from 'dotenv';
import { execSync } from 'node:child_process';
import knex, { Knex } from 'knex';
const __dirname = import.meta.dirname;

export type premadeEmbedOptions = Readonly<{
    type: 'accessDenied' | 'error' | 'warning' | 'success' | 'notFound';
    followUp?: boolean;
    message?: string;
    fields?: RestOrArray<APIEmbedField>;
    image?: string;
    ephemeral?: boolean;
}>;

export type botCommand = Readonly<{
    data: SlashCommandBuilder | SlashCommandSubcommandBuilder;
    dev?: boolean;
    eo?: boolean;
    admin?: boolean;
    execute(interaction: ChatInputCommandInteraction, ...args: any[]): Promise<void>;
}>;

export type eventInfo = Readonly<{
    eventId: string;
    guildId: string;
    eventHost: string;
    annsMessageId: string;
    eventGameUrl: string;
    eventGameName: string;
    gameThumbnailUrl: string;
    eventStatus: number;
    eventTime: number;
    reminded: boolean;
}>;

export type settingInfo = Readonly<{
    guildId: string;
    settingValue: string | number | boolean;
}>;

export type starboardMessage = Readonly<{
    originMessage: string;
    starboardMessage: string;
    amountOfReactions: number;
}>;

class Bot extends Client {
    name = 'ACSD Assistant';
    commands: Collection<string, botCommand> = new Collection();
    subcommands: Collection<string, { data: SlashCommandSubcommandBuilder, execute(interaction: ChatInputCommandInteraction): Promise<void> }> = new Collection();
    apiCommands: SlashCommandBuilder[] = [];

    logos = {
        checkmark: 'https://septik-komffort.ru/wp-content/uploads/2020/11/galochka_zel.png',
        warning: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Noto_Emoji_Oreo_2757.svg/1200px-Noto_Emoji_Oreo_2757.svg.png',
        heart: 'https://gas-kvas.com/grafic/uploads/posts/2024-01/gas-kvas-com-p-znak-serdtsa-na-prozrachnom-fone-44.png'
    } as const;

    env = config({ quiet: true }).parsed || {};

    commit: string | null;

    knex!: Knex;

    private async initCommands() {
        const foldersPath = join(__dirname, 'commands');
        const items = readdirSync(foldersPath);

        for (const item of items) { // for each item in commands folder
            if (item.endsWith('.js')) { // if a child is a js file
                const filePath = join(foldersPath, item);
                const command = (await import(`file://${filePath}`));

                if ('data' in command && 'execute' in command) {
                    this.commands.set(command.data.name, command);

                    if (!process.argv.includes('--deploy')) continue;

                    this.apiCommands.push(command.data.toJSON());
                } else console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            } else { // otherwise, if it's a folder
                const command = new SlashCommandBuilder().setName(item).setDescription(item); // make a command with folder name
                const path = join(foldersPath, item);
                const files = readdirSync(path); // grab all subcommands from that folder

                for (const file of files) { // for each subcommand file
                    const subcommand = (await import(`file://${join(path, file)}`));

                    if ('data' in subcommand && 'execute' in subcommand) {
                        command.addSubcommand(subcommand.data);

                        this.subcommands.set(subcommand.data.name, subcommand);
                    } else console.warn(`[WARNING] The subcommand at ${path} is missing a required "data" or "execute" property.`);
                }

                this.commands.set(command.name, { data: command, execute: () => Promise.resolve(undefined) });

                if (!process.argv.includes('--deploy')) continue;

                this.apiCommands.push(command);
            }
        }

        if (process.argv.includes('--deploy')) {
            const rest = new REST().setToken(this.env.TOKEN);

            try {
                console.log(`Started refreshing ${this.apiCommands.length} application (/) commands.`);

                const data = await rest.put(
                    Routes.applicationCommands(this.env.CLIENT_ID),
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
        const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const filePath = join(eventsPath, file);
            const event = (await import(`file://${filePath}`));

            event.once ?
                this.once(file.split('.')[0], (...args) => event.execute(...args)) :
                this.on(file.split('.')[0], (...args) => event.execute(...args));
        }

        console.log('Events loaded successfully.');
    }

    private async initDb() {
        this.knex = knex({
            client: 'mysql2',
            connection: {
                host: '127.0.0.1',
                port: parseInt(this.env.DB_PORT, 10),
                user: this.env.DB_USER ?? 'nologin',
                password: this.env.DB_PASS ?? 'nologin',
                database: 'acsd'
            }
        });

        console.log(`Connected to database successfully${!this.env.DB_USER ? ' (dummy connection)' : ''}.`);

        if (process.argv.includes('--nologin')) {
            console.log('[CI] Workflow test passed. Shutting down.');
            process.exit(0);
        }
    }

    /**
     * Sends an embed of a selected type as an interaction response.
     * 
     * @param {ChatInputCommandInteraction} interaction An interaction to respond to.
     * @param {premadeEmbedOptions} options Embed {@link premadeEmbedOptions | options}.
     * 
     * @returns An embed interaction response.
     */
    async sendEmbed(interaction: ChatInputCommandInteraction, options: premadeEmbedOptions) {
        const embeds = {
            'accessDenied': this.embed
                .setColor('Red')
                .setTitle('Access denied.')
                .setDescription(options.message ?? 'You are not authorized to run this command.')
                .setThumbnail(this.logos.warning),
            'error': this.embed
                .setColor('Red')
                .setTitle('Error.')
                .setDescription(options.message ?? 'An error has occured while executing this command.')
                .setThumbnail(this.logos.warning),
            'warning': this.embed
                .setColor('Yellow')
                .setTitle('Warning.')
                .setDescription(options.message ?? 'The supplied data is invalid.')
                .setThumbnail(this.logos.warning),
            'success': this.embed
                .setColor('Green')
                .setTitle('Success.')
                .setDescription(options.message ?? 'Successfully executed the command.')
                .setThumbnail(this.logos.checkmark),
            'notFound': this.embed
                .setColor('Grey')
                .setTitle('Not found.')
                .setDescription(options.message ?? 'No elements have been found matching your request.')
        } as const;

        const embed = embeds[options.type];

        if (options.fields) embed.setFields(...options.fields);
        if (options.image) embed.setImage(options.image);

        const replyOptions: InteractionReplyOptions = { embeds: [embed] };

        if (options.ephemeral) replyOptions.flags = 'Ephemeral';

        if (!(interaction.deferred || interaction.replied)) return await interaction.reply(replyOptions);

        return options.followUp ? await interaction.followUp(replyOptions) : await interaction.editReply({ embeds: [embed] });
    }

    get embed(): EmbedBuilder {
        return new EmbedBuilder()
            .setTimestamp()
            .setFooter({ text: `${this.name}${this.commit ? ` • ${this.commit}` : ''}` });
    }

    constructor() {
        super({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

        this.initCommands()
            .then(_ => this.initEvents())
            .then(_ => this.initDb());

        try {
            this.commit = execSync('git rev-parse HEAD', { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] })
                .toString()
                .trim();
        } catch (_) {
            this.commit = null;
        }

        this.login(this.env.TOKEN);
    }
}

export default new Bot();
