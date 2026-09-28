import { z } from "zod";

const romanticLine = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(2, `${label}: напишите хотя бы 2 символа`)
    .max(max, `${label}: не больше ${max} символов`);

export const lovePageSchema = z.object({
  recipientName: romanticLine("Имя", 50),
  introText: romanticLine("Вступление", 160),
  complimentOne: romanticLine("Первый комплимент", 160),
  complimentTwo: romanticLine("Второй комплимент", 160),
  prizeTitle: romanticLine("Название приза", 80),
  prizeMessage: romanticLine("Описание приза", 240),
  senderName: romanticLine("Подпись", 50),
});

export const photoCropSchema = z.object({
  x: z.coerce.number().min(0).max(1),
  y: z.coerce.number().min(0).max(1),
  zoom: z.coerce.number().min(0.75).max(2.4),
});

export type LovePageInput = z.infer<typeof lovePageSchema>;

export const lovePageDefaultValues = {
  recipientName: "",
  introText: "Я приготовил для тебя маленькую историю, в которой всё хорошее обязательно сбывается.",
  complimentOne: "Твоя улыбка умеет превращать самый обычный день в любимое воспоминание.",
  complimentTwo: "Рядом с тобой хочется становиться лучше — и никогда не торопить время.",
  prizeTitle: "Вечер только для нас",
  prizeMessage: "Место держу в секрете. Тебе остаётся выбрать день и взять меня за руку.",
  senderName: "",
} satisfies LovePageInput;

export type LovePage = LovePageInput & {
  slug: string;
  expiresAt: string;
};
