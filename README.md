A Discord bot that helps manage the [ACSD](https://www.roblox.com/communities/217658685/APOLLO-Corporation-Security-Division#!/about) security RP Roblox group.
Features shift, credit, punishment and training management commands.

# How to use
### From source code
**Requirements**: Bun v1.3.14^, pm2 v6.0.14^, MySQL Server v8.0.31^ & MySQL Workbench v8.0.31^

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
**Requirements**: MySQL Server v8.0.31^ & MySQL Workbench v8.0.31^
1. Download the latest [release](https://github.com/stolarchukboris/acsd-assistant/releases) for your OS into the desired location.
2. In the same location create and fill out the .env file.
3. Run the executable.
