import { ChatInputCommandInteraction, Message, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { Personnel, Training } from '../../types/knex.ts';

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

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, _cmdUser: Personnel, training: Training, annsMessage: Message, role: string) {
	const join = interaction.options.getString('join');

	await bot.knex<Training>('trainings')
		.update('is_started', true)
		.where('training_id', training.training_id);

	if (annsMessage) await bot.sendContainer(annsMessage, bot.createContainerPayload({
		color: 'Green',
		allowedMentions: { parse: ['roles'] },
		sections: [{
			title: `${training.host_roblox_username}'s scheduled training is starting now!`,
			description: `<@&${role}>\nThe training is commencing, attendees can join the training server.
Remember to follow the training rules and show your best!

**You have a few minutes to join the server before it gets locked.**
${join ? `## Join the training: ${join}` : ''}`,
			fields: [{ name: 'Training ID:', value: training.training_id }]
		}]
	}));

	await bot.sendContainer(interaction, 'success', {
		sections: [{
			description: 'Successfully started the training.',
			fields: [{ name: 'Training ID:', value: training.training_id }]
		}]
	});
}
