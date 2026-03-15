import { z } from "zod";

export const mediaMetadataSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(8),
  collectionId: z.string().min(1),
  categoryId: z.string().min(1),
  dateOfMemory: z.string().min(1),
});
