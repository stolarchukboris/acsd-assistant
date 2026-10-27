import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction } from 'discord.js';
import bot from '../../index.ts';
import type { loggedShift, personnelCredits, personnelInfo, punishmentInfo } from '../../types/knex.ts';
import type { ContainerOptions } from '../../utils/containers.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('stats')
	.setDescription('View your or other guard\'s statistics in ACSD.')
	.addUserOption(o => o
		.setName('server_member')
		.setDescription('Search stats by user\'s Discord ID.')
	)
	.addStringOption(o => o
		.setName('roblox_username')
		.setDescription('Search stats by user\'s Roblox username.')
		.setMinLength(3)
		.setMaxLength(20)
		.setAutocomplete(true)
	).addBooleanOption(o => o
		.setName('hidden')
		.setDescription('Whether to make the command output ephemeral (defaults to TRUE).')
	);

export const auth = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo) {
	const hidden = interaction.options.getBoolean('hidden') ?? true;

	await interaction.deferReply(hidden ? { flags: 'Ephemeral' } : undefined);

	const member = interaction.options.getMember('server_member');
	const playerUsername = interaction.options.getString('roblox_username');

	const stats = (member || playerUsername) ? await bot.knex<personnelInfo>('personnel')
		.select('*')
		.where(builder => {
			if (member) builder.where('discordId', member.id);
			else if (playerUsername) builder.where('robloxUsername', playerUsername);
		})
		.first() : cmdUser;

	if (!stats) return await bot.sendContainer(interaction, 'notFound', 'No stats found in the database.');

	const shifts = await bot.knex<loggedShift>('loggedShifts')
		.select('*')
		.where('robloxId', stats.robloxId)
		.orderBy('endedTimestamp', 'desc');
	const totalTime = shifts.map(shift => shift.lenMinutes).reduce((a, b) => a + b, 0);
	const credits = await bot.knex<personnelCredits>('credits')
		.select('*')
		.where('robloxId', stats.robloxId)
		.first();

	let punishments, desc = ``;

	if (bot.highRanks.includes(cmdUser.acsdRank) || stats === cmdUser) {
		punishments = await bot.knex<punishmentInfo>('punishments')
			.select('*')
			.where('targetRbxId', stats.robloxId)
			.orderBy('createdAt', 'desc');

		if (punishments.length > 0) for (const punishment of punishments) desc = desc.concat(
			`**__${punishment.punishmentType === 'warn' ? 'Warning' : 'Strike'}__ ${punishment.punishmentId}:**
- **Issued**: <t:${Math.floor(Date.parse(punishment.createdAt) / 1000)}>
- **Reason**: ${punishment.reason}\n\n`
		);
	}

	const pfpURL = await bot.getRobloxPfp(stats.robloxId);

	const sections: ContainerOptions['sections'] = [{
		title: `${stats.robloxUsername}'s statistics.`,
		description: `Here are ${stats.robloxUsername}'s Security Division statistics.
Depending on your rank, some information may not be available to you.`,
		thumbnailUrl: pfpURL,
		fields: [
			{ name: 'Linked Discord:', value: `<@${stats.discordId}>` },
			{ name: 'Linked Roblox:', value: `[${stats.robloxUsername}](https://www.roblox.com/users/${stats.robloxId}/profile)` },
			{ name: 'Register date:', value: `<t:${Math.floor(Date.parse(stats.entryCreated) / 1000)}>` },
			{ name: 'Total time on-duty:', value: `${totalTime} minutes.` },
			{ name: 'Total credits:', value: credits?.amount.toString() ?? '0' },
			{ name: 'Rank:', value: stats.acsdRank }
		]
	}];

	if (shifts[0]) sections.push({
		title: 'Latest shift.',
		fields: [
			{ name: 'Shift ID:', value: shifts[0].shiftId },
			{ name: 'Started:', value: `<t:${shifts[0].startedTimestamp}>` },
			{ name: 'Ended:', value: `<t:${shifts[0].endedTimestamp}>` },
			{ name: 'Length:', value: `${shifts[0].lenMinutes} minutes.` }
		]
	});

	if (desc !== '') sections.push({
		title: 'Active punishments.',
		description: desc
	});

	await bot.sendContainer(interaction, bot.createContainerPayload({ color: 'Blurple', sections }));
}

export async function autocomplete(interaction: AutocompleteInteraction<'cached'>) {
	const focusedValue = interaction.options.getFocused();
	const choices = await bot.knex<personnelInfo>('personnel').select('*');
	const filtered = choices.map(guard => guard.robloxUsername).filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));

	await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
