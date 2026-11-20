type UUIDv4 = `${string}-${string}-${string}-${string}-${string}`;

export type Training = Readonly<{
	training_id: UUIDv4;
	host_discord_id: string;
	host_roblox_username: string;
	message_id: string;
	starting_timestamp: number;
	is_reminded: boolean;
	is_started: boolean;
}>;

export type BotSetting = {
	readonly setting_name: string;
	readonly setting_desc: string;
	setting_value: string;
	last_updated_at: string | Date;
	last_updated_by: string;
};

export type ActiveShift = Readonly<{
	job_id: UUIDv4;
	wh_message_id: string;
	fw_message_id: string;
	roblox_id: string;
	started_timestamp: number;
}>;

export type ActiveMShift = Readonly<{
	shift_id: UUIDv4;
	discord_id: string;
	roblox_id: string;
	roblox_username: string;
	started_timestamp: string;
}>;

export type PendingShift = Readonly<ActiveShift & {
	ended_timestamp: number;
	len_minutes: number;
}>;

export type LoggedShift = Readonly<{
	shift_id: UUIDv4;
	roblox_id: string;
	started_timestamp: number;
	ended_timestamp: number;
	len_minutes: number;
	proof: string;
}>;

export type Personnel = Readonly<{
	discord_id: string;
	roblox_id: string;
	roblox_username: string;
	acsd_rank: string;
	reg_approved_by: string;
	entry_created: string;
	entry_updated: string;
	to_be_deleted_at?: number;
}>;

export type PendingReg = Readonly<{
	roblox_id: string;
	discord_id: string;
	roblox_username: string;
	challenge: string;
	entry_created: number;
}>;

export type Credits = Readonly<{
	roblox_id: string;
	amount: number;
}>;

export type CreditTransaction = Readonly<{
	transaction_id: UUIDv4;
	exec_rbx_id: string;
	target_rbx_id: string;
	balance_before: number;
	balance_after: number;
	reason: string;
	created_at: string;
}>;

export type Punishment = Readonly<{
	punishment_id: UUIDv4;
	exec_rbx_id: string;
	target_rbx_id: string;
	punishment_type: 'warn' | 'strike';
	reason: string;
	created_at: string;
}>;
