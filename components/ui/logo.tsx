export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className || "w-8 h-8"}
      fill="none"
    >
      <rect width="100" height="100" rx="25" fill="hsl(var(--primary))" />
      <path d="M50 24 L26 44 L32 49 L50 34 L68 49 L74 44 Z" fill="#ffffff" opacity="0.95" />
      <path d="M34 50 L34 74 C34 76 36 78 38 78 L62 78 C64 78 66 76 66 74 L66 50 Z" fill="#ffffff" opacity="0.8" />
      <path d="M44 78 L44 64 C44 60.7 46.7 58 50 58 C53.3 58 56 64 56 64 L56 78 Z" fill="hsl(var(--background))" />
    </svg>
  );
}
