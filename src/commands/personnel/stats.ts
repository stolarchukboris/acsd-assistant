import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder, AutocompleteInteraction, GuildMember } from 'discord.js';
import bot from '../../index.js';
import axios from 'axios';
import { loggedShift, partialPersonnelInfo, personnelCredits, personnelInfo } from 'types/knex.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('stats')
    .setDescription('View your or other guard\'s statistics in ACSD.')
    .addUserOption(o => o
        .setName('server_member')
        .setDescription('Search stats by user\'s Discord ID.')
    )
    .addStringOption(o => o
        .setName('roblox_username')
        .setDescription('Search stats by user\'s Roblox username.')
        .setAutocomplete(true)
    ).addBooleanOption(o => o
        .setName('hidden')
        .setDescription('Whether to make the command output ephemeral (defaults to TRUE).')
    );

export async function execute(interaction: ChatInputCommandInteraction, cmdUser: personnelInfo) {
    const hidden = interaction.options.getBoolean('hidden') ?? true;

    await interaction.deferReply(hidden ? { flags: 'Ephemeral' } : undefined);

    const member = interaction.options.getMember('server_member') as GuildMember | null;
    const playerUsername = interaction.options.getString('roblox_username');

    const stats = (member || playerUsername) ? await bot.knex<personnelInfo>('personnel')
        .select('*')
        .where(builder => {
            if (member) builder.where('discordId', member.id);
            else if (playerUsername) builder.where('robloxUsername', playerUsername);
        })
        .first() : cmdUser;

    async function getRobloxPfp(robloxId: string) {
        const key = bot.env.OPEN_CLOUD_API_KEY;

        if (!key) return bot.logos.placeholder;

        try {
            const res = await axios.get(`https://apis.roblox.com/cloud/v2/users/${robloxId}:generateThumbnail?shape=SQUARE`, { headers: { 'x-api-key': key } });
            
            return res.data.response.imageUri;
        } catch {
            return bot.logos.placeholder;
        }

    }

    if (stats) {
        const totalTime = await bot.knex<loggedShift>('loggedShifts')
            .select('*')
            .where('robloxId', stats.robloxId)
            .then(stats => stats.map(stat => stat.lenMinutes).reduce((a, b) => a + b, 0));
        const credits = await bot.knex<personnelCredits>('credits')
            .select('*')
            .where('robloxId', stats.robloxId)
            .first();

        const pfpURL = await getRobloxPfp(stats.robloxId);

        await interaction.editReply({
            embeds: [
                bot.embed
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
                    )
            ]
        });
    } else {
        const partial = playerUsername
            ? await bot.knex<partialPersonnelInfo>('personnelPartial').select('*').where('robloxUsername', playerUsername).first()
            : undefined;

        if (!partial) return await interaction.editReply({
                embeds: [bot.embeds.notFound.setDescription(`Could not find ${playerUsername ? `${playerUsername}'s` : 'your'} stats in the ACSD database.`)]
            });

        const totalTime = await bot.knex<loggedShift>('loggedShifts')
            .select('*')
            .where('robloxId', partial.robloxId)
            .then(stats => stats.map(stat => stat.lenMinutes).reduce((a, b) => a + b, 0));

        const pfpURL = await getRobloxPfp(partial.robloxId);

        await interaction.editReply({
            embeds: [
                bot.embed
                    .setColor('Orange')
                    .setThumbnail(pfpURL)
                    .setTitle(`${partial.robloxUsername}'s partial statistics.`)
                    .setDescription('This user is not registered in the ACSD database, but they have shift time logged.')
                    .setFields({ name: 'Total time on-duty:', value: `${totalTime} minutes.` })
            ]
        });
    }
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    const focusedValue = interaction.options.getFocused();
    const choices = await bot.knex<personnelInfo>('personnel')
        .select('robloxUsername')
        .union(function () {
            this.select('robloxUsername').from('personnelPartial');
        });
    const filtered = choices.map(guard => guard.robloxUsername).filter(choice => choice.toLowerCase().startsWith(focusedValue.toLowerCase()));

    await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })).slice(0, 25));
}
