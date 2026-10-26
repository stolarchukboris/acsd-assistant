import { AttachmentBuilder, ChatInputCommandInteraction, ContainerBuilder, SlashCommandBuilder } from 'discord.js';
import { join } from 'path';

export const data = new SlashCommandBuilder()
	.setName('test')
	.setDescription('cv2 container test.');

export async function execute(interaction: ChatInputCommandInteraction<'cached'>) {
	await interaction.deferReply();

	console.log(process.cwd());

	await interaction.editReply({
		flags: 'IsComponentsV2',
		components: [
			new ContainerBuilder()
				.addSectionComponents(sc => sc
					.addTextDisplayComponents(tdc => tdc.setContent('geh'))
					.setThumbnailAccessory(ta => ta.setURL('attachment://checkmark.png'))
				)
		],
		files: [new AttachmentBuilder(join(process.cwd(), 'static/checkmark.png'))]
	})
}
