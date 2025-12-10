import { Guild, Invite, User, TextChannel } from "discord.js";
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

        const inviteExp = invite.expiresTimestamp ? `<t:${Math.round(invite.expiresTimestamp / 1000)}:f>` : '-';

        await channel.send({
            embeds: [
                bot.embed
                    .setColor('LuminousVividPink')
                    .setTitle(`A new invite link has been generated.`)
                    .setDescription(`Inviter: ${invite.inviter as User}\nCreated: <t:${Math.round(invite.createdTimestamp as number / 1000)}:f>\nExpires: ${inviteExp}\nInvite code: ${invite.code}\nInvite link: ${invite.url}`)
            ]
        });
    } catch (error) {
        console.error(error);
    }
}
