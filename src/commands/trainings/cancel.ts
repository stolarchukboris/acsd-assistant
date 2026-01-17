import { ChatInputCommandInteraction, Message, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { personnelInfo, trainingInfo } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('cancel')
	.setDescription('Cancel a training.')
	.addStringOption(o => o
		.setName('training_id')
		.setDescription('The ID of a training to be cancelled.')
		.setMinLength(36)
		.setMaxLength(36)
		.setRequired(true)
	)
	.addStringOption(o => o
		.setName('reason')
		.setDescription('The reason for this training to be cancelled.')
		.setMaxLength(1024)
		.setRequired(true)
	);

export const highRank = true;
export const training = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo, training: trainingInfo, annsMessage: Message, role: string) {
	const reason = interaction.options.getString('reason', true);

	await bot.knex<trainingInfo>('trainings')
		.del()
		.where('trainingId', training.trainingId);

	if (annsMessage) await annsMessage.reply({
		content: `<@&${role}>`,
		embeds: [
			bot.embed
				.setColor('Red')
				.setTitle(`${training.hostRobloxUsername}'s scheduled training has been cancelled.`)
				.setThumbnail(bot.logos.cross)
				.setDescription(`The training session is cancelled. Sorry for the inconvenience!`)
				.setFields({ name: 'Reason:', value: reason })
		]
	});

	await interaction.editReply({
		embeds: [
			bot.embeds.success.setDescription('Successfully cancelled the training.')
		]
	});
}
