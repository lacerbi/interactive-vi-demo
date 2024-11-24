import React from 'react';

export const Button = ({ children, onClick, className, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);
