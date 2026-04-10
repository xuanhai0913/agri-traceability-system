/**
 * Custom SVG illustrations for empty states across the app.
 * Themed with AgriTrace emerald green palette.
 */

// ── No Batches / Empty Ledger ─────────────────────────
export function EmptyBoxIllustration({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground shadow */}
      <ellipse cx="100" cy="168" rx="70" ry="8" fill="#e2e8f0" opacity="0.5" />

      {/* Box body */}
      <path d="M50 70 L100 45 L150 70 L150 130 L100 155 L50 130Z" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
      <path d="M100 45 L150 70 L150 130 L100 155Z" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5" />
      <path d="M50 70 L100 95 L100 155 L50 130Z" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />

      {/* Box lid */}
      <path d="M40 62 L100 35 L160 62 L100 89Z" fill="#bbf7d0" stroke="#4ade80" strokeWidth="1.5" />
      <path d="M100 35 L160 62 L100 89Z" fill="#86efac" stroke="#4ade80" strokeWidth="1.5" />

      {/* Dotted line on box */}
      <line x1="75" y1="110" x2="100" y2="122" stroke="#86efac" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="105" y1="100" x2="130" y2="112" stroke="#86efac" strokeWidth="1" strokeDasharray="4 3" />

      {/* Sparkles */}
      <circle cx="38" cy="52" r="2" fill="#4ade80" opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="162" cy="50" r="1.5" fill="#34d399" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="145" cy="38" r="2" fill="#6ee7b7" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Small leaf */}
      <g transform="translate(155, 42) rotate(-20)">
        <path d="M0 0 C5 -8, 15 -10, 18 -4 C15 -2, 5 0, 0 0Z" fill="#4ade80" opacity="0.7" />
        <line x1="0" y1="0" x2="14" y2="-5" stroke="#16a34a" strokeWidth="0.5" opacity="0.5" />
      </g>
    </svg>
  );
}

// ── No Search Results ─────────────────────────────────
export function NoResultsIllustration({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground */}
      <ellipse cx="100" cy="165" rx="65" ry="7" fill="#e2e8f0" opacity="0.4" />

      {/* Magnifying glass */}
      <circle cx="90" cy="80" r="35" stroke="#86efac" strokeWidth="3" fill="#f0fdf4" />
      <circle cx="90" cy="80" r="28" stroke="#bbf7d0" strokeWidth="1" fill="none" strokeDasharray="4 3" />
      <line x1="116" y1="106" x2="145" y2="140" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />

      {/* Question mark inside */}
      <text x="82" y="90" fontSize="28" fontWeight="bold" fill="#86efac" fontFamily="sans-serif" opacity="0.6">?</text>

      {/* Small leaves scattered */}
      <g transform="translate(40, 55) rotate(-30)">
        <path d="M0 0 C3 -5, 10 -6, 12 -2 C10 -1, 3 0, 0 0Z" fill="#4ade80" opacity="0.5" />
      </g>
      <g transform="translate(150, 65) rotate(15)">
        <path d="M0 0 C3 -5, 10 -6, 12 -2 C10 -1, 3 0, 0 0Z" fill="#6ee7b7" opacity="0.4" />
      </g>

      {/* Sparkles */}
      <circle cx="55" cy="45" r="1.5" fill="#4ade80" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="140" cy="50" r="2" fill="#34d399" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ── Seedling / Growth (for Dashboard empty state) ─────
export function SeedlingIllustration({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Soil mound */}
      <ellipse cx="100" cy="155" rx="60" ry="12" fill="#d1fae5" />
      <ellipse cx="100" cy="155" rx="45" ry="8" fill="#a7f3d0" />

      {/* Stem */}
      <path d="M100 155 C100 130, 95 120, 100 95" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Left leaf */}
      <g transform="translate(100, 115)">
        <path d="M0 0 C-15 -5, -25 -15, -20 -25 C-10 -20, -2 -10, 0 0Z" fill="#4ade80" />
        <path d="M0 0 C-10 -8, -18 -18, -20 -25" stroke="#16a34a" strokeWidth="0.8" fill="none" opacity="0.5" />
      </g>

      {/* Right leaf */}
      <g transform="translate(100, 100)">
        <path d="M0 0 C15 -8, 28 -12, 25 -22 C15 -18, 5 -8, 0 0Z" fill="#34d399" />
        <path d="M0 0 C12 -10, 22 -16, 25 -22" stroke="#16a34a" strokeWidth="0.8" fill="none" opacity="0.5" />
      </g>

      {/* Top leaf bud */}
      <g transform="translate(100, 95)">
        <path d="M0 0 C-5 -12, 0 -22, 8 -18 C6 -10, 2 -4, 0 0Z" fill="#22c55e" />
        <path d="M0 0 C5 -12, 0 -22, -8 -18 C-6 -10, -2 -4, 0 0Z" fill="#4ade80" />
      </g>

      {/* Sparkles / dew drops */}
      <circle cx="75" cy="105" r="2" fill="#4ade80" opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
        <animate attributeName="r" values="2;2.5;2" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="130" cy="90" r="1.5" fill="#34d399" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="112" cy="70" r="1.8" fill="#6ee7b7" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.9;0.4" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Blockchain chain dots */}
      <circle cx="55" cy="60" r="4" fill="none" stroke="#86efac" strokeWidth="1" />
      <circle cx="55" cy="60" r="1.5" fill="#86efac" />
      <line x1="59" y1="60" x2="65" y2="60" stroke="#86efac" strokeWidth="1" />
      <circle cx="69" cy="60" r="4" fill="none" stroke="#86efac" strokeWidth="1" />
      <circle cx="69" cy="60" r="1.5" fill="#86efac" />

      <circle cx="135" cy="55" r="4" fill="none" stroke="#86efac" strokeWidth="1" opacity="0.6" />
      <circle cx="135" cy="55" r="1.5" fill="#86efac" opacity="0.6" />
      <line x1="139" y1="55" x2="145" y2="55" stroke="#86efac" strokeWidth="1" opacity="0.6" />
      <circle cx="149" cy="55" r="4" fill="none" stroke="#86efac" strokeWidth="1" opacity="0.6" />
      <circle cx="149" cy="55" r="1.5" fill="#86efac" opacity="0.6" />
    </svg>
  );
}

// ── Empty Inventory / No Products ─────────────────────
export function EmptyInventoryIllustration({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Ground */}
      <ellipse cx="100" cy="162" rx="70" ry="8" fill="#e2e8f0" opacity="0.4" />

      {/* Shelf */}
      <rect x="35" y="65" width="130" height="6" rx="2" fill="#d1fae5" stroke="#86efac" strokeWidth="1" />
      <rect x="35" y="110" width="130" height="6" rx="2" fill="#d1fae5" stroke="#86efac" strokeWidth="1" />

      {/* Shelf legs */}
      <line x1="40" y1="65" x2="40" y2="155" stroke="#86efac" strokeWidth="2" />
      <line x1="160" y1="65" x2="160" y2="155" stroke="#86efac" strokeWidth="2" />

      {/* Small items on shelf - top */}
      <rect x="55" y="50" width="18" height="15" rx="3" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />
      <rect x="80" y="45" width="14" height="20" rx="3" fill="#dcfce7" stroke="#86efac" strokeWidth="1" />

      {/* Small items on shelf - bottom */}
      <rect x="120" y="95" width="20" height="15" rx="3" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1" />

      {/* Plus icon suggestion */}
      <g transform="translate(100, 135)" opacity="0.4">
        <circle r="12" fill="none" stroke="#86efac" strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="-5" y1="0" x2="5" y2="0" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* Sparkles */}
      <circle cx="45" cy="42" r="1.5" fill="#4ade80" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="155" cy="48" r="2" fill="#34d399" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}
