import { AttachmentBuilder, MessageReaction, User, Message, TextChannel } from "discord.js";
import bot from "../index.js";
import { settingInfo, starboardMessage } from "types/knex.js";

export async function execute(messageReaction: MessageReaction) {
    try {
        if (messageReaction.partial) {
            await messageReaction.fetch();

            if (messageReaction.message.partial) await messageReaction.message.fetch();
        }

        const channelSetting = await bot.knex<settingInfo>('starboardChannelSetting')
            .select('*')
            .where('guildId', messageReaction.message.guildId)
            .first();

        if (!channelSetting) return;

        const channelId = channelSetting.settingValue as string;
        const minReactionsSetting = await bot.knex<settingInfo>('starboardReactionsMin')
            .select('*')
            .where('guildId', messageReaction.message?.guildId)
            .first();

        if (!minReactionsSetting) return;

        const minReactions = minReactionsSetting.settingValue as number;

        if (messageReaction.emoji.name === '⭐' && messageReaction.count >= minReactions && messageReaction.message.channel.id !== channelId) {
            const channel = messageReaction.client.channels.cache.get(channelId) as TextChannel;
            if (!channel.isTextBased()) return;

            const desc = typeof messageReaction.message.content === 'string' ? messageReaction.message.content : null;

            let files: AttachmentBuilder[] = [];

            messageReaction.message.attachments.each(attachment => files.push(new AttachmentBuilder(attachment.url)));

            const message = await bot.knex<starboardMessage>('starboardMessages')
                .select('*')
                .where('originMessage', `${messageReaction.message.id}`)
                .first();

            if (!message) {
                const msg = await channel.send({
                    content: `${messageReaction.message.channel.url} | ${messageReaction.count} :star:`,
                    embeds: [
                        bot.embed
                            .setColor('Yellow')
                            .setAuthor({ name: (messageReaction.message.author as User).username, iconURL: (messageReaction.message.author as User).avatarURL() as string })
                            .setDescription(`[**Jump to message**](${messageReaction.message.url})\n\n${desc}`)
                    ]
                });

                const reactSetting = await bot.knex<settingInfo>('starboardReactToOwnMsgs')
                    .select('*')
                    .where('guildId', messageReaction.message.guildId)
                    .first();

                if (reactSetting) await msg.react('⭐');

                if (files.length !== 0) await channel.send({ files: files });

                await bot.knex<starboardMessage>('starboardMessages')
                    .insert({
                        originMessage: messageReaction.message.id,
                        starboardMessage: msg.id,
                        amountOfReactions: messageReaction.count
                    });
            } else {
                await bot.knex<starboardMessage>('starboardMessages')
                    .update({ amountOfReactions: messageReaction.count })
                    .where('originMessage', messageReaction.message.id);

                const message = await bot.knex<starboardMessage>('starboardMessages')
                    .select('*')
                    .where('originMessage', messageReaction.message.id)
                    .first();

                if (!message) return;

                const msgToEdit = channel.messages.cache.get(message.starboardMessage) as Message;

                await msgToEdit.edit(`${messageReaction.message.channel.url} | ${messageReaction.count} :star:`);
            }
        }
    } catch (error) {
        console.error(error);
    }
}
