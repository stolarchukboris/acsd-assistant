A Discord bot that helps manage the [ACSD](https://www.roblox.com/communities/217658685/APOLLO-Corporation-Security-Division#!/about) security RP Roblox group.
Features shift, credit, punishment and training management commands.

# How to use
### From source code
**Requirements**: Bun, MySQL Server & MySQL Workbench

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
5. Start the bot:
   ```
   bun start
   ```

### From releases
**Requirements**: MySQL Server & MySQL Workbench
1. Download the latest [release](https://github.com/stolarchukboris/acsd-assistant/releases) for your OS and unpack it into the desired location.
2. Fill out the .env file.
3. Run the executable.

#### How to control
In order to restart or stop the bot you have to send a request to the daemon:  
- `http://127.0.0.1:3322/restart` - this will restart the bot.
- `http://127.0.0.1:3322/deploy-restart` - this will deploy commands and restart the bot.
- `http://127.0.0.1:3322/stop` - this will kill both the bot and the daemon.

*In order to deploy commands when starting the application for the first time, run the executable with the `--deploy` flag.*  
*Example: `acsd-assistant-win.exe --deploy`*
test
