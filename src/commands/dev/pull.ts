import { ChatInputCommandInteraction, SlashCommandSubcommandBuilder } from 'discord.js';
import { spawn } from 'node:child_process';
import bot from '../../index.js';

export const data = new SlashCommandSubcommandBuilder()
    .setName('pull')
    .setDescription('[DEV] Pull latest changes from Git Main.');
export const dev = true;

export async function execute(interaction: ChatInputCommandInteraction) {
    const { stdout, stderr } = spawn('git pull', { shell: true, windowsHide: true });

    stderr.on('data', async data => {
        console.log(`stderr: ${data}`);

        await interaction.followUp({
            embeds: [
                bot.embed
                    .setColor('Red')
                    .setTitle('stderr')
                    .setDescription('Standard error contents.')
                    .setFields({ name: 'Output', value: `\`\`\`\n${data}\`\`\`` })
            ]
        });
    });

    stdout.on('data', async data => {
        console.log(`stdout: ${data}`);

        await interaction.editReply({
            embeds: [
                bot.embed
                    .setColor('Blurple')
                    .setTitle('Pull operation.')
                    .setDescription('Pulling from Git, watch output for results...')
                    .setFields({ name: 'Output', value: `\`\`\`\n${data}\`\`\`` })
            ]
        });
    });
}
