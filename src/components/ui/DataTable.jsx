import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { cn } from "../../lib/utils";

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/70 border border-cyan-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-lg"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-cyan-800/40 shadow-lg shadow-black/30">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-800/90 via-slate-800/80 to-slate-800/90 border-b border-cyan-700/40">
              {selectable && (
                <th className="w-12 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={filteredData.length > 0 && selectedRows.length === filteredData.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-500/50"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3.5 text-left text-lg font-bold text-cyan-300 tracking-wide uppercase",
                    column.sortable && "cursor-pointer select-none hover:text-white transition-colors"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortConfig.key === column.key && (
                      sortConfig.direction === "asc" ?
                        <ChevronUp className="w-4 h-4 text-cyan-400" /> :
                        <ChevronDown className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-slate-400 text-lg"
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
                    "bg-slate-900/40 hover:bg-slate-700/50 transition-all duration-200",
                    onRowClick && "cursor-pointer",
                    selectedRows.includes(row.id) && "bg-cyan-500/10 border-l-2 border-l-cyan-500"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="w-12 px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                        className="w-4 h-4 rounded border-slate-500 bg-slate-700 text-cyan-500 focus:ring-cyan-500/50"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3.5 text-lg text-slate-100">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-lg text-slate-300">
        <span>Showing {filteredData.length} of {data.length} entries</span>
        {selectable && selectedRows.length > 0 && (
          <span className="text-cyan-400 font-medium">{selectedRows.length} selected</span>
        )}
      </div>
    </div>
  );
}
