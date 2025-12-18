export type eventInfo = Readonly<{
    eventId: string;
    guildId: string;
    eventHost: string;
    annsMessageId: string;
    eventGameUrl: string;
    eventGameName: string;
    gameThumbnailUrl: string;
    eventStatus: number;
    eventTime: number;
    reminded: boolean;
}>;

export type settingInfo = Readonly<{
    guildId: string;
    settingValue: string | number | boolean;
}>;

export type activeShift = Readonly<{
    jobId: string;
    whMessageId: string;
    fwMessageId: string;
    robloxId: string;
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
