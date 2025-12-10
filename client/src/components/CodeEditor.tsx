import { useState, useRef, useEffect } from 'react';
import { Code2 } from 'lucide-react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: string;
  rows?: number;
}

export function CodeEditor({ 
  value, 
  onChange, 
  placeholder = 'Enter code or text...',
  language = 'plaintext',
  rows = 12 
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <Code2 className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">Job Responsibilities & Duties</span>
        {language !== 'plaintext' && (
          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
            {language}
          </span>
        )}
      </div>
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 font-mono text-sm bg-slate-50 focus:bg-white focus:outline-none resize-y border-0"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
            lineHeight: '1.6',
          }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">
        Describe the employee's responsibilities, duties, and what they will do in the company
      </p>
    </div>
  );
}

