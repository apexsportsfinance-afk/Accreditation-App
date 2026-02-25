import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ChevronUp, ChevronDown, Search, Filter } from "lucide-react";
import { cn } from "../../lib/utils";
import Input from "./Input";

export default function DataTable({
  data = [],
  columns = [],
  searchable = true,
  searchFields = [],
  selectable = false,
  selectedRows = [],
  onSelectRows,
  onRowClick,
  emptyMessage = "No data available",
  className
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery && searchFields.length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = field.split(".").reduce((obj, key) => obj?.[key], item);
          return String(value || "").toLowerCase().includes(query);
        })
      );
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = sortConfig.key.split(".").reduce((obj, key) => obj?.[key], a);
        const bValue = sortConfig.key.split(".").reduce((obj, key) => obj?.[key], b);
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, searchFields, sortConfig]);

  const handleSelectAll = () => {
    if (selectedRows.length === filteredData.length) {
      onSelectRows?.([]);
    } else {
      onSelectRows?.(filteredData.map((item) => item.id));
    }
  };

  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      onSelectRows?.(selectedRows.filter((rowId) => rowId !== id));
    } else {
      onSelectRows?.([...selectedRows, id]);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {searchable && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-lg"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={filteredData.length > 0 && selectedRows.length === filteredData.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500/50"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-lg font-semibold text-slate-300",
                    column.sortable && "cursor-pointer select-none hover:text-white"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortConfig.key === column.key && (
                      sortConfig.direction === "asc" ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0)} 
                  className="px-4 py-12 text-center text-slate-500 text-lg"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, index) => (
                <motion.tr
                  key={row.id || index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "hover:bg-slate-800/30 transition-colors",
                    onRowClick && "cursor-pointer",
                    selectedRows.includes(row.id) && "bg-primary-500/10"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-primary-500/50"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-lg text-slate-300">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-lg text-slate-400">
        <span>
          Showing {filteredData.length} of {data.length} entries
        </span>
        {selectable && selectedRows.length > 0 && (
          <span>{selectedRows.length} selected</span>
        )}
      </div>
    </div>
  );
}
