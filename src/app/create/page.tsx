import type { Metadata } from "next";
import { Builder } from "@/components/builder/builder";

export const metadata: Metadata = {
  title: "Создать романтическую историю",
  description: "Соберите персональную открытку с тремя счастливыми вращениями.",
};

export default function CreatePage() {
  return <Builder />;
}
