import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import bot from '../../index.ts';
import type { LoggedShift, Personnel } from '../../types/knex.ts';

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

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: Personnel) {
	await interaction.deferReply();

	const minutes = interaction.options.getInteger('minutes', true);
	const reason = interaction.options.getString('reason', true);
	const startTime = interaction.options.getInteger('start_time') ?? unixNow();
	const member = interaction.options.getMember('server_member');
	const playerUsername = interaction.options.getString('roblox_username');

	let target: Personnel | undefined = cmdUser;

	if (member || playerUsername) target = await bot.knex<Personnel>('personnel')
		.select('*')
		.where(builder => {
			if (member) builder.where('discord_id', member.id);
			else if (playerUsername) builder.where('roblox_username', playerUsername);
		})
		.first();

	if (!target) return await bot.sendContainer(interaction, 'notFound', `${member ?? playerUsername} is not registered in the ACSD database.`);

	const id = crypto.randomUUID();

	await bot.knex<LoggedShift>('loggedShifts')
		.insert({
			shift_id: id,
			roblox_id: target.roblox_id,
			started_timestamp: startTime,
			ended_timestamp: startTime + minutes * 60,
			len_minutes: minutes,
			proof: reason
		});

	await bot.sendContainer(interaction, 'success', {
		sections: [{
			description: `Successfully added ${minutes} minutes to ${target.roblox_username}'s stats.`,
			fields: [
				{ name: 'Shift ID:', value: id },
				{ name: 'Reason:', value: reason }
			]
		}]
	});
}

export async function autocomplete(interaction: AutocompleteInteraction<'cached'>) {
	const focusedValue = interaction.options.getFocused();
	const choices = await bot.knex<Personnel>('personnel').select('*');
	const filtered = choices.map(guard => guard.roblox_username).filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));

	await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
