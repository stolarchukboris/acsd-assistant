import { AttachmentBuilder, ContainerBuilder, resolveColor, TextDisplayBuilder, type APIContainerComponent, type ColorResolvable } from 'discord.js';
import type botInstance from '../index';
import { join } from 'path';

type Bot = typeof botInstance;

export interface ContainerOptions {
	title: string;
	description: string;
	color?: ColorResolvable;
	thumbnailUrl?: string;
	bigImageUrl?: string;
	fields?: { name: string; value: string }[];
}

export interface ContainerPayload {
	container: APIContainerComponent;
	files: AttachmentBuilder[];
}

export function createContainerPayload(bot: Bot, options: ContainerOptions) {
	function resolveUrl(url: string) {
		if (url.trim().startsWith('http')) return url;

		files.push(new AttachmentBuilder(join(process.cwd(), url)));

		return `attachment://${url.split('/').at(-1)}`;
	}

	const files: AttachmentBuilder[] = [];

	const container = new ContainerBuilder()
		.addTextDisplayComponents(tdc => tdc.setContent(`-# ${bot.name} • ${bot.commit} • <t:${Math.floor(Date.now() / 1000)}:s>`))
		.addSeparatorComponents(sepc => sepc.setDivider(false));

	if (options.color) container.setAccentColor(resolveColor(options.color));

	const tdcs = [
		new TextDisplayBuilder().setContent(`## ${options.title}`),
		new TextDisplayBuilder().setContent(options.description)
	];

	if (options.thumbnailUrl && options.thumbnailUrl.trim() !== '') {

		container.addSectionComponents(secc => secc
			.addTextDisplayComponents(tdcs)
			.setThumbnailAccessory(ta => ta.setURL(resolveUrl(options.thumbnailUrl!)))
		);
	}
	else container.addTextDisplayComponents(tdcs);

	if (options.fields && options.fields.length > 0) for (const field of options.fields) container
		.addSeparatorComponents(sepc => sepc.setDivider(false))
		.addTextDisplayComponents(tdc => tdc.setContent(`**${field.name}**: ${field.value}`));

	if (options.bigImageUrl && options.bigImageUrl.trim() !== '')
		container.addMediaGalleryComponents(mgc => mgc.addItems(mgi => mgi.setURL(resolveUrl(options.bigImageUrl!))));

	return {
		container: container.toJSON(),
		files
	}
}

export function createTemplateContainers(bot: Bot) {
	const run = (config: { title: string; desc: string; color: ColorResolvable; logo: string }, options: Partial<ContainerOptions> = {}) => {
		return bot.createContainerPayload({
			title: options.title ?? config.title,
			description: options.description ?? config.desc,
			color: options.color ?? config.color,
			thumbnailUrl: options.thumbnailUrl ?? config.logo,
			fields: options.fields
		});
	}

	return {
		accessDenied: (options?: Partial<ContainerOptions>) => run({ title: 'Access denied.', desc: 'You are not authorized to access this.', color: 'Red', logo: bot.logos.cross }, options),
		error: (options?: Partial<ContainerOptions>) => run({ title: 'Error.', desc: 'An error has occurred.', color: 'Red', logo: bot.logos.cross }, options),
		warning: (options?: Partial<ContainerOptions>) => run({ title: 'Warning.', desc: 'Action has been performed with a warning.', color: 'Yellow', logo: bot.logos.warning }, options),
		success: (options?: Partial<ContainerOptions>) => run({ title: 'Success.', desc: 'Successfully performed the action.', color: 'Green', logo: bot.logos.checkmark }, options),
		cancel: (options?: Partial<ContainerOptions>) => run({ title: 'Cancelled.', desc: 'Action is cancelled.', color: 'Grey', logo: bot.logos.trashbin }, options),
		notFound: (options?: Partial<ContainerOptions>) => run({ title: 'Not found.', desc: 'Requested resource is not found.', color: 'Grey', logo: bot.logos.placeholder }, options)
	}
}
