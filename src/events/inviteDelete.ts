import { Guild, Invite, TextChannel } from "discord.js";
import bot, { settingInfo } from "../index.js";

export async function execute(invite: Invite) {
    try {
        const setting = await bot.knex<settingInfo>('serverLogsChannelSetting')
            .select('*')
            .where('guildId', invite.guild?.id)
            .first();

        if (!setting) return;

        const channel = (invite.guild as Guild).channels.cache.get(setting.settingValue as string) as TextChannel;
        if (!channel.isTextBased()) return;

        await channel.send({
            embeds: [
                bot.embed
                    .setColor('DarkButNotBlack')
                    .setTitle(`An invite has been deleted.`)
                    .setDescription(`Invite code: ${invite.code}\nInvite link: ${invite.url}`)
            ]
        });
    } catch (error) {
        console.error(error);
    }
}
