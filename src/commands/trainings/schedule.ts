import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, TextChannel } from 'discord.js';
import bot from '../../index.ts';
import type { Personnel, Training } from '../../types/knex.ts';
import { fetchApi } from 'rozod';
import { getGamesMultigetPlaceDetails } from 'rozod/endpoints/gamesv1';

export const data = new SlashCommandSubcommandBuilder()
	.setName('schedule')
	.setDescription('Schedule a training.')
	.addStringOption(o => o
		.setName('game_url')
		.setDescription('The URL to a game where this training will take place.')
		.setRequired(true)
	)
	.addIntegerOption(o => o
		.setName('time')
		.setDescription('The UNIX timestamp of the training start.')
		.setMinValue(unixNow())
		.setRequired(true)
	)
	.addIntegerOption(o => o
		.setName('min_attendance')
		.setDescription('The minimum amount of attendees required for this training to commence.')
		.setMinValue(2)
		.setRequired(true)
	)
	.addIntegerOption(o => o
		.setName('max_attendance')
		.setDescription('The maximum amount of attendees for this training.')
		.setMinValue(2)
	)
	.addStringOption(o => o
		.setName('duration')
		.setDescription('The training duration.')
	)
	.addStringOption(o => o
		.setName('comment')
		.setDescription('Optional comment about this training.')
	);

export const highRank = true;
export const training = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: Personnel, channel: TextChannel, role: string) {
	const time = interaction.options.getInteger('time', true);

	const minDate = new Date((time - 3600) * 1000);
	const maxDate = new Date((time + 3600) * 1000);

	const trainingAroundThisTime = await bot.knex<Training>('trainings')
		.select('*')
		.whereBetween('starting_at', [minDate, maxDate])
		.first();

	if (trainingAroundThisTime) return await bot.sendContainer(interaction, bot.containers.error({
		sections: [{
			description: 'There is another scheduled or concluded training within an hour from this one.',
			fields: [
				{ name: 'Training ID:', value: trainingAroundThisTime.training_id },
				{ name: 'Starting:', value: `<t:${dateToUnix(trainingAroundThisTime.starting_at)}>` }
			]
		}]
	}));

	const gameUrl = interaction.options.getString('game_url', true);
	const placeId = Number(gameUrl.split('/')[4]);

	if (isNaN(placeId)) return await bot.sendContainer(interaction, 'error', 'Could not retrieve Place ID from the game URL');

	const gameResponse = await fetchApi(getGamesMultigetPlaceDetails, { placeIds: [placeId] }, { throwOnError: true });

	if (gameResponse.length === 0) return await bot.sendContainer(interaction, 'error', 'Could not find the game from the provided link.');

	const minAttend = interaction.options.getInteger('min_attendance', true);
	const maxAttend = interaction.options.getInteger('max_attendance');
	const duration = interaction.options.getString('duration');
	const comment = interaction.options.getString('comment');

	const gameName: string = gameResponse[0]!.name;
	const trainingId = crypto.randomUUID();

	await bot.knex<Training>('trainings')
		.insert({
			training_id: trainingId,
			host_discord_id: cmdUser.discord_id,
			host_roblox_username: cmdUser.roblox_username,
			starting_at: new Date(time)
		});

	const sentAnns = await bot.sendContainer(channel, bot.createContainerPayload({
		allowedMentions: { parse: ['roles'] },
		sections: [{
			title: `A training has been scheduled on <t:${time}:F>.`,
			description: `<@&${role}>\nThis training will take place in ${gameName}. The time is pre-converted to your local timezone.

## General training rules:
- Listen to the host's instructions;
- Permission to speak (PTS) is active by default. Ask for PTS if you want to say something;
- Be respectful towards others;
- Inform the host if you disconnect, need to leave the training early/go AFK;
- If there are less than ${minAttend} ✅ reactions (excluding the bot) under this announcement, the training can be cancelled;
- To prevent last-moment cancellations, **you cannot remove your reaction less than 10 minutes prior to training start**.

If you are ready to attend this training, please react with ✅ below to confirm your attendance.
**You react you attend.**`,
			fields: [{ name: 'Training host:', value: `${cmdUser.acsd_rank} ${cmdUser.roblox_username} (<@${cmdUser.discord_id}>)` },
			{ name: 'Details:', value: `\nAttendance minimum: ${minAttend}\n${maxAttend ? `Attendance maximum: ${maxAttend}\n` : ''}${duration ? `Training duration: ${duration}\n` : ''}` },
			{ name: 'Training ID:', value: trainingId },
			...(comment ? [{ name: 'Note from host:', value: comment }] : [])]
		}]
	}));

	await sentAnns.react('✅');
	await channel.send(gameUrl);

	await bot.knex<Training>('trainings')
		.update('message_id', sentAnns.id)
		.where('training_id', trainingId);

	await bot.sendContainer(interaction, 'success', {
		sections: [{
			description: `Successfully scheduled the training on <t:${time}:F>.`,
			fields: [{ name: 'Training ID:', value: trainingId }]
		}]
	});
}
