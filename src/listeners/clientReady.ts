import { Listener, SapphireClient } from "@sapphire/framework";

export class ReadyListener extends Listener {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			once: true
		});
	}

	public run(client: SapphireClient) {
		const { username, id } = client.user!;

		this.container.logger.info(`Successfully logged in as ${username} (${id}).`);
	}
}
