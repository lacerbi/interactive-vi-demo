// components/ui/card.js
import React from 'react';

export const Card = ({ children, className }) => (
  <div className={`rounded-lg shadow-md bg-white ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className }) => (
  <div className={`p-4 border-b ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className }) => (
  <h2 className={`text-lg font-bold ${className}`}>{children}</h2>
);

export const CardContent = ({ children, className }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);
