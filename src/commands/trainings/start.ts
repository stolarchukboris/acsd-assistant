import { ChatInputCommandInteraction, Message, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { personnelInfo, trainingInfo } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('start')
	.setDescription('Start a training.')
	.addStringOption(o => o
		.setName('training_id')
		.setDescription('The ID of the training to be started.')
		.setMinLength(36)
		.setMaxLength(36)
		.setRequired(true)
	)
	.addStringOption(o => o
		.setName('join')
		.setDescription('A way to join this training.')
	);

export const highRank = true;
export const training = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, __cmdUser: personnelInfo, training: trainingInfo, annsMessage: Message, role: string) {
	const join = interaction.options.getString('join');

	await bot.knex<trainingInfo>('trainings')
		.update('isStarted', true)
		.where('trainingId', training.trainingId);

	if (annsMessage) await bot.sendContainer(annsMessage, bot.createContainer({
		color: 'Green',
		title: `${training.hostRobloxUsername}'s scheduled training is starting now!`,
		description: `<@&${role}>\nThe training is commencing, attendees can join the training server.
Remember to follow the training rules and show your best!

**You have a few minutes to join the server before it gets locked.**
${join ? `## Join the training: ${join}` : ''}`,
		fields: [{ name: 'Training ID:', value: training.trainingId }]
	}));

	await bot.sendContainer(interaction, bot.containers.success({
		description: 'Successfully started the training.',
		fields: [{ name: 'Training ID:', value: training.trainingId }]
	}));
}
