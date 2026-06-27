import { Glob } from "bun";

async function buildManifest() {
	console.log('Generating command and event manifest...');

	const commandGlob = new Glob("./src/commands/**/*.ts");
	const eventGlob = new Glob("./src/events/**/*.ts");

	let importsContent = `// Automatically generated. Do not edit.\n\n`;
	let commandsArrayElements = '';
	let eventsArrayElements = '';
	let counter = 0;

	for await (const file of commandGlob.scan(".")) {
		const cleanPath = file.replaceAll('\\', '/').replace("src/", "").replace(".ts", "");
		const varName = `cmd_${counter++}`;
		importsContent += `import * as ${varName} from "${cleanPath}";\n`;
		commandsArrayElements += `  { path: "${cleanPath}", module: ${varName} },\n`;
	}

	for await (const file of eventGlob.scan(".")) {
		const cleanPath = file.replaceAll('\\', '/').replace("src/", "").replace(".ts", "");
		const varName = `evt_${counter++}`;
		importsContent += `import * as ${varName} from "${cleanPath}";\n`;
		eventsArrayElements += `  { path: "${cleanPath}", module: ${varName} },\n`;
	}

	const finalContent = `${importsContent}
export const bundledCommands = [\n${commandsArrayElements}];

export const bundledEvents = [\n${eventsArrayElements}];
`;

	await Bun.write("./src/regManifest.ts", finalContent);
	console.log('Successfully generated the manifest at src/regManifest.ts');
}

buildManifest();
