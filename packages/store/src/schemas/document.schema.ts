import { z } from "zod";

export const documentSchema = z.object({
  name: z.string().min(1, "서류명을 입력하세요"),
  fileDescription: z.string().optional(),
});

export type DocumentFormValues = z.infer<typeof documentSchema>;
