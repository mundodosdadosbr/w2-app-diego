import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .max(72, "Máximo 72 caracteres"),
  display_name: z
    .string()
    .min(2, "Nome muito curto")
    .max(60, "Nome muito longo")
    .optional(),
  accept_terms: z.literal(true, {
    errorMap: () => ({ message: "Você precisa aceitar os termos." }),
  }),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const resetRequestSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "As senhas não batem",
    path: ["confirm"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
