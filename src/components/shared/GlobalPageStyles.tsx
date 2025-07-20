
'use client';

import type { CSSProperties } from 'react';

// Define a type for the animation styles object if needed, though for simple keyframes it might be overkill.
// For direct use in <style jsx global>, explicit typing isn't strictly required for the CSS content itself.

export default function GlobalPageStyles() {
  return (
    <style jsx global>{`
      @keyframes slideInUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      .animate-slideInUp {
        animation: slideInUp 0.6s ease-out forwards;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .animate-fadeIn {
        animation: fadeIn 0.8s ease-out forwards;
      }

      .animation-delay-200 {
        animation-delay: 0.2s;
      }
      .animation-delay-400 {
        animation-delay: 0.4s;
      }
    `}</style>
  );
}
