import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction, GuildMember } from 'discord.js';
import bot from '../../index.js';
import { creditTransaction, personnelCredits, personnelPartial } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('subtract')
    .setDescription('Subtract credits from member\'s balance.')
    .addIntegerOption(o => o
        .setName('amount')
        .setDescription('The amount of credits to subtract.')
        .setMinValue(1)
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
        .setDescription('Server member to subtract credits from.')
    )
    .addStringOption(o => o
        .setName('roblox_username')
        .setDescription('Roblox user to subtract credits from.')
        .setAutocomplete(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const amount = interaction.options.getInteger('amount', true);
    const member = interaction.options.getMember('server_member') as GuildMember | null;
    const playerUsername = interaction.options.getString('roblox_username');
    const reason = interaction.options.getString('reason', true);
    const cmdUser = await bot.knex<personnelPartial>('personnel')
        .select('*')
        .where('discordId', interaction.user.id)
        .first();

    if (!cmdUser) return await interaction.editReply({
        embeds: [
            bot.embeds.accessDenied.setDescription('You are not registered in the ACSD database.')
        ]
    });

    let target: personnelPartial | undefined = cmdUser;

    if (member || playerUsername) target = await bot.knex<personnelPartial>('personnel')
        .select('*')
        .where('discordId', member?.id)
        .orWhere('robloxUsername', playerUsername)
        .first();

    if (!target) return await interaction.editReply({
        embeds: [
            bot.embeds.notFound.setDescription(`${member ?? playerUsername} is not registered in the ACSD database.`)
        ]
    });

    const credits = await bot.knex<personnelCredits>('credits')
        .select('*')
        .where('robloxId', target.robloxId)
        .first();
    const transactionId = crypto.randomUUID();

    await bot.knex<creditTransaction>('creditTransactions')
        .insert({
            transactionId: transactionId,
            execRbxId: cmdUser.robloxId,
            targetRbxId: target.robloxId,
            delta: -amount,
            balanceResult: (credits?.amount ?? 0) - amount,
            reason: reason
        });

    await bot.knex.transaction(async trans => {
        await trans<personnelCredits>('credits')
            .insert({
                robloxId: target.robloxId,
                amount: -amount
            })
            .onConflict('robloxId')
            .merge({ amount: bot.knex.raw('credits.amount - ?', [amount]) });

        await trans<personnelCredits>('credits')
            .del()
            .where('robloxId', target.robloxId)
            .andWhere('amount', 0);
    });

    let extra = '';

    if (interaction.user.id !== target.discordId) await bot.users.send(target.discordId, {
        embeds: [
            bot.embed
                .setColor('Red')
                .setTitle('Credits subtracted.')
                .setDescription(`Your credit balance has been reduced by ${amount} credit(s). If you have any questions about this, please contact the ACSD administration.`)
                .setFields(
                    { name: 'Before:', value: `${credits?.amount ?? 0}`, inline: true },
                    { name: 'After:', value: `${(credits?.amount ?? 0) - amount}`, inline: true },
                    { name: 'Reason:', value: reason },
                    { name: 'Transaction ID:', value: transactionId }
                )
        ]
    }).catch(_ => extra = ' (could not notify the user)');

    await interaction.editReply({
        embeds: [
            bot.embeds.success
                .setDescription(`Successfully subtracted ${amount} credit(s) from ${target.robloxUsername}'s balance${extra}.`)
                .setFields(
                    { name: 'Before:', value: `${credits?.amount ?? 0}`, inline: true },
                    { name: 'After:', value: `${(credits?.amount ?? 0) - amount}`, inline: true },
                    { name: 'Reason:', value: reason },
                    { name: 'Transaction ID:', value: transactionId }
                )
        ]
    });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();
    const choices = await bot.knex<personnelPartial>('personnel').select('*');
    const filtered = choices.map(guard => guard.robloxUsername).filter(choice => choice.toLowerCase().startsWith(focusedValue.toLowerCase()));

    await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
