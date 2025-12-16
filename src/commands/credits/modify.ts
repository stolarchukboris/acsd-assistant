import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction, GuildMember } from 'discord.js';
import bot from '../../index.js';
import { creditTransaction, personnelCredits, personnelInfo } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('modify')
    .setDescription('Modify member\'s credit balance.')
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
        .setDescription('Server member to give credits to.')
    )
    .addStringOption(o => o
        .setName('roblox_username')
        .setDescription('Roblox user to give credits to.')
        .setAutocomplete(true)
    );

export const highRank = true;

export async function execute(interaction: ChatInputCommandInteraction, cmdUser: personnelInfo) {
    await interaction.deferReply();

    const action = interaction.options.getString('action', true);
    let amount = interaction.options.getInteger('amount', true);
    if (action === 'sub') amount = -amount;

    const member = interaction.options.getMember('server_member') as GuildMember | null;
    const playerUsername = interaction.options.getString('roblox_username');
    const reason = interaction.options.getString('reason', true);

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

    const credits = await bot.knex<personnelCredits>('credits')
        .select('*')
        .where('robloxId', target.robloxId)
        .first();
    const newCredits = action === 'set'
        ? amount
        : (credits?.amount ?? 0) + amount;
    const delta = newCredits - (credits?.amount ?? 0);

    if (delta === 0) return await interaction.editReply({
        embeds: [
            bot.embeds.warning
                .setDescription('User\'s balance has not been changed.')
                .setFields({ name: 'Credits:', value: `${credits?.amount ?? 0}` })
        ]
    });

    if (newCredits < -32769 || newCredits > 32768) return await interaction.editReply({
        embeds: [
            bot.embeds.error.setDescription('The new credits amount is out of [-32768; 32767] range.')
        ]
    });

    const transactionId = crypto.randomUUID();

    await bot.knex<creditTransaction>('creditTransactions')
        .insert({
            transactionId: transactionId,
            execRbxId: cmdUser.robloxId,
            targetRbxId: target.robloxId,
            balanceBefore: credits?.amount ?? 0,
            balanceAfter: newCredits,
            reason: reason
        });

    await bot.knex.transaction(async trans => {
        await trans<personnelCredits>('credits')
            .insert({
                robloxId: target.robloxId,
                amount: newCredits
            })
            .onConflict('robloxId')
            .merge({ amount: action === 'set' ? amount : bot.knex.raw('credits.amount + ?', [amount]) });

        await trans<personnelCredits>('credits')
            .del()
            .where('robloxId', target.robloxId)
            .andWhere('amount', 0);
    });

    let extra = '';

    if (interaction.user.id !== target.discordId) await bot.users.send(target.discordId, {
        embeds: [
            bot.embed
                .setColor(delta > 0 ? 'Green' : 'Red')
                .setTitle(`Credits ${delta > 0 ? 'added' : 'subtracted'}.`)
                .setDescription(`Your credit balance has been ${delta > 0 ? 'increased' : 'decreased'} by ${amount} credit(s). If you have any questions about this, please contact the ACSD administration.`)
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
            bot.embeds.success
                .setDescription(`Successfully modified ${target.robloxUsername}'s balance${extra}.`)
                .setFields(
                    { name: 'Before:', value: `${credits?.amount ?? 0}`, inline: true },
                    { name: 'After:', value: `${newCredits}`, inline: true },
                    { name: 'Reason:', value: reason },
                    { name: 'Transaction ID:', value: transactionId }
                )
        ]
    });
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();
    const choices = await bot.knex<personnelInfo>('personnel').select('*');
    const filtered = choices.map(guard => guard.robloxUsername).filter(choice => choice.toLowerCase().startsWith(focusedValue.toLowerCase()));

    await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
