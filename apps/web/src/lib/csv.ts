import type { SearchResultItem } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "2-digit", year: "numeric", timeZone: "UTC" });

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportItemsToCsv(items: SearchResultItem[], filename: string): void {
  const header = ["Data", "Descrição", "Valor", "Categoria", "Cartão", "Fatura", "Parcela"];
  const rows = items.map((item) => [
    dateFormatter.format(new Date(item.date)),
    item.description,
    item.amount.toFixed(2).replace(".", ","),
    item.category?.name ?? "Sem categoria",
    item.invoice.card.name,
    monthFormatter.format(new Date(item.invoice.referenceMonth)),
    item.installment ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsvField).join(",")).join("\r\n");
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
