"use client";

export const PlaceholderCard = () => {
  return (
    <div className="relative w-full max-w-[320px]">
      <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full" />
      <div className="relative rounded-xl border border-github-border bg-white/5 backdrop-blur-md p-6 space-y-4">
        <div className="h-2 w-1/3 rounded bg-purple-400/40" />
        <p className="text-sm leading-relaxed text-gray-400">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation.
        </p>
        <div className="space-y-2">
          <div className="h-2 w-full rounded bg-white/10" />
          <div className="h-2 w-2/3 rounded bg-white/10" />
          <div className="h-2 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    </div>
  );
};
