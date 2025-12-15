import { GuildMemberRoleManager, Interaction, ModalBuilder, PermissionsBitField, TextChannel, TextInputStyle } from 'discord.js';
import bot from '../index.js';
import { eventInfo, personnelPartial, settingInfo } from 'types/knex.js';
import { botCommand } from 'types/discord.js';

export async function execute(interaction: Interaction) {
    if (interaction.isButton() && !interaction.message.interactionMetadata && interaction.channelId === bot.env.PENDING_REGS_CH_ID) {
        const regReq = await bot.knex<personnelPartial & { adminMessageId: string }>('pendingRegs')
            .select('*')
            .where('adminMessageId', interaction.message.id)
            .first();

        if (!regReq) return;

        if (interaction.customId === 'confirm') {
            await interaction.deferUpdate();
            
            await bot.knex<personnelPartial>('personnel')
                .insert({
                    discordId: regReq.discordId,
                    robloxId: regReq.robloxId,
                    robloxUsername: regReq.robloxUsername,
                    acsdRank: regReq.acsdRank
                });

            await bot.users.send(regReq.discordId, {
                embeds: [
                    bot.embed
                        .setColor('Green')
                        .setThumbnail(bot.logos.checkmark)
                        .setTitle('Registration request approved.')
                        .setDescription(`Your «APOLLO» Corporation Security Division registration request has been **approved**.

You can now easily access your ACSD **statistics** and **disciplinary records** with the \`/personnel stats\` command: simply omit both search options.

Additionally, you will receive notifications about your disciplinary records and events you are participating in (WIP).
You can control which notifications should be delivered to you: check out the \`/settings alter\` command (WIP).`)
                ]
            }).catch(async _ => await interaction.followUp({
                embeds: [
                    bot.embeds.warning.setDescription(`Could not DM <@${regReq.discordId}> about the registration. Please inform them manually.`)
                ]
            }));

            await interaction.editReply({
                embeds: [
                    bot.embeds.success.setDescription(`Successfully registered <@${regReq.discordId}> in the ACSD database.`)
                ],
                components: []
            });
        } else {
            const reasonModal = new ModalBuilder()
                .setCustomId(`reasonModal${interaction.id}`)
                .setTitle('Registration request denial.')
                .addLabelComponents(l => l
                    .setLabel('Reason.')
                    .setTextInputComponent(t => t
                        .setCustomId('reasonInput')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Elaborate on the request denial reason...')
                    )
                );

            await interaction.showModal(reasonModal);

            const modalSubmit = await interaction.awaitModalSubmit({ time: 3_600_000, filter: i => i.user.id === interaction.user.id && i.customId === `reasonModal${interaction.id}` }).catch(_ => { });

            if (!modalSubmit) return;

            await modalSubmit.deferUpdate();

            const reason = modalSubmit.fields.getTextInputValue('reasonInput');

            await bot.users.send(regReq.discordId, {
                embeds: [
                    bot.embed
                        .setColor('Red')
                        .setThumbnail(bot.logos.cross)
                        .setTitle('Registration request denied.')
                        .setDescription(`Your «APOLLO» Corporation Security Division registration request has been **denied**.

Please review the denial reason below. If you have any questions, please contact the ACSD administration.`)
                        .setFields({ name: 'Reason:', value: reason })
                ]
            }).catch(async _ => await modalSubmit.followUp({
                embeds: [
                    bot.embeds.warning.setDescription(`Could not DM <@${regReq.discordId}> about the registration. Please inform them manually.`)
                ]
            }));

            await modalSubmit.editReply({
                embeds: [
                    bot.embeds.success
                        .setDescription(`Successfully denied <@${regReq.discordId}>'s registration request.`)
                        .setFields({ name: 'Reason:', value: reason })
                ],
                components: []
            });
        }

        await bot.knex<personnelPartial & { adminMessageId: string }>('pendingRegs')
            .del()
            .where('adminMessageId', interaction.message.id);
    }

    if (!(interaction.isChatInputCommand() || interaction.isAutocomplete())) return;

    const command = bot.commands.get(interaction.commandName);

    if (!command) return console.error(`No command matching ${interaction.commandName} was found.`);

    const subcommandOption = interaction.options.getSubcommand(false);

    let executor: botCommand<any> = command;

    if (subcommandOption) {
        const subcommand = bot.subcommands.get(subcommandOption);

        if (!subcommand) return console.error(`No subcommand matching ${interaction.commandName} was found.`);

        executor = subcommand;
    }

    if (interaction.isChatInputCommand()) {
        const perms = interaction.member?.permissions as Readonly<PermissionsBitField>;

        if ((command.dev && !(interaction.user.id === bot.env.OWNER_ID))
            || (command.admin && !perms.has('Administrator'))) return await interaction.reply({
                embeds: [
                    bot.embeds.accessDenied.setDescription('You are not authorized to run this command.')
                ]
            });

        const args = [];

        if (command.eo) {
            const permittedUsersSetting = await bot.knex<settingInfo>('eventUsersRolesSetting')
                .select('*')
                .where('guildId', interaction.guild?.id);
            const allowedIds = permittedUsersSetting.map(setting => setting.settingValue) as string[];
            const roles = interaction.member?.roles as GuildMemberRoleManager;

            if (!(allowedIds.includes(interaction.user.id) || roles.cache.hasAny(...allowedIds) || perms.has('Administrator')))
                return await interaction.reply({
                    embeds: [
                        bot.embeds.accessDenied.setDescription('You are not authorized to run this command.')
                    ]
                });

            const channelSetting = await bot.knex<settingInfo>('eventAnnsChannelSetting')
                .select('*')
                .where('guildId', interaction.guild?.id)
                .first();
            const roleSetting = await bot.knex<settingInfo>('eventPingRoleSetting')
                .select('*')
                .where('guildId', interaction.guild?.id)
                .first();

            if (!channelSetting || !roleSetting) return await interaction.editReply({
                embeds: [
                    bot.embeds.error.setDescription(!channelSetting ? 'Event announcements channel not configured.' : 'Events ping role not configured.')
                ]
            });

            const channel = bot.channels.cache.get(channelSetting.settingValue as string) as TextChannel;
            if (!channel.isTextBased()) return await interaction.editReply({
                embeds: [
                    bot.embeds.error.setDescription('The provided event announcements channel is not a text channel.')
                ]
            });

            if (command.data.name !== 'schedule') {
                const eventId = interaction.options.getString('event_id', true);
                const event = await bot.knex<eventInfo>('communityEvents')
                    .select('*')
                    .where('eventId', eventId)
                    .andWhere('guildId', interaction.guild?.id)
                    .first();

                if (!event) return await interaction.editReply({
                    embeds: [
                        bot.embeds.error.setDescription(`Even with ID \`${eventId}\` has not been found in the database.`)
                    ]
                });

                const statuses = {
                    'conclude': 1,
                    'update': 2,
                    'start': 2
                } as const;

                const status = statuses[command.data.name as keyof typeof statuses];

                if (event.eventStatus === status) return await interaction.editReply({
                    embeds: [
                        bot.embeds.error.setDescription(status === 1 ? 'This event has not been started yet.' : 'This event has already been started.')
                    ]
                });

                args.push(event);
            }

            args.push(channel, roleSetting.settingValue);
        }

        try {
            await executor.execute(interaction, ...args);
        } catch (error) {
            console.error(error);

            interaction.replied || interaction.deferred
                ? await interaction.followUp({
                    embeds: [
                        bot.embeds.error.setDescription('An error has occured while executing this command.')
                    ]
                })
                : await interaction.reply({
                    embeds: [
                        bot.embeds.error.setDescription('An error has occured while executing this command.')
                    ]
                });
        }
    } else if (interaction.isAutocomplete()) {
        try {
            await executor.autocomplete!(interaction);
        } catch (error) {
            console.error(error);
        }
    }
}
