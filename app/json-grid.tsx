"use client";

import type { ColDef, ColGroupDef } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

// One node per JSON key path seen across all rows; array elements use their index.
type PathNode = { children: Map<string, PathNode> };

function isNested(value: unknown): value is Record<string, unknown> | unknown[] {
  if (value === null || typeof value !== "object") return false;
  // Arrays of scalars stay a single cell; arrays of objects expand per index.
  if (Array.isArray(value)) return value.some((item) => item !== null && typeof item === "object");
  return Object.keys(value).length > 0;
}

function collectPaths(value: Record<string, unknown> | unknown[], node: PathNode): void {
  for (const [key, child] of Object.entries(value)) {
    // HATEOAS links repeat on every record and say nothing about the data itself.
    if (key === "links") continue;
    const nested = isNested(child);
    // Empty objects carry no data (Transaction Search returns many); empty arrays and
    // scalar arrays still render as a single cell.
    if (!nested && child !== null && typeof child === "object" && !Array.isArray(child)) continue;
    let next = node.children.get(key);
    if (!next) {
      next = { children: new Map() };
      node.children.set(key, next);
    }
    if (nested) collectPaths(child, next);
  }
}

function toColumns(node: PathNode, prefix: string): (ColDef | ColGroupDef)[] {
  return Array.from(node.children, ([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const headerName = /^\d+$/.test(key) ? `[${key}]` : key;
    return child.children.size
      ? { headerName, groupId: path, marryChildren: true, children: toColumns(child, path) }
      : { headerName, colId: path, field: path, headerTooltip: path, pinned: path === "id" ? "left" : undefined };
  });
}

function formatValue({ value }: { value: unknown }): string {
  if (value == null) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

const defaultColDef: ColDef = {
  filter: true,
  minWidth: 90,
  maxWidth: 420,
  // Show the raw API values; no type inference (e.g. booleans as checkboxes).
  cellDataType: false,
  valueFormatter: formatValue,
};

export default function JsonGrid({ rows }: { rows: object[] }) {
  const columnDefs = useMemo(() => {
    const root: PathNode = { children: new Map() };
    for (const row of rows) collectPaths(row as Record<string, unknown>, root);
    return toColumns(root, "");
  }, [rows]);

  return (
    <AgGridReact
      rowData={rows}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      autoSizeStrategy={{ type: "fitCellContents" }}
      suppressColumnVirtualisation
      domLayout="autoHeight"
      tooltipShowDelay={300}
    />
  );
}
