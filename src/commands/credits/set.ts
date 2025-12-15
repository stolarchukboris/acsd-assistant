import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction, GuildMember } from 'discord.js';
import bot from '../../index.js';
import { creditTransaction, personnelCredits, personnelPartial } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('set')
    .setDescription('Set member\'s credit balance to a specified amount.')
    .addIntegerOption(o => o
        .setName('amount')
        .setDescription('The amount of credits to set.')
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
        .setDescription('Server member to set credits to.')
    )
    .addStringOption(o => o
        .setName('roblox_username')
        .setDescription('Roblox user to set credits to.')
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

    if (amount === (credits?.amount ?? 0)) return await interaction.editReply({
        embeds: [
            bot.embeds.warning
                .setDescription(`${target.robloxUsername}'s credit balance has not been changed.`)
                .setFields({ name: 'Balance:', value: `${credits?.amount ?? 0}` })
        ]
    });

    const transactionId = crypto.randomUUID();
    const delta = amount - (credits?.amount ?? 0);

    await bot.knex<creditTransaction>('creditTransactions')
        .insert({
            transactionId: transactionId,
            execRbxId: cmdUser.robloxId,
            targetRbxId: target.robloxId,
            delta: delta,
            balanceResult: amount,
            reason: reason
        });

    amount === 0
        ? await bot.knex<personnelCredits>('credits')
            .del()
            .where('robloxId', target.robloxId)
        : await bot.knex<personnelCredits>('credits')
            .insert({
                robloxId: target.robloxId,
                amount: amount
            })
            .onConflict('robloxId')
            .merge({ amount: amount });

    let extra = '';

    if (interaction.user.id !== target.discordId) await bot.users.send(target.discordId, {
        embeds: [
            bot.embed
                .setColor(delta > 0 ? 'Green' : 'Red')
                .setTitle('Credits set.')
                .setDescription(`Your credit balance has been set to ${amount} credit(s). If you have any questions about this, please contact the ACSD administration.`)
                .setFields(
                    { name: 'Before:', value: `${credits?.amount ?? 0}`, inline: true },
                    { name: 'After:', value: `${amount}`, inline: true },
                    { name: 'Reason:', value: reason },
                    { name: 'Transaction ID:', value: transactionId }
                )
        ]
    }).catch(_ => extra = ' (could not notify the user)');

    await interaction.editReply({
        embeds: [
            bot.embeds.success
                .setDescription(`Successfully set ${target.robloxUsername}'s balance to ${amount} credit(s)${extra}.`)
                .setFields(
                    { name: 'Before:', value: `${credits?.amount ?? 0}`, inline: true },
                    { name: 'After:', value: `${amount}`, inline: true },
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
