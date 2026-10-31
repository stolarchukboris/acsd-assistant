import { $ } from 'bun';
import logger from './utils/logger';

const server = Bun.serve({
    port: 9876,

    async fetch(req) {
        const url = new URL(req.url);

        if (req.method === "POST" && url.pathname === "/webhook") {
            logger.log('Git push triggered.');

            try {
                await $`cd ~/projects/acsd-assistant`;
                await $`git pull`;
                await $`bun i`;

                await $`curl http://127.0.0.1:3322/restart`;

                logger.log('Deploy successful.');

                return new Response(JSON.stringify({ success: true }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                });
            } catch (error) {
                logger.error("Deploy error:", error);

                return new Response("Deploy failed.", { status: 500 });
            }
        }

        return new Response("Not found.", { status: 404 });
    }
});

logger.log(`Webhook receiver listening on port ${server.port}.`);
