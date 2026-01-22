export type trainingInfo = Readonly<{
	trainingId: string;
	hostDiscordId: string;
	hostRobloxUsername: string;
	messageId: string;
	trainingTimestamp: string;
	isReminded: boolean;
	isStarted: boolean;
}>;

export type botSettingInfo = {
	readonly settingName: string;
	readonly settingDesc: string;
	settingValue: string;
	lastUpdatedAt: string;
	lastUpdatedBy: string;
};

export type activeShift = Readonly<{
	jobId: string;
	whMessageId: string;
	fwMessageId: string;
	robloxId: string;
	startedTimestamp: string;
}>;

export type activeMShift = Readonly<{
	shiftId: string;
	discordId: string;
	robloxId: string;
	robloxUsername: string;
	startedTimestamp: string;
}>;

export type pendingShift = Readonly<activeShift & {
	endedTimestamp: string;
	lenMinutes: number;
}>;

export type loggedShift = Readonly<{
	shiftId: string;
	robloxId: string;
	startedTimestamp: string;
	endedTimestamp: string;
	lenMinutes: number;
	proof: string;
}>;

export type personnelInfo = Readonly<{
	discordId: string;
	robloxId: string;
	robloxUsername: string;
	acsdRank: string;
	regApprovedBy: string;
	entryCreated: string;
	entryUpdated: string;
}>;

export type partialPersonnelInfo = Readonly<{
	robloxId: string;
	robloxUsername: string;
	entryCreated: string;
}>;

export type personnelCredits = Readonly<{
	robloxId: string;
	amount: number;
}>;

export type creditTransaction = Readonly<{
	transactionId: string;
	execRbxId: string;
	targetRbxId: string;
	balanceBefore: number;
	balanceAfter: number;
	reason: string;
	createdAt: string;
}>;

export type punishmentInfo = Readonly<{
	punishmentId: string;
	execRbxId: string;
	targetRbxId: string;
	punishmentType: 'warn' | 'strike';
	reason: string;
	createdAt: string;
}>;
