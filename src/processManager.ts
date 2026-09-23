import { sleep } from "bun";
import { renameSync } from "fs";
import logger from "./logger";

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

					logger.log('Successfully shut down runner and state server.\n--------------------');

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
		if (!shouldRestart) return;

		const isCompiled = !(Bun.argv[1]?.endsWith(".ts") || Bun.argv[1]?.endsWith(".js"));

		const args: string[] = [];

		isCompiled ? args.push(Bun.argv[0]!, '--', "--worker-mode") : args.push("bun", "run", Bun.argv[1]!, '--', "--worker-mode");

		if (shouldDeploy || Bun.argv.includes('--deploy') || process.argv.includes('--deploy')) args.push("--deploy");

		childProcess = Bun.spawn(args, {
			stdout: "inherit",
			stderr: "inherit",
		});

		const exitCode = await childProcess.exited;

		logger.log(`Bot has been shut down with code ${exitCode}.`);

		if (shouldRestart) {
			logger.log("Restarting the bot in 3 seconds...");

			await sleep(3000);

			try {
				const logFile = Bun.file("logs.txt");

				if (await logFile.exists()) {
					const envSize = Number(Bun.env.MAX_LOG_FILE_SIZE_MEGABYTES);
					const maxLogSizeMB = (envSize && !isNaN(envSize)) ? envSize : 10;

					const fileSizeBytes = logFile.size;
					const maxSizeBytes = maxLogSizeMB * 1024 * 1024;

					if (fileSizeBytes > maxSizeBytes) {
						renameSync("logs.txt", "logs_old.txt");

						await Bun.write(
							"logs.txt",
							`See old logs in logs_old.txt`
						);
					}
				}
			} catch (e) {
				logger.error(`An error has occured while managing the log file: ${e}`);
			}

			runBot();
		}
	}

	runBot();

}
