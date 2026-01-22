import Bot from './index.ts';

declare module '@sapphire/pieces' {
	interface Container {
		readonly commit?: InstanceType<typeof Bot>['commit'];
		readonly name: InstanceType<typeof Bot>['name'];
		readonly highRanks: InstanceType<typeof Bot>['highRanks'];
		readonly logos: InstanceType<typeof Bot>['logos'];
		readonly knex: InstanceType<typeof Bot>['knex'];
		readonly embed: InstanceType<typeof Bot>['embed'];
		readonly embeds: InstanceType<typeof Bot>['embeds'];
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		highRank: never;
	}
}

export default undefined;
