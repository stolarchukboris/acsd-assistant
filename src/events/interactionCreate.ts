import { type Interaction, TextChannel } from 'discord.js';
import bot from '../index.ts';
import type { personnelInfo, trainingInfo } from '../types/knex.ts';
import type { botCommand } from '../types/discord.ts';

export async function execute(interaction: Interaction<'cached'>) {
	if (!(interaction.isChatInputCommand() || interaction.isAutocomplete())) return;

	let command: botCommand<any> | undefined = bot.commands.get(interaction.commandName);

	if (!command) return bot.logger.error(`No command matching ${interaction.commandName} was found.`);

	const subcommandOption = interaction.options.getSubcommand(false);

	if (subcommandOption) {
		command = bot.subcommands.get(`${interaction.commandName}:${subcommandOption}`);

		if (!command) return bot.logger.error(`No subcommand matching ${subcommandOption} was found.`);
	}

	if (interaction.isChatInputCommand()) {
		const args = [];
		const commandUser = await bot.knex<personnelInfo>('personnel')
			.select('*')
			.where('discordId', interaction.user.id)
			.first();

		if ((command.dev && interaction.user.id !== Bun.env.OWNER_ID)
			|| (command.highRank && !(commandUser && bot.highRanks.includes(commandUser.acsdRank))))
				return await bot.sendContainer(interaction, 'accessDenied', 'You are not authorized to run this command.');

		if (command.auth && !commandUser) return await bot.sendContainer(interaction, 'accessDenied', 'You are not registered in the ACSD database.');

		args.push(commandUser);

		if (command.training) {
			await interaction.deferReply();

			const channel = bot.channels.cache.get(bot.getSetting('trainingAnnsChannelId')!) as TextChannel;

			if (command.data.name !== 'schedule') {
				const id = interaction.options.getString('training_id', true);
				const training = await bot.knex<trainingInfo>('trainings')
					.select('*')
					.where('trainingId', id)
					.first();

				if (!training)
					return await bot.sendContainer(interaction, 'notFound', `No scheduled training with ID \`${id}\` has been found in the databsae.`)

				const message = await channel.messages.fetch(training.messageId);

				args.push(training, message);
			} else args.push(channel);

			args.push(bot.getSetting('trainingPingRoleId'));
		}

		try {
			await command.execute(interaction, ...args);
		} catch (error) {
			bot.logger.error(error);

			await bot.sendContainer(interaction, 'error', 'An error has occured while executing this command')
		}
	} else if (interaction.isAutocomplete()) {
		try {
			await command.autocomplete!(interaction);
		} catch (error) {
			bot.logger.error(error);
		}
	}
}
