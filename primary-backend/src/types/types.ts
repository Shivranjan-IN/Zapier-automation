import { z } from "zod";

export const SignupSchema = z.object({
    username: z.string().min(5),
    password: z.string().min(6),
    name: z.string().min(2)
});
export const SigninSchema = z.object({
    username: z.string().min(5),
    password: z.string().min(6),
});
export const ZapCreateSchema = z
    .object({
        availableTriggerId: z.string().optional(),
        triggerMetadata: z.any().optional(),
        triggers: z
            .array(
                z.object({
                    availableTriggerId: z.string(),
                    triggerMetadata: z.any().optional()
                })
            )
            .optional(),
        actions: z.array(
            z.object({
                availableActionId: z.string(),
                actionMetadata: z.any().optional()
            })
        )
    })
    .refine(
        data => Boolean(data.availableTriggerId) || (data.triggers?.length ?? 0) > 0,
        { message: "At least one trigger is required" }
    );
