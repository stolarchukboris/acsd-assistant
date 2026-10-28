import logger from "./utils/logger.ts";

if (Bun.argv.includes("--worker-mode") || process.argv.includes('--worker-mode')) await import('./index.ts');
else {
	let childProcess: ReturnType<typeof Bun.spawn> | null = null;
	let [shouldRestart, shouldDeploy] = [true, false];

	Bun.serve({
		port: 3322,
		hostname: "127.0.0.1",
		reusePort: true,

		async fetch(req) {
			const url = new URL(req.url);

			if (url.pathname === "/stop") {
				shouldRestart = false;
				shouldDeploy = false;

				if (childProcess) childProcess.kill();

				setTimeout(async _ => {
					await this.stop(true);

					logger.log('Successfully shut down runner and orchestrator.\n--------------------');

					process.exit(0);
				}, 500);

				return new Response("Successfully sent the full shutdown request.");
			} else if (url.pathname === "/restart") {
				shouldRestart = true;
				shouldDeploy = false;

				if (childProcess) childProcess.kill();

				return new Response("Successfully sent the bot restart request.");
			} else if (url.pathname === '/deploy-restart') {
				shouldRestart = true;
				shouldDeploy = true;

				if (childProcess) childProcess.kill();

				return new Response('Successfully sent the deploy and restart request.')
			}

			return new Response("Unknown request.", { status: 404 });
		}
	});

	async function runBot() {
		let isFirstStart = true;
		while (shouldRestart) {
			const isCompiled = !Bun.argv[1] || !(Bun.argv[1].endsWith(".ts") || Bun.argv[1].endsWith(".js"));

			const args: string[] = [];

			isCompiled ? args.push(process.execPath, '--', "--worker-mode") : args.push("bun", "run", Bun.argv[1]!, '--', "--worker-mode");

			if (shouldDeploy || (isFirstStart && (Bun.argv.includes('--deploy') || process.argv.includes('--deploy')))) {
				args.push("--deploy");

				shouldDeploy = false;
			}

			isFirstStart = false;

			childProcess = Bun.spawn(args, {
				stdout: "inherit",
				stderr: "inherit",
			});

			const exitCode = await childProcess.exited;

			logger.log(`Bot has been shut down with code ${exitCode}.`);

			if (!shouldRestart) break;

			logger.log("Restarting the bot in 3 seconds...");

			await Bun.sleep(3000);
		}
	}

	runBot();
}
