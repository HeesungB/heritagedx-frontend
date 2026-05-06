"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStores } from "@/stores";
import { useCustomers } from "@heritage-dx/store";
import type { CustomerEntity } from "@heritage-dx/store";
import { Input } from "@heritage-dx/ui";

export interface CustomerSelection {
  customerId: string | null;
  name: string;
  contact: string;
}

interface CustomerAutocompleteProps {
  value: CustomerSelection;
  onChange: (next: CustomerSelection) => void;
  disabled?: boolean;
}

export default function CustomerAutocomplete({
  value,
  onChange,
  disabled,
}: CustomerAutocompleteProps) {
  const { customer: customerStore } = useAppStores();
  const { searchByQuery } = useCustomers(customerStore);

  const [nameQuery, setNameQuery] = useState(value.name);
  const [contactQuery, setContactQuery] = useState(value.contact);
  const [results, setResults] = useState<CustomerEntity[]>([]);
  const [activeField, setActiveField] = useState<"name" | "contact" | null>(null);
  const [searching, setSearching] = useState(false);

  const skipSearchRef = useRef(false);

  useEffect(() => {
    setNameQuery(value.name);
    setContactQuery(value.contact);
  }, [value.name, value.contact]);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (!activeField) return;
    const query = activeField === "name" ? nameQuery : contactQuery;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const list = await searchByQuery(trimmed, 8);
      setResults(list);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [nameQuery, contactQuery, activeField, searchByQuery]);

  const handleSelect = (customer: CustomerEntity) => {
    skipSearchRef.current = true;
    setResults([]);
    setActiveField(null);
    onChange({
      customerId: customer.id,
      name: customer.name,
      contact: customer.contact,
    });
  };

  const handleNameChange = (next: string) => {
    setNameQuery(next);
    onChange({ customerId: null, name: next, contact: value.contact });
  };

  const handleContactChange = (next: string) => {
    setContactQuery(next);
    onChange({ customerId: null, name: value.name, contact: next });
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-[12.5px] font-semibold text-[#3f3f46]">
            고객명
            <span className="text-[#DC2626]">*</span>
          </label>
          <Input
            value={nameQuery}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => setActiveField("name")}
            onBlur={() => setTimeout(() => setActiveField((f) => (f === "name" ? null : f)), 150)}
            placeholder="고객명 입력 (2자 이상 검색)"
            disabled={disabled}
            autoComplete="off"
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-1 text-[12.5px] font-semibold text-[#3f3f46]">
            연락처
            <span className="text-[#DC2626]">*</span>
          </label>
          <Input
            value={contactQuery}
            onChange={(e) => handleContactChange(e.target.value)}
            onFocus={() => setActiveField("contact")}
            onBlur={() => setTimeout(() => setActiveField((f) => (f === "contact" ? null : f)), 150)}
            placeholder="010-1234-5678"
            disabled={disabled}
            autoComplete="off"
          />
        </div>
      </div>

      {activeField && (searching || results.length > 0) && (
        <div className="absolute left-0 right-0 -bottom-2 translate-y-full z-20 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {searching && (
            <div className="px-3 py-2 text-xs text-gray-400">검색 중...</div>
          )}
          {!searching && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">
              일치하는 고객이 없습니다. 저장 시 새 고객으로 등록됩니다.
            </div>
          )}
          {results.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(customer)}
              className="block w-full text-left px-3 py-2 hover:bg-emerald-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 text-sm">
                  {customer.name}
                </span>
                <span className="text-xs text-gray-500">{customer.contact}</span>
              </div>
              {customer.memo && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {customer.memo}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {value.customerId && (
        <p className="mt-2 text-xs text-emerald-600">
          ✓ 등록된 고객이 선택되었습니다.
        </p>
      )}
    </div>
  );
}
