"use client";

import { useMemo } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";

type EconRecord = Record<string, unknown>;

function parseResult(result: unknown): EconRecord[] | null {
  if (result == null) {
    return null;
  }

  let data: unknown = result;

  if (typeof result === "string") {
    try {
      data = JSON.parse(result) as unknown;
    } catch (error) {
      console.warn("Failed to parse econ data", error);
      return null;
    }
  }

  if (!Array.isArray(data)) {
    return null;
  }

  const records: EconRecord[] = [];
  for (const row of data) {
    if (row && typeof row === "object") {
      records.push(row as EconRecord);
    }
  }

  return records.length > 0 ? records : null;
}

function formatValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : String(value);
  }

  return String(value);
}

export const EconDataToolUI = makeAssistantToolUI<any, EconRecord[]>({
  toolName: "get_econ_data",
  render: ({ result, status }) => {
    const records = useMemo(() => parseResult(result), [result]);

    if (!records) {
      if (status.type === "running") {
        return (
          <div className="rounded-lg border border-border/40 bg-muted/40 p-3 text-sm text-muted-foreground">
            Fetching economic data...
          </div>
        );
      }
      return null;
    }

    const columns = Object.keys(records[0]);

    return (
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-background shadow-sm">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <thead className="bg-muted/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground"
                >
                  {column.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {records.map((row, index) => (
              <tr key={index} className="bg-background/80">
                {columns.map((column) => (
                  <td key={column} className="px-3 py-2 text-foreground">
                    {formatValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
});

