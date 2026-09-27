import { ChatInputCommandInteraction, Message, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { personnelInfo, trainingInfo } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('conclude')
	.setDescription('Conclude a training.')
	.addStringOption(o => o
		.setName('training_id')
		.setDescription('The ID of a training to be concluded.')
		.setMinLength(36)
		.setMaxLength(36)
		.setRequired(true)
	)
	.addStringOption(o => o
		.setName('comment')
		.setDescription('Optional comment about this training.')
		.setMaxLength(1024)
	);

export const highRank = true;
export const training = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, __cmdUser: personnelInfo, training: trainingInfo, annsMessage: Message) {
	const comment = interaction.options.getString('comment');

	if (!training.isStarted) return await bot.sendContainer(interaction, 'error', {
		description: 'This training has not been started yet.',
		fields: [{ name: 'Training ID:', value: training.trainingId }]
	});

	await bot.knex<trainingInfo>('trainings')
		.del()
		.where('trainingId', training.trainingId);

	if (annsMessage) await bot.sendContainer(annsMessage, bot.createContainer({
		color: 'Grey',
		title: `${training.hostRobloxUsername}'s training has been concluded.`,
		description: 'The training is over. Thanks to those who have attended!',
		fields: comment ? [{ name: 'Comment from host:', value: comment }] : []
	}));

	await bot.sendContainer(interaction, 'success', 'Successfully concluded the training.');
}
