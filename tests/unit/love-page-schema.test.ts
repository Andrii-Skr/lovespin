import { describe, expect, it } from "vitest";
import { lovePageDefaultValues, lovePageSchema } from "@/lib/love-page-schema";

const validPage = {
  recipientName: "Аня",
  introText: "Для тебя есть маленькое чудо.",
  complimentOne: "Твоя улыбка меняет всё вокруг.",
  complimentTwo: "С тобой каждый день становится важным.",
  prizeTitle: "Вечер для нас",
  prizeMessage: "Выбирай день, остальное я уже приготовил.",
  senderName: "Макс",
};

describe("lovePageSchema", () => {
  it("accepts a complete romantic script", () => {
    expect(lovePageSchema.safeParse(validPage).success).toBe(true);
  });

  it("trims text fields", () => {
    const result = lovePageSchema.parse({ ...validPage, recipientName: "  Аня  " });
    expect(result.recipientName).toBe("Аня");
  });

  it("rejects overly long compliments", () => {
    const result = lovePageSchema.safeParse({ ...validPage, complimentOne: "я".repeat(161) });
    expect(result.success).toBe(false);
  });

  it("provides valid default texts for a new builder page", () => {
    const result = lovePageSchema.safeParse({
      ...lovePageDefaultValues,
      recipientName: "Аня",
      senderName: "Макс",
    });

    expect(result.success).toBe(true);
    expect(lovePageDefaultValues.introText).not.toBe("");
    expect(lovePageDefaultValues.complimentOne).not.toBe("");
    expect(lovePageDefaultValues.complimentTwo).not.toBe("");
  });
});
