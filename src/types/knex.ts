type uuidv4 = `${string}-${string}-${string}-${string}-${string}`;

export type trainingInfo = Readonly<{
	trainingId: uuidv4;
	hostDiscordId: string;
	hostRobloxUsername: string;
	messageId: string;
	startingTimestamp: number;
	isReminded: boolean;
	isStarted: boolean;
}>;

export type botSettingInfo = {
	readonly settingName: string;
	readonly settingDesc: string;
	settingValue: string;
	lastUpdatedAt: string | Date;
	lastUpdatedBy: string;
};

export type activeShift = Readonly<{
	jobId: uuidv4;
	whMessageId: string;
	fwMessageId: string;
	robloxId: string;
	startedTimestamp: number;
}>;

export type activeMShift = Readonly<{
	shiftId: uuidv4;
	discordId: string;
	robloxId: string;
	robloxUsername: string;
	startedTimestamp: string;
}>;

export type pendingShift = Readonly<activeShift & {
	endedTimestamp: number;
	lenMinutes: number;
}>;

export type loggedShift = Readonly<{
	shiftId: uuidv4;
	robloxId: string;
	startedTimestamp: number;
	endedTimestamp: number;
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
	transactionId: uuidv4;
	execRbxId: string;
	targetRbxId: string;
	balanceBefore: number;
	balanceAfter: number;
	reason: string;
	createdAt: string;
}>;

export type punishmentInfo = Readonly<{
	punishmentId: uuidv4;
	execRbxId: string;
	targetRbxId: string;
	punishmentType: 'warn' | 'strike';
	reason: string;
	createdAt: string;
}>;
