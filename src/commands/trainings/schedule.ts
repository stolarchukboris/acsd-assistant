import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, TextChannel } from 'discord.js';
import axios from 'axios';
import bot from '../../index.ts';
import type { personnelInfo, trainingInfo } from '../../types/knex.ts';

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
		.setMinValue(Math.floor(Date.now() / 1000))
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

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo, channel: TextChannel, role: string) {
	const time = interaction.options.getInteger('time', true);
	const trainingAroundThisTime = await bot.knex<trainingInfo>('trainings')
		.select('*')
		.where('trainingTimestamp', '>=', time - 3600)
		.andWhere('trainingTimestamp', '<=', time + 3600)
		.first();

	if (trainingAroundThisTime) return await interaction.editReply({
		embeds: [
			bot.embeds.error
				.setDescription('There is another training scheduled in less than an hour from this one.')
				.setFields(
					{ name: 'Training ID:', value: trainingAroundThisTime.trainingId, inline: true },
					{ name: 'Starting:', value: `<t:${trainingAroundThisTime.trainingTimestamp}>`, inline: true }
				)
		]
	});

	const gameUrl = interaction.options.getString('game_url', true);
	const placeId = gameUrl.split('/')[4];
	const gameResponse = await axios.get(`https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`,
		{ headers: { Cookie: `.ROBLOSECURITY=${Bun.env.ROBLOX_COOKIE}` } }
	).catch(async _ => {
		await interaction.editReply({
			embeds: [
				bot.embeds.error.setDescription('Could not find the provided game.')
			]
		});
		return;
	});

	if (!gameResponse) return;

	const minAttend = interaction.options.getInteger('min_attendance', true);
	const maxAttend = interaction.options.getInteger('max_attendance');
	const duration = interaction.options.getString('duration');
	const comment = interaction.options.getString('comment');

	const gameName: string = gameResponse.data[0].name;
	const trainingId = crypto.randomUUID();

	await bot.knex<trainingInfo>('trainings')
		.insert({
			trainingId: trainingId,
			hostDiscordId: cmdUser.discordId,
			hostRobloxUsername: cmdUser.robloxUsername,
			trainingTimestamp: String(time)
		});

	const sentAnns = await channel.send({
		content: `<@&${role}>`,
		embeds: [
			bot.embed
				.setTitle(`A training has been scheduled on <t:${time}:F>.`)
				.setDescription(`This training will take place in ${gameName}. The time is pre-converted to your local timezone.

## General training rules:
- Listen to the host's instructions;
- Permission to speak (PTS) is active by default. Ask for PTS if you want to say something;
- Be respectful towards others;
- Inform the host if you disconnect, need to leave the training early/go AFK;
- If there are less than ${minAttend} ✅ reactions (excluding the bot) under this announcement, the training can be cancelled;
- To prevent last-moment cancellations, **you cannot remove your reaction less than 10 minutes prior to training start**.

If you are ready to attend this training, please react with ✅ below to confirm your attendance.
**You react you attend.**`)
				.setFields(
					{ name: 'Training host:', value: `${cmdUser.acsdRank} ${cmdUser.robloxUsername} (<@${cmdUser.discordId}>)` },
					{ name: 'Details:', value: `Attendance minimum: ${minAttend}\n${maxAttend ? `Attendance maximum: ${maxAttend}\n` : ''}${duration ? `Training duration: ${duration}\n` : ''}`, inline: true },
					{ name: 'Training ID:', value: trainingId, inline: true },
					...(comment ? [{ name: 'Note from host:', value: comment }] : [])
				)
		]
	});

	await sentAnns.react('✅');
	await channel.send(gameUrl);

	await bot.knex<trainingInfo>('trainings')
		.update('messageId', sentAnns.id)
		.where('trainingId', trainingId);

	await interaction.editReply({
		embeds: [
			bot.embeds.success
				.setDescription(`Successfully scheduled the training on <t:${time}:F>.`)
				.setFields({ name: 'Training ID:', value: trainingId })
		]
	});
}
