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

export type starboardMessage = Readonly<{
    originMessage: string;
    starboardMessage: string;
    amountOfReactions: number;
}>;

export type activeShift = Readonly<{
    robloxId: string;
    startedTimestamp: string;
}>;

export type loggedShift = Readonly<{
    shiftId: string;
    robloxId: string;
    startedTimestamp: string;
    endedTimestamp: string;
    lenSeconds: string;
}>;

export type personnelFull = Readonly<{
    discordId: string;
    robloxId: string;
    robloxUsername: string;
    acsdRank: string;
    credits: string;
    entryCreated: string;
    entryUpdated: string;
}>;

export type personnelPartial = Omit<personnelFull, 'credits' | 'entryCreated' | 'entryUpdated'>;
