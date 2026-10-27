import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction } from 'discord.js';
import bot from '../../index.ts';
import type { personnelInfo, punishmentInfo } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('issue')
	.setDescription('Issue a punishment to an ACSD member.')
	.addStringOption(o => o
		.setName('type')
		.setDescription('The punishment type.')
		.setChoices(
			{ name: 'Warning', value: 'warn' },
			{ name: 'Strike', value: 'strike' }
		)
		.setRequired(true)
	)
	.addStringOption(o => o
		.setName('reason')
		.setDescription('The reason for this punishment to be issued.')
		.setMaxLength(1024)
		.setRequired(true)
	)
	.addUserOption(o => o
		.setName('server_member')
		.setDescription('The server member to be punished.')
	)
	.addStringOption(o => o
		.setName('roblox_username')
		.setDescription('The Roblox user to be punished.')
		.setMinLength(3)
		.setMaxLength(20)
		.setAutocomplete(true)
	);

export const highRank = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo) {
	await interaction.deferReply();

	const type = interaction.options.getString('type', true) as 'warn' | 'strike';
	const reason = interaction.options.getString('reason', true);
	const member = interaction.options.getMember('server_member');
	const playerUsername = interaction.options.getString('roblox_username');

	let target: personnelInfo | undefined = cmdUser;

	if (member || playerUsername) target = await bot.knex<personnelInfo>('personnel')
		.select('*')
		.where(builder => {
			if (member) builder.where('discordId', member.id);
			else if (playerUsername) builder.where('robloxUsername', playerUsername);
		})
		.first();

	if (!target) return await bot.sendContainer(interaction, 'notFound', `${member ?? playerUsername} is not registered in the ACSD database.`);

	const punishmentId = crypto.randomUUID();

	await bot.knex<punishmentInfo>('punishments')
		.insert({
			punishmentId: punishmentId,
			targetRbxId: target.robloxId,
			execRbxId: cmdUser.robloxId,
			punishmentType: type,
			reason: reason
		});

	let extra = '';

	if (interaction.user.id !== target.discordId) await bot.users.send(target.discordId, bot.createContainerPayload({
		color: type === 'warn' ? 'Orange' : 'Red',
		sections: [{
			title: 'Punishment issued.',
			description: `You have been issued a **${type === 'warn' ? 'warning' : 'strike'}**.
Please review the information below. For any questions about this, please contact the ACSD administration.`,
			thumbnailUrl: bot.logos.warning,
			fields: [
				{ name: 'Reason:', value: reason },
				{ name: 'Punishment ID:', value: punishmentId }
			]
		}]
	})).catch(_ => extra = ' (⚠️ could not notify the user)');

	await bot.sendContainer(interaction, 'success', {
		sections: [{
			description: `Successfully issued a ${type === 'warn' ? 'warning' : 'strike'} to ${target.robloxUsername}${extra}.`,
			fields: [
				{ name: 'Reason:', value: reason },
				{ name: 'Punishment ID:', value: punishmentId }
			]
		}]
	});
}

export async function autocomplete(interaction: AutocompleteInteraction<'cached'>) {
	const focusedValue = interaction.options.getFocused();
	const choices = await bot.knex<personnelInfo>('personnel').select('*');
	const filtered = choices.map(guard => guard.robloxUsername).filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));

	await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
