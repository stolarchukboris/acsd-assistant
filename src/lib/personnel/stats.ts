import type { Subcommand } from "@sapphire/plugin-subcommands";
import { container } from "@sapphire/framework";
import type { loggedShift, partialPersonnelInfo, personnelCredits, personnelInfo, punishmentInfo } from "../../types/knex.ts";

export default async function personnelStats(interaction: Subcommand.ChatInputCommandInteraction<'cached'>, cmdUser: personnelInfo) {
	const hidden = interaction.options.getBoolean('hidden') ?? true;

	await interaction.deferReply(hidden ? { flags: 'Ephemeral' } : undefined);

	const member = interaction.options.getMember('server_member');
	const playerUsername = interaction.options.getString('roblox_username');

	const stats = (member || playerUsername) ? await container.knex<personnelInfo>('personnel')
		.select('*')
		.where(builder => {
			if (member) builder.where('discordId', member.id);
			else if (playerUsername) builder.where('robloxUsername', playerUsername);
		})
		.first() : cmdUser;

	async function getRobloxPfp(robloxId: string) {
		const key = Bun.env.OPEN_CLOUD_API_KEY;

		if (!key) return container.logos.placeholder;

		try {
			const res = await container.axios.get(`https://apis.roblox.com/cloud/v2/users/${robloxId}:generateThumbnail?shape=SQUARE`, { headers: { 'x-api-key': key } });

			return res.data.response.imageUri;
		} catch {
			return container.logos.placeholder;
		}

	}

	if (stats) {
		const shifts = await container.knex<loggedShift>('loggedShifts')
			.select('*')
			.where('robloxId', stats.robloxId)
			.orderBy('endedTimestamp', 'desc');
		const totalTime = shifts.map(shift => shift.lenMinutes).reduce((a, b) => a + b, 0);
		const credits = await container.knex<personnelCredits>('credits')
			.select('*')
			.where('robloxId', stats.robloxId)
			.first();

		let punishments, desc = ``;

		if (container.highRanks.includes(cmdUser.acsdRank) || stats === cmdUser) {
			punishments = await container.knex<punishmentInfo>('punishments')
				.select('*')
				.where('targetRbxId', stats.robloxId)
				.orderBy('createdAt', 'desc');

			if (punishments.length > 0) for (const punishment of punishments) desc = desc.concat(
				`**__${punishment.punishmentType === 'warn' ? 'Warning' : 'Strike'}__ ${punishment.punishmentId}:**
- **Issued**: <t:${Math.floor(Date.parse(punishment.createdAt) / 1000)}>
- **Reason**: ${punishment.reason}

`
			)
		}

		const pfpURL = await getRobloxPfp(stats.robloxId);

		await interaction.editReply({
			embeds: [
				container.embed()
					.setColor('Blurple')
					.setThumbnail(pfpURL)
					.setTitle(`${stats.robloxUsername}'s statistics.`)
					.setFields(
						{ name: 'Linked Discord:', value: `<@${stats.discordId}>`, inline: true },
						{ name: 'Linked Roblox:', value: `[${stats.robloxUsername}](https://www.roblox.com/users/${stats.robloxId}/profile)`, inline: true },
						{ name: 'Register date:', value: `<t:${Math.floor(Date.parse(stats.entryCreated) / 1000)}>`, inline: true },
						{ name: 'Total time on-duty:', value: `${totalTime} minutes.`, inline: true },
						{ name: 'Total credits:', value: credits?.amount.toString() ?? '0', inline: true },
						{ name: 'Rank:', value: stats.acsdRank, inline: true }
					),
				...(shifts[0] ? [container.embed()
					.setColor('Blurple')
					.setTitle(`${stats.robloxUsername}'s latest shift.`)
					.setFields(
						{ name: 'Shift ID:', value: shifts[0].shiftId },
						{ name: 'Started:', value: `<t:${shifts[0].startedTimestamp}>`, inline: true },
						{ name: 'Ended:', value: `<t:${shifts[0].endedTimestamp}>`, inline: true },
						{ name: 'Length:', value: `${shifts[0].lenMinutes} minutes.`, inline: true }
					)] : []),
				...(desc !== `` ? [container.embed()
					.setColor('Grey')
					.setTitle(`${stats.robloxUsername}'s active punishments.`)
					.setDescription(desc)
				] : [])
			]
		});
	} else {
		const partial = playerUsername
			? await container.knex<partialPersonnelInfo>('personnelPartial').select('*').where('robloxUsername', playerUsername).first()
			: undefined;

		if (!partial) return await interaction.editReply({
			embeds: [container.embeds().notFound.setDescription(`Could not find ${playerUsername ? `${playerUsername}'s` : 'your'} stats in the ACSD database.`)]
		});

		const totalTime = await container.knex<loggedShift>('loggedShifts')
			.select('*')
			.where('robloxId', partial.robloxId)
			.then(stats => stats.map(stat => stat.lenMinutes).reduce((a, b) => a + b, 0));

		const pfpURL = await getRobloxPfp(partial.robloxId);

		await interaction.editReply({
			embeds: [
				container.embed()
					.setColor('Orange')
					.setThumbnail(pfpURL)
					.setTitle(`${partial.robloxUsername}'s partial statistics.`)
					.setDescription('This user is not registered in the ACSD database, but they have shift time logged.')
					.setFields({ name: 'Total time on-duty:', value: `${totalTime} minutes.` })
			]
		});
	}
}
