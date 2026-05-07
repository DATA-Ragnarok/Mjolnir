import React, { useState } from 'react';

type CollapsibleSectionProps = {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  count,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 border-b border-gray-200 hover:bg-gray-50 transition-colors group"
      >
        <div className="flex items-center space-x-3">
          <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
              isOpen ? 'rotate-90' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600">
            {title} <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">{count}</span>
          </h3>
        </div>
      </button>

      {isOpen && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
