An advanced distributed enterprise ERP system for personnel and event management.

Tech stack:  
- **Bun**, a lightning-fast package manager, runtime and bundler all-in-one;
- **TypeScript**, a superset of JS for ensuring the type safety throughout the project;
- **Discord.js**, a performant Discord API library, full coverage;
- **knex**, a convenient query builder with opt-in type safety;
- **RoZod**, a type-safe library for interacting with external API (Roblox). Handles errors and rate-limiting;
- **Zod**, a powerful data validation library;
- **ms**, a lightweight library for duration formatting.


# How to use
### From source code
**Requirements**: Bun, PostgreSQL

1. Clone the repository:
   ```
   git clone https://github.com/stolarchukboris/acsd-assistant.git
   ```
2. Install dependencies:
   ```
   bun i
   ```
3. Copy the environmental variables .env file:
   ```
   cp .env.example .env
   ```
4. Fill out the .env file.
5. Start the daemon:
   ```
   bun deploy-start
   ```

### From releases
**Requirements**: PostgreSQL
1. Download the latest [release](https://github.com/stolarchukboris/acsd-assistant/releases) for your OS and unpack it into the desired location.
2. Fill out the .env file.
3. Run the executable to start the daemon.

### Post-startup
1. You will now have to **set up** the bot so it functions fully.  
  - If you happen to have a `settings_backup.json` file exactly with this bot's settings, you can use the `/globalsettings import` command and get going immediately.
  - Otherwise there are `/globalsettings view` and `/globalsettings update` commands you can use to view the list of available settings and assign values to them.
2. **Verify** to get access to most of the systems. Run `/verify` and complete the flow.  
  - Rank will be issued automatically based on your roles.


#### How to control
In order to restart or stop the bot you have to send a request to the daemon (orchestrator):  
- `http://localhost:3322/r` - this will restart the bot;
- `http://localhost:3322/dr` - this will deploy commands and restart the bot;
- `http://localhost:3322/s` - this will kill both the bot and the daemon;
- `http://localhost:3322/pr` - this will pull the latest changes from Git and restart the bot;
- `http://localhost:3322/pdr` - this will perform the whole refresh cycle: pull from Git - deploy to Discord API - restart the bot;

You can also make these requests from another device in LAN. Make sure that you know the host machine's local IP (preferrably it should have a constant, reserved address) and that its 3322 port is open.
> [!CAUTION]
> The above endpoints have no authorization. Do not expose the port 3322 to global network.

*In order to deploy commands when starting the application for the first time, run the executable with the `--deploy` flag.*  
*Example: `acsd-assistant-win.exe --deploy`*
