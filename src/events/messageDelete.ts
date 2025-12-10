import { Message, AttachmentBuilder, Guild, TextChannel } from "discord.js";
import bot, { settingInfo } from "../index.js";

export async function execute(message: Message) {
    try {
        if (message.partial) await message.fetch();

        const setting = await bot.knex<settingInfo>('serverLogsChannelSetting')
            .select('*')
            .where('guildId', message.guildId)
            .first();

        if (!setting) return;

        const channel = (message.guild as Guild).channels.cache.get(setting.settingValue as string) as TextChannel;
        if (!channel.isTextBased()) return;

        const files: AttachmentBuilder[] = [];

        message.attachments.each(attachment => files.push(new AttachmentBuilder(attachment.url)));

        await channel.send({
            embeds: [
                bot.embed
                    .setColor('LuminousVividPink')
                    .setTitle(`Message deleted from ${message.channel.url}`)
                    .setDescription(`**Created on <t:${Math.round(message.createdTimestamp / 1000)}:d> <t:${Math.round(message.createdTimestamp / 1000)}:t> by ${message.author}**:\n${message.content}`)
            ]
        });

        if (files.length !== 0) await channel.send({ files: files });
    } catch (error) {
        console.error(error);
    }
}
