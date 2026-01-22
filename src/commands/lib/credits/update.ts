import type { Subcommand } from "@sapphire/plugin-subcommands";
import { container } from "@sapphire/framework";
import type { personnelCredits, personnelInfo } from "../../../types/knex.ts";

export async function creditsUpdate(interaction: Subcommand.ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	const action = interaction.options.getString('action', true);
	let amount = interaction.options.getInteger('amount', true);
	if (action === 'sub') amount = -amount;

	const member = interaction.options.getMember('server_member');
	const playerUsername = interaction.options.getString('roblox_username');
	const reason = interaction.options.getString('reason', true);

	let target: personnelInfo | undefined = cmdUser;

	if (member || playerUsername) target = await container.knex<personnelInfo>('personnel')
		.select('*')
		.where(builder => {
			if (member) builder.where('discordId', member.id);
			else if (playerUsername) builder.where('robloxUsername', playerUsername);
		})
		.first();

	if (!target) return await interaction.editReply({
		embeds: [
			container.embeds.notFound.setDescription(`${member ?? playerUsername} is not registered in the ACSD database.`)
		]
	});

	const credits = await container.knex<personnelCredits>('credits')
		.select('*')
		.where('robloxId', target.robloxId)
		.first();
	const newCredits = action === 'set'
		? amount
		: (credits?.amount ?? 0) + amount;
	const delta = newCredits - (credits?.amount ?? 0);

	if (delta === 0) return await interaction.editReply({
		embeds: [
			container.embeds.warning
				.setDescription('User\'s balance has not been changed.')
				.setFields({ name: 'Credits:', value: `${credits?.amount ?? 0}` })
		]
	});

	if (newCredits < -32769 || newCredits > 32768) return await interaction.editReply({
		embeds: [
			container.embeds.error.setDescription('The new credits amount is out of [-32768; 32767] range.')
		]
	});

	const transactionId = crypto.randomUUID();

	await container.knex<creditTransaction>('creditTransactions')
		.insert({
			transactionId: transactionId,
			execRbxId: cmdUser.robloxId,
			targetRbxId: target.robloxId,
			balanceBefore: credits?.amount ?? 0,
			balanceAfter: newCredits,
			reason: reason
		});

	await container.knex.transaction(async trans => {
		await trans<personnelCredits>('credits')
			.insert({
				robloxId: target.robloxId,
				amount: newCredits
			})
			.onConflict('robloxId')
			.merge({ amount: action === 'set' ? amount : container.knex.raw('credits.amount + ?', [amount]) });

		await trans<personnelCredits>('credits')
			.del()
			.where('robloxId', target.robloxId)
			.andWhere('amount', 0);
	});

	let extra = '';

	if (interaction.user.id !== target.discordId) await container.client.users.send(target.discordId, {
		embeds: [
			container.embed
				.setColor(delta > 0 ? 'Green' : 'Red')
				.setTitle(`Credits ${delta > 0 ? 'added' : 'subtracted'}.`)
				.setDescription(`Your credit balance has been ${delta > 0 ? 'increased' : 'decreased'} by ${amount} credit(s). For any questions about this, please contact the ACSD administration.`)
				.setFields(
					{ name: 'Before:', value: `${credits?.amount ?? 0}`, inline: true },
					{ name: 'After:', value: `${newCredits}`, inline: true },
					{ name: 'Reason:', value: reason },
					{ name: 'Transaction ID:', value: transactionId }
				)
		]
	}).catch(_ => extra = ' (⚠️ could not notify the user)');

	await interaction.editReply({
		embeds: [
			container.embeds.success
				.setDescription(`Successfully updated ${target.robloxUsername}'s balance${extra}.`)
				.setFields(
					{ name: 'Before:', value: `${credits?.amount ?? 0}`, inline: true },
					{ name: 'After:', value: `${newCredits}`, inline: true },
					{ name: 'Reason:', value: reason },
					{ name: 'Transaction ID:', value: transactionId }
				)
		]
	});
}
