import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { loggedShift, personnelInfo } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('add')
	.setDescription('Manually add time on-duty.')
	.addIntegerOption(o => o
		.setName('minutes')
		.setDescription('The amount of minutes to be added.')
		.setMinValue(5)
		.setRequired(true)
	)
	.addStringOption(o => o
		.setName('reason')
		.setDescription('The reason behind this action.')
		.setMaxLength(1024)
		.setRequired(true)
	)
	.addIntegerOption(o => o
		.setName('start_time')
		.setDescription('UNIX shift start time (defaults to current time).')
	)
	.addUserOption(o => o
		.setName('server_member')
		.setDescription('The server member to add time to.')
	)
	.addStringOption(o => o
		.setName('roblox_username')
		.setDescription('The Roblox username of a person to add time to.')
		.setAutocomplete(true)
	);

export const highRank = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo) {
	await interaction.deferReply();

	const minutes = interaction.options.getInteger('minutes', true);
	const reason = interaction.options.getString('reason', true);
	const startTime = interaction.options.getInteger('start_time') ?? Math.floor(Date.now() / 1000);
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

	if (!target) return await interaction.editReply({
		embeds: [
			bot.embeds.notFound.setDescription(`${member ?? playerUsername} is not registered in the ACSD database.`)
		]
	});

	const id = crypto.randomUUID();

	await bot.knex<loggedShift>('loggedShifts')
		.insert({
			shiftId: id,
			robloxId: target.robloxId,
			startedTimestamp: String(startTime),
			endedTimestamp: String(startTime + minutes * 60),
			lenMinutes: minutes,
			proof: reason
		});

	await interaction.editReply({
		embeds: [
			bot.embeds.success
				.setDescription(`Successfully added ${minutes} minutes to ${target.robloxUsername}'s stats.`)
				.setFields(
					{ name: 'Shift ID:', value: id },
					{ name: 'Reason:', value: reason }
				)
		]
	});
}

export async function autocomplete(interaction: AutocompleteInteraction<'cached'>) {
	const focusedValue = interaction.options.getFocused();
	const choices = await bot.knex<personnelInfo>('personnel').select('*');
	const filtered = choices.map(guard => guard.robloxUsername).filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));

	await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
