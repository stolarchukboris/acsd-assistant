import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import bot from '../index.ts';

export const data = new SlashCommandBuilder()
	.setName('help')
	.setDescription('Learn more about this bot\'s commands and features.')
	.addStringOption(o => o
		.setName('topic')
		.setDescription('The topic you want to learn more about.')
		.setChoices(
			{ name: 'Registration commands.', value: 'reg' },
			{ name: 'Personnel commands.', value: 'pers' },
			{ name: 'Shift commands.', value: 'shift' }
		)
		.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply({ flags: 'Ephemeral' });

	const selectedTopic = interaction.options.getString('topic', true);
	const cmds = await bot.application?.commands.fetch();
	const cmdIds: Record<string, string> = {};

	cmds!.forEach(cmd => cmdIds[cmd.name] = cmd.id);

	const topics = {
		'reg': `**Registration-related commands**:
- </registrations start:${cmdIds['registrations']}>
  - **Options**:
    - \`roblox_username\` (required, string).
  - **Usage**: Use this command to register in the ACSD database.
    1. Input the username of a Roblox account you are registering with.
    2. Verify the bot has found a correct account.
    3. Upon clicking "Confirm" the ACSD administration will be prompted to double-check your registration request.
    4. If they confirm the request you will be registered in the ACSD database and the bot will DM you about that.
- </registrations cancel:${cmdIds['registrations']}>
  - **Usage**: Use this command to cancel the registration request you have submitted.`,

		'pers': `**Personnel-related commands**:
- </personnel stats:${cmdIds['personnel']}>
  - **Options**:
    - \`server_member\` (optional, ACSD server member);
    - \`roblox_username\` (optional, string);
    - \`hidden\` (optional, boolean, default: TRUE).
  - **Usage**: Use this command to view user\'s ACSD stats.
    - If \`hidden\` is True (which it is by default), only you will be able to view the command output.
    - If \`server_member\` and \`roblox_username\` options are omitted, this will display **all** of your stats: account info, credits, shift time, latest shift and punishments.
    - Otherwise, this will **not** display the punishment stats (unless you are a high-ranking ACSD member or you selected yourself).`,

		'shift': `**Shift-related commands**:
- </shift start:${cmdIds['shift']}>
  - **Usage**: Use this command to manually start logging your shift.
- </shift end:${cmdIds['shift']}>
  - **Options** (one must be provided):
    - \`proof_image\` (optional, attachment (only accepts image files));
    - \`proof_url\` (optional, string (use this if you store your screenshots online)).
  - **Usage**: Use this command to manually end your shift log.
    - **Warning: This encompasses both automatic and manual shift logs.**
    - Notice: Your shift can only be saved if it's longer than 5 minutes. If it's not, you will be asked to cancel it or continue playing.
- </shift cancel:${cmdIds['shift']}>
  - **Usage**: Use this command to manually cancel and delete your shift log.
    - **Warning: This encompasses both automatic and manual shift logs.**`
	} as const;

	await interaction.editReply({
		embeds: [
			bot.embed
				.setColor('Blurple')
				.setTitle('ACSD Assistant help.')
				.setDescription(topics[selectedTopic as keyof typeof topics])
		]
	});
}
