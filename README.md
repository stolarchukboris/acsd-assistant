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

*In order to deploy commands, please open the terminal and run the executable with the `--deploy` flag.*  
*Example: `acsd-assistant-win.exe --deploy`*
