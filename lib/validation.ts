import { z } from "zod";
export const registerSchema=z.object({
 name:z.string().trim().min(2).max(80),
 email:z.string().trim().email().max(160),
 password:z.string().min(10).max(128)
});
export const loginSchema=z.object({email:z.string().email(),password:z.string().min(1)});
export const alertSchema=z.object({
 type:z.enum(["MISSING_PERSON","LOST_ITEM","LOST_DOCUMENT","DANGEROUS_SITUATION","LOST_ANIMAL","OTHER"]),
 title:z.string().trim().min(5).max(140),
 description:z.string().trim().min(10).max(5000),
 city:z.string().trim().max(100).optional(),
 region:z.string().trim().max(100).optional(),
 lat:z.coerce.number().min(-90).max(90).optional(),
 lng:z.coerce.number().min(-180).max(180).optional(),
 personName:z.string().trim().max(120).optional(),
 personAge:z.coerce.number().int().min(0).max(120).optional(),
 personSex:z.enum(["M","F","AUTRE"]).optional(),
 distinguishingMarks:z.string().trim().max(500).optional(),
 visibility:z.enum(["PUBLIC","LIMITED","PRIVATE","ANONYMOUS"]).default("PUBLIC"),
 dateOccurred:z.string().optional()
});

export const contributionSchema=z.object({
 message:z.string().trim().min(10).max(2000)
});

export const moderationSchema=z.object({
 action:z.enum(["APPROVE","REJECT"]),
 note:z.string().trim().max(500).optional()
});
