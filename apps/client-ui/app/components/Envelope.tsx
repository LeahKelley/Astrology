// marks this as a client component so it can be used inside interactive layouts
"use client";

// a generic skeleton-style placeholder card used while real content is loading or as a UI mockup
export const PlaceholderCard = () => {
  return (
    // outer container constrains the card width
    <div className="relative w-full max-w-[320px]">
      {/* soft purple glow behind the card for a cosmic vibe */}
      <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full" />
      {/* the card itself, frosted glass effect with a subtle border */}
      <div className="relative rounded-xl border border-github-border bg-white/5 backdrop-blur-md p-6 space-y-4">
        {/* short purple bar standing in for a title or label */}
        <div className="h-2 w-1/3 rounded bg-purple-400/40" />
        {/* placeholder body text, lorem ipsum keeps the layout realistic */}
        <p className="text-sm leading-relaxed text-gray-400">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation.
        </p>
        {/* three skeleton lines representing a list or multi-line content block */}
        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-white/10" />
          <div className="h-2 w-2/3 rounded bg-white/10" />
          <div className="h-2 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
};
