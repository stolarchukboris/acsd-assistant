import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import axios from 'axios';
import bot from '../../index.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('group')
    .setDescription('Get information about a Roblox group.')
    .addStringOption(o => o
        .setName('query')
        .setDescription('Group name query.')
        .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const key = bot.env.OPEN_CLOUD_API_KEY;
    const name = interaction.options.getString('query', true);

    try {
        const groupResponse = await axios.get(`https://groups.roblox.com/v1/groups/search/lookup?groupName=${name}`);
        const id: string = groupResponse.data.data[0].id;
        const groupResponse1 = await axios.get(`https://apis.roblox.com/cloud/v2/groups/${id}`, { headers: { 'x-api-key': key } });
        const data = groupResponse1.data;
        const groupId: string = data.id;
        const groupUrl = `https://www.roblox.com/${data.path}`;
        const created = Math.floor(Date.parse(data.createTime) / 1000);
        const updated = Math.floor(Date.parse(data.updateTime) / 1000);
        const groupName: string = data.displayName;
        const groupDesc: string = data.description || 'No description provided.';
        const ownerUrl = `https://www.roblox.com/${data.owner}/profile`;
        const groupMemberCount: string = data.memberCount;
        const isPublicEntryAllowed: boolean = data.publicEntryAllowed;
        const isLocked: boolean = data.locked;
        const isVerified: boolean = data.verified;
        const thumbnailResponse = await axios.get(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=150x150&format=webp&isCircular=false`);
        const thumbnailUrl: string = thumbnailResponse.data.data[0].imageUrl;
        const userResponse = await axios.get(`https://apis.roblox.com/cloud/v2/users/${data.owner.split('/')[1]}`, { headers: { 'x-api-key': key } });
        const ownerName: string = userResponse.data.name;

        await interaction.followUp({
            embeds: [
                bot.embed
                    .setColor('DarkBlue')
                    .setThumbnail(thumbnailUrl)
                    .setTitle(`Roblox group information.`)
                    .setDescription(`Information on [${groupName}](${groupUrl}).`)
                    .addFields(
                        { name: 'Name:', value: groupName, inline: true },
                        { name: 'Owner:', value: `[${ownerName}](${ownerUrl})`, inline: true },
                        { name: 'Member count:', value: groupMemberCount, inline: true },
                        { name: 'Is verified:', value: `${isVerified}`, inline: true },
                        { name: 'Created:', value: `<t:${created}:f>`, inline: true },
                        { name: 'Updated:', value: `<t:${updated}:f>`, inline: true },
                        { name: 'Is locked:', value: `${isLocked}`, inline: true },
                        { name: 'Is public entry allowed:', value: `${isPublicEntryAllowed}`, inline: true },
                        { name: 'Description:', value: groupDesc }
                    )
            ]
        });
    } catch (_) {
        await interaction.editReply({
            embeds: [
                bot.embeds.notFound.setDescription(`No group matching the query \`${name}\` has been found.`)
            ]
        });
    }
}
