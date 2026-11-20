import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { Personnel, Punishment } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('remove')
	.setDescription('Remove a punishment from an ACSD member.')
	.addStringOption(o => o
		.setName('punishment_id')
		.setDescription('The ID of a punishment.')
		.setMinLength(36)
		.setMaxLength(36)
		.setRequired(true)
	)
	.addStringOption(o => o
		.setName('reason')
		.setDescription('The reason for this punishment to be removed.')
		.setMaxLength(1024)
	);

export const highRank = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const id = interaction.options.getString('punishment_id', true);
	const reason = interaction.options.getString('reason');
	const existingPunishment = await bot.knex<Punishment>('punishments')
		.select('*')
		.where('punishment_id', id)
		.first();

	if (!existingPunishment) return await bot.sendContainer(interaction, 'notFound', `No punishment with ID \`${id}\` has been found in the database.`);

	const target = await bot.knex<Personnel>('personnel')
		.select('*')
		.where('roblox_id', existingPunishment.target_rbx_id)
		.first();

	await bot.knex<Punishment>('punishments')
		.del()
		.where('punishment_id', id);

	let extra = '';

	if (target && (interaction.user.id !== target.discord_id)) await bot.users.send(target.discord_id, bot.createContainerPayload({
		color: 'Green',
		sections: [{
			title: 'Punishment removed.',
			description: `Your punishment with ID \`${id}\` has been removed.
Please review the information below. For any questions about this, please contact the ACSD administration.`,
			thumbnailUrl: bot.logos.checkmark,
			fields: [
				{ name: 'Original punishment reason:', value: existingPunishment.reason },
				...(reason ? [{ name: 'Punishment removal reason:', value: reason }] : []),
				{ name: 'Punishment ID:', value: id }
			]
		}]
	})).catch(_ => extra = ' (⚠️ could not notify the user)');

	await bot.sendContainer(interaction, 'success', {
		sections: [{
			description: `Successfully removed ${target ? `${target.roblox_username}'s` : 'the'} punishment${extra}.`,
			fields: [
				{ name: 'Original punishment reason:', value: existingPunishment.reason },
				...(reason ? [{ name: 'Punishment removal reason:', value: reason }] : []),
				{ name: 'Punishment ID:', value: id }
			]
		}]
	});
}
