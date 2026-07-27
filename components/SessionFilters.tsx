"use client";

import type { FilterParams } from "@/types";

interface SessionFiltersProps {
  students: string[];
  currentFilters: FilterParams;
  onChange: (filters: FilterParams) => void;
}

export default function SessionFilters({
  students,
  currentFilters,
  onChange,
}: SessionFiltersProps) {
  function handleStudentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ...currentFilters, student: e.target.value || undefined });
  }

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...currentFilters, from: e.target.value || undefined });
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ ...currentFilters, to: e.target.value || undefined });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
      {/* Student filter */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="filter-student"
          className="text-sm font-medium text-gray-700"
        >
          Student
        </label>
        <select
          id="filter-student"
          value={currentFilters.student ?? ""}
          onChange={handleStudentChange}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All students</option>
          {students.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* From date */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="filter-from"
          className="text-sm font-medium text-gray-700"
        >
          From
        </label>
        <input
          id="filter-from"
          type="date"
          value={currentFilters.from ?? ""}
          onChange={handleFromChange}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* To date */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="filter-to"
          className="text-sm font-medium text-gray-700"
        >
          To
        </label>
        <input
          id="filter-to"
          type="date"
          value={currentFilters.to ?? ""}
          onChange={handleToChange}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
