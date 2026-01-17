import { type Interaction, ModalBuilder, TextChannel, TextInputStyle } from 'discord.js';
import bot from '../index.ts';
import type { partialPersonnelInfo, personnelInfo, trainingInfo } from '../types/knex.ts';
import type { botCommand } from '../types/discord.ts';

export async function execute(interaction: Interaction<'cached'>) {
	if (interaction.isButton() && !interaction.message.interactionMetadata && interaction.channelId === Bun.env.PENDING_REGS_CH_ID) {
		const buttonUser = await bot.knex<personnelInfo>('personnel')
			.select('*')
			.where('discordId', interaction.user.id)
			.first();

		if (!((interaction.member.permissions.has('Administrator')) || (buttonUser && bot.highRanks.includes(buttonUser.acsdRank)))) return await interaction.reply({
			embeds: [
				bot.embeds.accessDenied.setDescription('You are not authorized to press this button.')
			],
			flags: 'Ephemeral'
		});

		const regReq = await bot.knex<personnelInfo & { adminMessageId: string }>('pendingRegs')
			.select('*')
			.where('adminMessageId', interaction.message.id)
			.first();

		if (!regReq) return;

		if (interaction.customId === 'confirm') {
			await interaction.deferUpdate();

			await bot.knex<personnelInfo>('personnel')
				.insert({
					discordId: regReq.discordId,
					robloxId: regReq.robloxId,
					robloxUsername: regReq.robloxUsername,
					acsdRank: regReq.acsdRank,
					regApprovedBy: interaction.user.id
				});

			await bot.knex<partialPersonnelInfo>('personnelPartial')
				.del()
				.where('robloxId', regReq.robloxId);

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
					bot.embeds.success
						.setDescription(`Successfully registered <@${regReq.discordId}> in the ACSD database.`)
						.setFields(
							{ name: 'Rank:', value: regReq.acsdRank, inline: true },
							{ name: 'Linked Roblox:', value: `[${regReq.robloxUsername}](https://www.roblox.com/users/${regReq.robloxId}/profile)`, inline: true },
							{ name: 'Accepted by:', value: `${interaction.user}`, inline: true }
						)
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

		await bot.knex<personnelInfo & { adminMessageId: string }>('pendingRegs')
			.del()
			.where('adminMessageId', interaction.message.id);
	}

	if (!(interaction.isChatInputCommand() || interaction.isAutocomplete())) return;

	let command: botCommand<any> | undefined = bot.commands.get(interaction.commandName);

	if (!command) return console.error(`No command matching ${interaction.commandName} was found.`);

	const subcommandOption = interaction.options.getSubcommand(false);

	if (subcommandOption) {
		command = bot.subcommands.get(`${interaction.commandName}:${subcommandOption}`);

		if (!command) return console.error(`No subcommand matching ${subcommandOption} was found.`);
	}

	if (interaction.isChatInputCommand()) {
		const args = [];
		const commandUser = await bot.knex<personnelInfo>('personnel')
			.select('*')
			.where('discordId', interaction.user.id)
			.first();

		if ((command.dev && interaction.user.id !== Bun.env.OWNER_ID)
			|| (command.highRank && !(commandUser && bot.highRanks.includes(commandUser.acsdRank)))) return await interaction.reply({
				embeds: [
					bot.embeds.accessDenied.setDescription('You are not authorized to run this command.')
				]
			});

		if (command.auth && !commandUser) return await interaction.reply({
			embeds: [
				bot.embeds.accessDenied.setDescription('You are not registered in the ACSD database.')
			]
		});

		args.push(commandUser);

		if (command.training) {
			await interaction.deferReply();

			const channel = bot.channels.cache.get(Bun.env.TRAINING_CHANNEL_ID) as TextChannel;

			if (command.data.name !== 'schedule') {
				const id = interaction.options.getString('training_id', true);
				const training = await bot.knex<trainingInfo>('trainings')
					.select('*')
					.where('trainingId', id)
					.first();

				if (!training) return await interaction.editReply({
					embeds: [
						bot.embeds.notFound.setDescription(`No scheduled training with ID \`${id}\` has been found in the databsae.`)
					]
				});

				const message = await channel.messages.fetch(training.messageId);

				args.push(training, message);
			} else args.push(channel);

			args.push(Bun.env.TRAINING_PING_ROLE_ID);
		}

		try {
			await command.execute(interaction, ...args);
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
			await command.autocomplete!(interaction);
		} catch (error) {
			console.error(error);
		}
	}
}
