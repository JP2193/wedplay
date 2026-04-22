// primitives.jsx — shared UI primitives: PhoneFrame, Logo, Button, Chip, GameCard

function WPPhoneFrame({ children, mode = 'light', style = {} }) {
  const m = WP_MODE[mode];
  return (
    <div style={{
      width: 320, height: 640, borderRadius: 44,
      background: '#0a0806',
      padding: 10,
      boxShadow: '0 30px 60px -20px rgba(0,0,0,0.35), inset 0 0 0 1.5px rgba(255,255,255,0.06)',
      position: 'relative',
      ...style,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden',
        background: m.bg, color: m.ink, position: 'relative',
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
      }}>
        {/* status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 22px 4px', fontSize: 12, fontWeight: 600, color: m.ink }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>21:47</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="7" width="2" height="3" rx="0.5"/><rect x="3.5" y="5" width="2" height="5" rx="0.5"/><rect x="7" y="3" width="2" height="7" rx="0.5"/><rect x="10.5" y="0" width="2" height="10" rx="0.5"/></svg>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><path d="M7 2c1.8 0 3.4.7 4.6 1.8l1.1-1.2C11.2 1.1 9.2.3 7 .3S2.8 1.1 1.3 2.6l1.1 1.2C3.6 2.7 5.2 2 7 2zm0 3c.9 0 1.8.4 2.4 1l1.1-1.2C9.6 3.9 8.4 3.3 7 3.3s-2.6.6-3.5 1.5l1.1 1.2C5.2 5.4 6.1 5 7 5zm0 3c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1-.4-1-1-1z"/></svg>
            <div style={{ width: 22, height: 10, border: '1px solid currentColor', borderRadius: 2, position: 'relative', opacity: 0.9 }}>
              <div style={{ position: 'absolute', inset: 1, width: 14, background: 'currentColor', borderRadius: 1 }} />
              <div style={{ position: 'absolute', left: '100%', top: 3, width: 1.5, height: 4, background: 'currentColor', borderRadius: 1 }} />
            </div>
          </div>
        </div>
        {children}
      </div>
      {/* notch */}
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        width: 100, height: 24, borderRadius: '0 0 16px 16px', background: '#0a0806' }} />
    </div>
  );
}

function WPTVFrame({ children, mode = 'light', style = {} }) {
  const m = WP_MODE[mode];
  return (
    <div style={{
      width: 800, height: 500, borderRadius: 14,
      background: '#0a0806', padding: 8,
      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
      ...style,
    }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden',
        background: m.bg, color: m.ink, fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif' }}>
        {children}
      </div>
    </div>
  );
}

// WedPlay wordmark — logo with two-tone "Wed" | "Play" + optional icon
function WPLogo({ size = 56, font = 'unbounded', mode = 'light', color1, color2, showMark = true, brideName = 'Nacho & Flor' }) {
  const lf = WP_LOGO_FONTS[font];
  const m = WP_MODE[mode];
  const c1 = color1 || 'oklch(0.62 0.22 358)';  // pink
  const c2 = color2 || 'oklch(0.70 0.18 55)';   // warm orange
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {showMark && (
        <span style={{ position: 'relative', width: size * 0.9, height: size * 0.9 }}>
          <svg viewBox="0 0 40 40" width={size * 0.9} height={size * 0.9}>
            <defs>
              <linearGradient id={`wpmark-${size}-${font}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={c1} />
                <stop offset="100%" stopColor={c2} />
              </linearGradient>
            </defs>
            {/* two interlocking rings */}
            <circle cx="15" cy="20" r="9" fill="none" stroke={`url(#wpmark-${size}-${font})`} strokeWidth="3.2"/>
            <circle cx="25" cy="20" r="9" fill="none" stroke={`url(#wpmark-${size}-${font})`} strokeWidth="3.2"/>
            {/* play triangle in right ring */}
            <path d="M23 16.5 L29 20 L23 23.5 Z" fill={c2} />
          </svg>
        </span>
      )}
      <span style={{
        fontFamily: lf.family, fontWeight: lf.weight, fontSize: size,
        letterSpacing: lf.letter, lineHeight: 0.9,
      }}>
        <span style={{ color: c1 }}>Wed</span>
        <span style={{ color: c2 }}>Play</span>
      </span>
    </div>
  );
}

function WPButton({ children, variant = 'solid', color = 'oklch(0.62 0.22 358)', ink = '#fff', onClick, style = {}, full = true, size = 'md' }) {
  const sizes = {
    sm: { py: 8, px: 14, fs: 13, r: 10 },
    md: { py: 12, px: 18, fs: 14, r: 12 },
    lg: { py: 15, px: 22, fs: 16, r: 14 },
  }[size];
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: `${sizes.py}px ${sizes.px}px`, borderRadius: sizes.r,
    fontSize: sizes.fs, fontWeight: 700, letterSpacing: -0.1,
    border: 'none', cursor: 'pointer', width: full ? '100%' : 'auto',
    fontFamily: 'inherit',
    ...style,
  };
  if (variant === 'solid') return <button onClick={onClick} style={{ ...base, background: color, color: ink, boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 2px 6px oklch(from ' + color + ' calc(l - 0.1) c h / 0.4)' }}>{children}</button>;
  if (variant === 'soft')  return <button onClick={onClick} style={{ ...base, background: `color-mix(in oklch, ${color} 14%, transparent)`, color }}>{children}</button>;
  if (variant === 'ghost') return <button onClick={onClick} style={{ ...base, background: 'transparent', color, border: `1.5px solid ${color}` }}>{children}</button>;
  return <button onClick={onClick} style={base}>{children}</button>;
}

function WPChip({ children, color = 'oklch(0.62 0.22 358)', style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 9px', borderRadius: 999,
      background: `color-mix(in oklch, ${color} 14%, transparent)`,
      color, fontSize: 11, fontWeight: 700, letterSpacing: 0.2, textTransform: 'uppercase',
      ...style,
    }}>{children}</span>
  );
}

// Colorful game card illustration (abstract — no copied UI)
function WPGameGlyph({ game, size = 96 }) {
  const g = WP_GAMES[game];
  const defs = `g${game}-${size}`;
  if (game === 'bingo') return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <defs><linearGradient id={defs} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.9"/><stop offset="1" stopColor="#fff" stopOpacity="0.6"/></linearGradient></defs>
      <rect x="18" y="18" width="64" height="64" rx="10" fill={`url(#${defs})`}/>
      {[0,1,2].map(r => [0,1,2].map(c => {
        const on = (r+c) % 2 === 0;
        return <circle key={r+'-'+c} cx={32 + c*18} cy={32 + r*18} r={on ? 5 : 4} fill={on ? g.c : 'none'} stroke={g.c} strokeWidth={1.5} opacity={on ? 1 : 0.55}/>;
      }))}
      <path d="M28 28 L44 44" stroke={g.c2} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
  if (game === 'quiz') return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="38" cy="48" r="26" fill="#fff" opacity="0.9"/>
      <text x="38" y="58" fontSize="32" fontWeight="900" textAnchor="middle" fill={g.c}>?</text>
      <circle cx="70" cy="34" r="14" fill={g.c2}/>
      <path d="M66 30 L70 34 L76 28" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="72" cy="70" r="8" fill="#fff" opacity="0.5"/>
    </svg>
  );
  if (game === 'guess') return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect x="24" y="22" width="30" height="44" rx="4" fill="#fff" opacity="0.9" transform="rotate(-6 39 44)"/>
      <rect x="46" y="28" width="30" height="44" rx="4" fill="#fff" opacity="0.7" transform="rotate(5 61 50)"/>
      <circle cx="39" cy="40" r="5" fill={g.c}/>
      <circle cx="61" cy="46" r="5" fill={g.c2}/>
      <path d="M30 54 Q39 60 48 54" stroke={g.c} strokeWidth="2" fill="none" strokeLinecap="round" transform="rotate(-6 39 54)"/>
    </svg>
  );
  if (game === 'wishes') return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <path d="M50 78 Q28 60 28 42 A16 16 0 0 1 50 34 A16 16 0 0 1 72 42 Q72 60 50 78 Z" fill="#fff" opacity="0.92"/>
      <circle cx="50" cy="48" r="5" fill={g.c}/>
      <circle cx="38" cy="42" r="3" fill={g.c2} opacity="0.7"/>
      <circle cx="62" cy="42" r="3" fill={g.c2} opacity="0.7"/>
    </svg>
  );
  if (game === 'timeline') return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <path d="M16 62 Q32 30 50 50 T84 38" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85"/>
      <circle cx="16" cy="62" r="6" fill={g.c}/>
      <circle cx="50" cy="50" r="6" fill={g.c2}/>
      <circle cx="84" cy="38" r="6" fill="#fff"/>
    </svg>
  );
  if (game === 'photo') return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <rect x="18" y="30" width="64" height="48" rx="6" fill="#fff" opacity="0.9"/>
      <rect x="38" y="22" width="24" height="12" rx="2" fill="#fff" opacity="0.6"/>
      <circle cx="50" cy="54" r="12" fill="none" stroke={g.c} strokeWidth="3"/>
      <circle cx="50" cy="54" r="6" fill={g.c2}/>
    </svg>
  );
  if (game === 'playlist') return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="40" cy="66" r="10" fill="#fff"/>
      <circle cx="72" cy="58" r="8" fill="#fff" opacity="0.8"/>
      <rect x="48" y="24" width="4" height="44" rx="2" fill="#fff"/>
      <rect x="78" y="22" width="3" height="38" rx="1.5" fill="#fff" opacity="0.8"/>
      <path d="M48 24 L82 18 L82 30 L48 36 Z" fill={g.c2}/>
    </svg>
  );
  return null;
}

Object.assign(window, { WPPhoneFrame, WPTVFrame, WPLogo, WPButton, WPChip, WPGameGlyph });
