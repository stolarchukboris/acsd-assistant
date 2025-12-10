import { GuildMemberRoleManager, Interaction, PermissionsBitField, TextChannel } from 'discord.js';
import bot, { eventInfo, settingInfo } from '../index.js';

export async function execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName !== 'ping') await interaction.deferReply();

    const command = bot.commands.get(interaction.commandName);

    if (!command) return await bot.sendEmbed(interaction, {
        type: 'error',
        message: `No command matching ${interaction.commandName} was found.`
    });

    const subcommandOption = interaction.options.getSubcommand(false);

    let executor = command;

    if (subcommandOption) {
        const subcommand = bot.subcommands.get(subcommandOption);

        if (!subcommand) return await bot.sendEmbed(interaction, {
            type: 'error',
            message: `No command matching ${interaction.commandName} was found.`
        });

        executor = subcommand;
    }

    const perms = interaction.member?.permissions as Readonly<PermissionsBitField>;

    if ((command.dev && !(interaction.user.id === bot.env.OWNER_ID)) ||
        (command.admin && !perms.has('Administrator'))) return await bot.sendEmbed(interaction, { type: 'accessDenied' });

    const args = [];

    if (command.eo) {
        const permittedUsersSetting = await bot.knex<settingInfo>('eventUsersRolesSetting')
            .select('*')
            .where('guildId', interaction.guild?.id);
        const allowedIds = permittedUsersSetting.map(setting => setting.settingValue) as string[];
        const roles = interaction.member?.roles as GuildMemberRoleManager;

        if (!(allowedIds.includes(interaction.user.id) || roles.cache.hasAny(...allowedIds) || perms.has('Administrator')))
            return await bot.sendEmbed(interaction, { type: 'accessDenied' });

        const channelSetting = await bot.knex<settingInfo>('eventAnnsChannelSetting')
            .select('*')
            .where('guildId', interaction.guild?.id)
            .first();
        const roleSetting = await bot.knex<settingInfo>('eventPingRoleSetting')
            .select('*')
            .where('guildId', interaction.guild?.id)
            .first();

        if (!channelSetting || !roleSetting) return await bot.sendEmbed(interaction, {
            type: 'error',
            message: !channelSetting ? 'Event announcements channel not configured.' : 'Events ping role not configured.'
        });

        const channel = bot.channels.cache.get(channelSetting.settingValue as string) as TextChannel;
        if (!channel.isTextBased()) return await bot.sendEmbed(interaction, {
            type: 'error',
            message: 'The provided event announcements channel is not a text channel.'
        });

        if (command.data.name !== 'schedule') {
            const eventId = interaction.options.getString('event_id', true);
            const event = await bot.knex<eventInfo>('communityEvents')
                .select('*')
                .where('eventId', eventId)
                .andWhere('guildId', interaction.guild?.id)
                .first();

            if (!event) return await bot.sendEmbed(interaction, {
                type: 'warning',
                message: `Even with ID \`${eventId}\` has not been found in the database.`
            });

            const statuses = {
                'conclude': 1,
                'update': 2,
                'start': 2
            } as const;

            const status = statuses[command.data.name as keyof typeof statuses];

            if (event.eventStatus === status) return await bot.sendEmbed(interaction, {
                type: 'warning',
                message: status === 1 ? 'This event has not been started yet.' : 'This event has already been started.'
            });

            args.push(event);
        }

        args.push(channel, roleSetting.settingValue);
    }

    try {
        await executor.execute(interaction, ...args);
    } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
            await bot.sendEmbed(interaction, {
                type: 'error',
                ephemeral: true,
                followUp: true
            });
        } else {
            await bot.sendEmbed(interaction, {
                type: 'error',
                ephemeral: true
            });
        }
    }
}
