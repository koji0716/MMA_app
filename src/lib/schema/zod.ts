import { z } from "zod";

export const sessionTypeEnum = z.enum(["striking", "wrestling", "grappling", "tactics"]);

export const zSessionQuick = z.object({
  date: z.string().min(1, "date is required"),
  startTime: z.string().optional(),
  type: sessionTypeEnum,
  durationMin: z
    .number({ invalid_type_error: "duration must be a number" })
    .int()
    .positive("duration must be positive"),
  tags: z.array(z.string()).max(3).optional().default([]),
  memo: z.string().optional(),
});

export type SessionQuick = z.infer<typeof zSessionQuick>;
