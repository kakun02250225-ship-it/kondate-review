import type { Metadata } from "next";
import MealMateApp from "../src/App";

export const metadata: Metadata = {
  title: "大学生のための献立サポート",
  description:
    "忙しい大学生の献立づくり、買い物、調理を固定データで体験できるユーザーレビュー用プロトタイプです。",
};

export default function Home() {
  return <MealMateApp />;
}
