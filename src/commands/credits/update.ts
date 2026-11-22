import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction } from 'discord.js';
import bot from '../../index.ts';
import type { CreditTransaction, Credits, Personnel } from '../../types/knex.ts';

export const data = new SlashCommandSubcommandBuilder()
	.setName('update')
	.setDescription('Update member\'s credit balance.')
	.addStringOption(o => o
		.setName('action')
		.setDescription('The action to perform.')
		.setChoices(
			{ name: 'Add', value: 'add' },
			{ name: 'Subtract', value: 'sub' },
			{ name: 'Set', value: 'set' }
		)
		.setRequired(true)
	)
	.addIntegerOption(o => o
		.setName('amount')
		.setDescription('The amount of credits for this operation.')
		.setRequired(true)
	)
	.addStringOption(o => o
		.setName('reason')
		.setDescription('The reason behind this action.')
		.setMaxLength(1024)
		.setRequired(true)
	)
	.addUserOption(o => o
		.setName('server_member')
		.setDescription('The server member to give credits to.')
	)
	.addStringOption(o => o
		.setName('roblox_username')
		.setDescription('The Roblox user to give credits to.')
		.setMinLength(3)
		.setMaxLength(20)
		.setAutocomplete(true)
	);

export const highRank = true;

export async function execute(interaction: ChatInputCommandInteraction<'cached'>, cmdUser: Personnel) {
	await interaction.deferReply();

	const action = interaction.options.getString('action', true);
	let amount = interaction.options.getInteger('amount', true);
	if (action === 'sub') amount = -amount;

	const member = interaction.options.getMember('server_member');
	const playerUsername = interaction.options.getString('roblox_username');
	const reason = interaction.options.getString('reason', true);

	let target: Personnel | undefined = cmdUser;

	if (member || playerUsername) target = await bot.knex<Personnel>('personnel')
		.select('*')
		.where(builder => {
			if (member) builder.where('discord_id', member.id);
			else if (playerUsername) builder.where('roblox_username', playerUsername);
		})
		.first();

	if (!target) return await bot.sendContainer(interaction, 'notFound', `${member ?? playerUsername} is not registered in the ACSD database.`);

	const credits = await bot.knex<Credits>('credits')
		.select('*')
		.where('roblox_id', target.roblox_id)
		.first();
	const newCredits = action === 'set'
		? amount
		: (credits?.amount ?? 0) + amount;
	const delta = newCredits - (credits?.amount ?? 0);

	if (delta === 0) return await bot.sendContainer(interaction, 'warning', {
		sections: [{
			description: `User's balance has not been changed.`,
			fields: [{ name: 'Credits:', value: `${credits?.amount ?? 0}` }]
		}]
	});

	if (newCredits < -32769 || newCredits > 32768) return await bot.sendContainer(interaction, 'error',
		'The new credits amount is out of [-32768; 32767] range.'
	);

	const transactionId = crypto.randomUUID();

	await bot.knex.transaction(async trx => {
		await trx<CreditTransaction>('credit_transactions')
			.insert({
				transaction_id: transactionId,
				exec_rbx_id: cmdUser.roblox_id,
				target_rbx_id: target.roblox_id,
				balance_before: credits?.amount ?? 0,
				balance_after: newCredits,
				reason: reason
			});

		await trx<Credits>('credits')
			.insert({
				roblox_id: target.roblox_id,
				amount: newCredits
			})
			.onConflict('roblox_id')
			.merge({ amount: action === 'set' ? amount : bot.knex.raw('credits.amount + ?', [amount]) });

		await trx<Credits>('credits')
			.del()
			.where('roblox_id', target.roblox_id)
			.andWhere('amount', 0);
	});

	let extra = '';

	if (interaction.user.id !== target.discord_id) await bot.users.send(target.discord_id, bot.createContainerPayload({
		color: delta > 0 ? 'Green' : 'Red',
		sections: [{
			title: `Credits ${delta > 0 ? 'added' : 'subtracted'}.`,
			description: `Your credit balance has been ${delta > 0 ? 'increased' : 'decreased'} by ${amount} credit(s).
For any questions about this, please contact the ACSD administration.`,
			fields: [
				{ name: 'Before:', value: `${credits?.amount ?? 0}` },
				{ name: 'After:', value: `${newCredits}` },
				{ name: 'Reason:', value: reason },
				{ name: 'Transaction ID:', value: transactionId }
			]
		}]
	})).catch(_ => extra = ' (⚠️ could not notify the user)');

	await bot.sendContainer(interaction, 'success', {
		sections: [{
			description: `Successfully updated ${target.roblox_username}'s balance${extra}.`,
			fields: [
				{ name: 'Before:', value: `${credits?.amount ?? 0}` },
				{ name: 'After:', value: `${newCredits}` },
				{ name: 'Reason:', value: reason },
				{ name: 'Transaction ID:', value: transactionId }
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
