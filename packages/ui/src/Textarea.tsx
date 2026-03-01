"use client";

import {
  TextareaHTMLAttributes,
  forwardRef,
  useEffect,
  useRef,
  useCallback,
} from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  minRows?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className = "", label, error, helperText, id, minRows = 2, onChange, ...props },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const adjustHeight = useCallback(
      (el: HTMLTextAreaElement) => {
        el.style.height = "auto";
        const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
        const minHeight = lineHeight * minRows + 16;
        el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
      },
      [minRows]
    );

    useEffect(() => {
      if (internalRef.current) {
        adjustHeight(internalRef.current);
      }
    });

    const handleRef = (el: HTMLTextAreaElement | null) => {
      internalRef.current = el;
      if (typeof ref === "function") {
        ref(el);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight(e.target);
      onChange?.(e);
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={handleRef}
          id={inputId}
          rows={minRows}
          onChange={handleChange}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm
            transition-colors resize-none
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? "border-error focus:ring-error" : "border-gray-300"}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-error">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;
