interface Props {
  /** height in px */
  size?: number;
  /** show the small tagline under the wordmark */
  tagline?: boolean;
  /** invert to a white version (for dark backgrounds) */
  light?: boolean;
  className?: string;
}

/**
 * NovusWork wordmark. The source PNG is a chrome wordmark on a near-white
 * background, so we trim to the mark and (optionally) invert on dark surfaces.
 */
export default function Logo({ size = 32, tagline = false, light = false, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/novuslogo.png"
        alt="NovusWork"
        style={light
          ? { height: size, filter: 'invert(1) brightness(2)' }
          : { height: size, mixBlendMode: 'multiply' }}
        className="w-auto object-contain select-none"
        draggable={false}
      />
      {tagline && (
        <span className={`text-[10px] tracking-widest uppercase ${light ? 'text-gray-400' : 'text-gray-500'}`}>
          Independiente
        </span>
      )}
    </div>
  );
}
