import z from "zod";

const settingSchema = z.object({
	setting_name: z.string().max(30).nonempty(),
	setting_desc: z.string().nonempty(),
	setting_value: z.string().max(20).nonempty(),
	updated_at: z.coerce.date<string>(),
	updated_by: z.string().max(20).nonempty()
});

export const settingGroupSchema = z.array(settingSchema);
