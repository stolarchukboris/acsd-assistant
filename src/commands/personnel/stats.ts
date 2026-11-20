import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction } from 'discord.js';
import bot from '../../index.ts';
import type { LoggedShift, Credits, Personnel, Punishment } from '../../types/knex.ts';
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

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: Personnel) {
	const hidden = interaction.options.getBoolean('hidden') ?? true;

	await interaction.deferReply(hidden ? { flags: 'Ephemeral' } : undefined);

	const member = interaction.options.getMember('server_member');
	const playerUsername = interaction.options.getString('roblox_username');

	const stats = (member || playerUsername) ? await bot.knex<Personnel>('personnel')
		.select('*')
		.where(builder => {
			if (member) builder.where('discord_id', member.id);
			else if (playerUsername) builder.where('roblox_username', playerUsername);
		})
		.first() : cmdUser;

	if (!stats) return await bot.sendContainer(interaction, 'notFound', 'No stats found in the database.');

	const shifts = await bot.knex<LoggedShift>('logged_shifts')
		.select('*')
		.where('roblox_id', stats.roblox_id)
		.orderBy('ended_timestamp', 'desc');
	const totalTime = shifts.map(shift => shift.len_minutes).reduce((a, b) => a + b, 0);
	const credits = await bot.knex<Credits>('credits')
		.select('*')
		.where('roblox_id', stats.roblox_id)
		.first();

	let punishments, desc = ``;

	if (bot.highRanks.includes(cmdUser.acsd_rank) || stats === cmdUser) {
		punishments = await bot.knex<Punishment>('punishments')
			.select('*')
			.where('targetRbxId', stats.roblox_id)
			.orderBy('createdAt', 'desc');

		if (punishments.length > 0) for (const punishment of punishments) desc = desc.concat(
			`**__${punishment.punishment_type === 'warn' ? 'Warning' : 'Strike'}__ ${punishment.punishment_id}:**
- **Issued**: <t:${Math.floor(Date.parse(punishment.created_at) / 1000)}>
- **Reason**: ${punishment.reason}\n\n`
		);
	}

	const pfpURL = await bot.getRobloxPfp(stats.roblox_id);

	const sections: ContainerOptions['sections'] = [{
		title: `${stats.roblox_username}'s statistics.`,
		description: `Here are ${stats.roblox_username}'s Security Division statistics.
Depending on your rank, some information may not be available to you.`,
		thumbnailUrl: pfpURL,
		fields: [
			{ name: 'Linked Discord:', value: `<@${stats.discord_id}>` },
			{ name: 'Linked Roblox:', value: `[${stats.roblox_username}](https://www.roblox.com/users/${stats.roblox_id}/profile)` },
			{ name: 'Register date:', value: `<t:${Math.floor(Date.parse(stats.entry_created) / 1000)}>` },
			{ name: 'Total time on-duty:', value: `${totalTime} minutes.` },
			{ name: 'Total credits:', value: credits?.amount.toString() ?? '0' },
			{ name: 'Rank:', value: stats.acsd_rank }
		]
	}];

	if (shifts[0]) sections.push({
		title: 'Latest shift.',
		fields: [
			{ name: 'Shift ID:', value: shifts[0].shift_id },
			{ name: 'Started:', value: `<t:${shifts[0].started_timestamp}>` },
			{ name: 'Ended:', value: `<t:${shifts[0].ended_timestamp}>` },
			{ name: 'Length:', value: `${shifts[0].len_minutes} minutes.` }
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
	const choices = await bot.knex<Personnel>('personnel').select('*');
	const filtered = choices.map(guard => guard.roblox_username).filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));

	await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
