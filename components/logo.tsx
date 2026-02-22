export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M16 8L9 13V21L16 26L23 21V13L16 8Z"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 16L12 13.5V18.5L16 21L20 18.5V13.5L16 16Z"
        fill="white"
      />
    </svg>
  );
}
