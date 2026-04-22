// dir-a.jsx — Direction A: "Confetti Fiesta"
// Warm ivory bg, rounded multi-color cards, gradient wordmark, confetti shapes.
// Mobile home, login invitado, login admin, cards de juegos, vistas de juego, panel admin TV.

function DirA_Home({ mode = 'light', logoFont = 'unbounded', games = ['bingo','quiz','guess','wishes','timeline','photo','playlist'], t = WP_I18N.rio, names = 'Nacho & Flor', date = '22 · 11 · 2026' }) {
  const m = WP_MODE[mode];
  const confetti = `url("data:image/svg+xml;utf8,${encodeURIComponent(wpConfetti(3, 36))}")`;
  return (
    <WPPhoneFrame mode={mode}>
      <div style={{ position: 'relative', height: 'calc(100% - 30px)', overflow: 'hidden', background: m.bg }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: confetti, backgroundSize: '100% 100%', opacity: mode === 'dark' ? 0.35 : 0.55, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', padding: '14px 18px 10px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: m.inkSoft, letterSpacing: 0.6, textTransform: 'uppercase' }}>{date}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: m.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🔔</div>
            </div>
          </div>
          {/* hero placeholder */}
          <div style={{ aspectRatio: '1/1', width: '62%', margin: '0 auto 10px', borderRadius: 20,
            background: `repeating-linear-gradient(45deg, ${m.bgAlt} 0 10px, ${m.bg} 10px 20px)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1.5px dashed ${m.line}`, color: m.inkSoft, fontSize: 10, fontFamily: 'ui-monospace, monospace', textAlign: 'center', lineHeight: 1.3 }}>
            illustration<br/>of the couple
          </div>
          {/* wordmark */}
          <div style={{ textAlign: 'center', marginBottom: 2 }}>
            <WPLogo size={40} font={logoFont} mode={mode} showMark={false} />
          </div>
          <div style={{ textAlign: 'center', color: m.inkSoft, fontSize: 12, fontWeight: 500, marginBottom: 14 }}>
            {t.tagline} · <span style={{ color: m.ink, fontWeight: 700 }}>{names}</span>
          </div>
          {/* games grid */}
          <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingBottom: 8 }}>
            {games.slice(0, 6).map((gk) => {
              const g = WP_GAMES[gk];
              return (
                <div key={gk} style={{
                  background: g.c, borderRadius: 18, padding: 10, color: g.ink,
                  display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden',
                  minHeight: 118,
                  boxShadow: '0 4px 10px -4px rgba(0,0,0,0.2)',
                }}>
                  <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.95 }}>
                    <WPGameGlyph game={gk} size={66} />
                  </div>
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: -0.2, lineHeight: 1.1 }}>{g.name}</div>
                    <div style={{ fontSize: 9, opacity: 0.85, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {gk === 'bingo' && '5×5 · grupo'}
                      {gk === 'quiz' && 'trivia · rápido'}
                      {gk === 'guess' && 'él vs ella'}
                      {gk === 'wishes' && 'mensaje'}
                      {gk === 'timeline' && 'historia'}
                      {gk === 'photo' && 'cámara'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* bottom bar */}
          <div style={{ display: 'flex', gap: 8, paddingTop: 10 }}>
            <WPButton size="sm" variant="solid" color="oklch(0.25 0.02 40)" ink="#fff">Invitado · QR</WPButton>
            <WPButton size="sm" variant="ghost" color={m.ink}>Admin</WPButton>
          </div>
        </div>
      </div>
    </WPPhoneFrame>
  );
}

function DirA_GuestLogin({ mode = 'light', logoFont = 'unbounded', t = WP_I18N.rio }) {
  const m = WP_MODE[mode];
  return (
    <WPPhoneFrame mode={mode}>
      <div style={{ padding: '12px 20px 18px', height: 'calc(100% - 30px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, color: m.inkSoft, fontWeight: 600, marginBottom: 14 }}>{t.back}</div>
        <div style={{ marginBottom: 14 }}>
          <WPLogo size={24} font={logoFont} mode={mode} showMark={true} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1, marginBottom: 4 }}>Entrá a la fiesta</div>
        <div style={{ fontSize: 12, color: m.inkSoft, marginBottom: 18 }}>{t.scan}</div>
        {/* QR */}
        <div style={{ alignSelf: 'center', width: 150, height: 150, background: m.card, borderRadius: 16, padding: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 14 }}>
          <div style={{ width: '100%', height: '100%', background: `conic-gradient(from 0deg, ${m.ink} 0 25%, transparent 0 50%, ${m.ink} 0 75%, transparent 0), repeating-conic-gradient(${m.ink} 0 10deg, transparent 10deg 20deg)`,
            borderRadius: 4, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: `
              radial-gradient(circle at 15% 15%, ${m.ink} 12%, transparent 13%),
              radial-gradient(circle at 85% 15%, ${m.ink} 12%, transparent 13%),
              radial-gradient(circle at 15% 85%, ${m.ink} 12%, transparent 13%)` }} />
            <div style={{ position: 'absolute', inset: '42%', background: 'oklch(0.62 0.22 358)', borderRadius: 8 }} />
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: m.inkSoft, marginBottom: 12, fontWeight: 600 }}>— o —</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {['N','A','F','7'].map((c, i) => (
            <div key={i} style={{ flex: 1, aspectRatio: '1/1.2', borderRadius: 10, background: m.bgAlt,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800,
              border: i === 3 ? `2px solid oklch(0.62 0.22 358)` : `1px solid ${m.line}`,
              color: m.ink }}>{c}</div>
          ))}
        </div>
        <div style={{ marginTop: 10, background: m.bgAlt, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${m.line}` }}>
          <div style={{ fontSize: 13 }}>👤</div>
          <input placeholder={t.yourName} style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontSize: 13, color: m.ink, fontFamily: 'inherit' }} />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <WPButton size="lg" color="oklch(0.62 0.22 358)">{t.join} →</WPButton>
        </div>
      </div>
    </WPPhoneFrame>
  );
}

function DirA_AdminLogin({ mode = 'light', logoFont = 'unbounded', t = WP_I18N.rio, names = 'Nacho & Flor' }) {
  const m = WP_MODE[mode];
  return (
    <WPPhoneFrame mode={mode}>
      <div style={{ padding: '12px 20px 18px', height: 'calc(100% - 30px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 11, color: m.inkSoft, fontWeight: 600, marginBottom: 14 }}>{t.back}</div>
        <div style={{ marginBottom: 14 }}>
          <WPLogo size={24} font={logoFont} mode={mode} showMark={true} />
        </div>
        <WPChip color="oklch(0.62 0.22 358)" style={{ alignSelf: 'flex-start', marginBottom: 8 }}>💍 NOVIOS</WPChip>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>Bienvenidos,</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1, background: 'linear-gradient(90deg, oklch(0.62 0.22 358), oklch(0.70 0.18 55))', WebkitBackgroundClip: 'text', color: 'transparent', marginBottom: 18 }}>{names}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: m.bgAlt, borderRadius: 12, padding: '10px 12px', border: `1px solid ${m.line}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: m.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.email}</div>
            <input defaultValue="nacho@novios.com" style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: 14, fontWeight: 600, color: m.ink, fontFamily: 'inherit', marginTop: 2 }} />
          </div>
          <div style={{ background: m.bgAlt, borderRadius: 12, padding: '10px 12px', border: `1px solid ${m.line}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: m.inkSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t.password}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 18, letterSpacing: 4, color: m.ink }}>••••••••</span>
              <span style={{ fontSize: 11, color: m.inkSoft }}>👁</span>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: m.inkSoft, marginTop: 10, textAlign: 'right', fontWeight: 600 }}>¿Olvidaste la clave?</div>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <WPButton size="lg" color="oklch(0.25 0.02 40)">{t.enter} al panel →</WPButton>
          <div style={{ textAlign: 'center', fontSize: 11, color: m.inkSoft }}>Sesión segura · los invitados no ven esto</div>
        </div>
      </div>
    </WPPhoneFrame>
  );
}

function DirA_Bingo({ mode = 'light', logoFont = 'unbounded', t = WP_I18N.rio }) {
  const m = WP_MODE[mode];
  const g = WP_GAMES.bingo;
  const cells = [
    'Bailó con la abuela','Tiene hijos','Viajó fuera del país este año','Usa anteojos','Llora en las bodas',
    'Conoce a los novios hace +10 años','Ya fue padrino','Vive fuera del país','Es del mismo signo que vos','Le gusta el picante',
    '★ FREE ★','Tiene tatuajes','Fue a la primaria con Flor','Canta en la ducha','Bebe sin alcohol',
    'Le tira la pilcha','Hace deporte','Cocina rico','Tiene perro','Trabaja en tech',
    'Fue a 3+ bodas este año','Es del interior','Vino solo/a','Es zurdo/a','Habla 2 idiomas',
  ];
  const stamped = [0, 2, 5, 10, 12, 18];
  return (
    <WPPhoneFrame mode={mode}>
      <div style={{ height: 'calc(100% - 30px)', background: `linear-gradient(180deg, ${g.c} 0%, ${g.c} 160px, ${m.bg} 160px)`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 18px 14px', color: g.ink }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.9 }}>← {t.back}</span>
            <WPChip color="#fff" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>🔴 {t.live}</WPChip>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1 }}>Bingo Humano</div>
          <div style={{ fontSize: 11, opacity: 0.9, marginTop: 3, fontWeight: 500 }}>Encontrá a gente que cumpla cada casilla</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <WPChip color="#fff" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>6/25</WPChip>
            <WPChip color="#fff" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>42 {t.players}</WPChip>
          </div>
        </div>
        <div style={{ padding: '0 14px 12px', flex: 1, overflow: 'hidden' }}>
          <div style={{ background: m.card, borderRadius: 14, padding: 8, boxShadow: '0 6px 16px -6px rgba(0,0,0,0.18)',
            display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, aspectRatio: '1/1' }}>
            {cells.map((label, i) => {
              const isFree = i === 10;
              const isOn = stamped.includes(i);
              return (
                <div key={i} style={{
                  aspectRatio: '1/1', borderRadius: 7, background: isFree ? g.c2 : isOn ? g.c : m.bgAlt,
                  color: isFree ? '#fff' : isOn ? '#fff' : m.inkSoft,
                  fontSize: 6.5, fontWeight: 700, padding: 3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  lineHeight: 1.1,
                  border: isOn || isFree ? 'none' : `1px solid ${m.line}`,
                  position: 'relative',
                }}>
                  {isOn && <div style={{ position: 'absolute', top: 2, right: 2, fontSize: 8 }}>✓</div>}
                  {label}
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '0 18px 14px', display: 'flex', gap: 6 }}>
          <WPButton size="md" color={g.c}>📸 Marcar con foto</WPButton>
          <WPButton size="md" variant="soft" color={g.c} full={false} style={{ padding: '12px 14px' }}>🏆</WPButton>
        </div>
      </div>
    </WPPhoneFrame>
  );
}

function DirA_Quiz({ mode = 'light', logoFont = 'unbounded', t = WP_I18N.rio }) {
  const m = WP_MODE[mode];
  const g = WP_GAMES.quiz;
  const options = [
    { letter: 'A', text: 'En el Parque Centenario', state: 'idle' },
    { letter: 'B', text: 'En una app de citas', state: 'correct' },
    { letter: 'C', text: 'En un asado de amigos', state: 'idle' },
    { letter: 'D', text: 'En la facultad', state: 'wrong' },
  ];
  return (
    <WPPhoneFrame mode={mode}>
      <div style={{ height: 'calc(100% - 30px)', display: 'flex', flexDirection: 'column', padding: '10px 18px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: m.inkSoft, fontWeight: 700 }}>{t.back}</span>
          <WPChip color={g.c}>ronda 4 / 10</WPChip>
        </div>
        {/* timer bar */}
        <div style={{ height: 5, background: m.bgAlt, borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ width: '62%', height: '100%', background: g.c }} />
        </div>
        <div style={{ fontSize: 10, color: g.c, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>Pregunta</div>
        <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.2, marginBottom: 14 }}>
          ¿Dónde se conocieron Nacho y Flor?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
          {options.map((o) => {
            const isCorrect = o.state === 'correct';
            const isWrong = o.state === 'wrong';
            const bg = isCorrect ? g.c : isWrong ? 'oklch(0.95 0.04 25)' : m.card;
            const border = isCorrect ? g.c : isWrong ? 'oklch(0.75 0.15 25)' : m.line;
            const color = isCorrect ? '#fff' : isWrong ? 'oklch(0.50 0.18 25)' : m.ink;
            return (
              <div key={o.letter} style={{
                background: bg, border: `1.5px solid ${border}`, borderRadius: 12, padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 10, color,
              }}>
                <div style={{ width: 24, height: 24, borderRadius: 12,
                  background: isCorrect ? 'rgba(255,255,255,0.25)' : isWrong ? 'oklch(0.75 0.15 25)' : m.bgAlt,
                  color: isCorrect || isWrong ? '#fff' : m.ink,
                  fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isCorrect ? '✓' : isWrong ? '✕' : o.letter}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{o.text}</span>
                {isCorrect && <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.25)', padding: '2px 6px', borderRadius: 6 }}>+850 pts</span>}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${m.line}` }}>
          <div>
            <div style={{ fontSize: 9, color: m.inkSoft, fontWeight: 700, textTransform: 'uppercase' }}>Puesto</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: m.ink }}>#7 de 42</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: m.inkSoft, fontWeight: 700, textTransform: 'uppercase' }}>Puntaje</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: g.c, fontVariantNumeric: 'tabular-nums' }}>3.240</div>
          </div>
        </div>
      </div>
    </WPPhoneFrame>
  );
}

function DirA_AdminTV({ mode = 'light', logoFont = 'unbounded', t = WP_I18N.rio, names = 'Nacho & Flor' }) {
  const m = WP_MODE[mode];
  const g = WP_GAMES.quiz;
  const leaderboard = [
    { rank: 1, name: 'Lucía R.', pts: 4820, av: 'oklch(0.7 0.15 340)' },
    { rank: 2, name: 'Martín B.', pts: 4510, av: 'oklch(0.7 0.15 160)' },
    { rank: 3, name: 'Sofía G.', pts: 4180, av: 'oklch(0.7 0.15 280)' },
    { rank: 4, name: 'Juan P.',  pts: 3940, av: 'oklch(0.7 0.15 45)' },
    { rank: 5, name: 'Vale K.',  pts: 3720, av: 'oklch(0.7 0.15 210)' },
  ];
  return (
    <WPTVFrame mode={mode}>
      <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 320px', padding: 24, gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <WPLogo size={22} font={logoFont} mode={mode} />
            <div style={{ fontSize: 11, color: m.inkSoft, fontWeight: 600 }}>{names} · Sala <b style={{ color: m.ink }}>NACHOFLOR22</b></div>
          </div>
          <WPChip color={g.c} style={{ alignSelf: 'flex-start', marginBottom: 10 }}>🔴 EN VIVO · Quiz</WPChip>
          <div style={{ fontSize: 10, color: g.c, fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>Pregunta 4 de 10</div>
          <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1, lineHeight: 1.05, marginBottom: 18 }}>
            ¿Dónde se conocieron<br/>Nacho y Flor?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1 }}>
            {[
              { letter: 'A', text: 'En el Parque Centenario', pct: 18 },
              { letter: 'B', text: 'En una app de citas', pct: 54, correct: true },
              { letter: 'C', text: 'En un asado de amigos', pct: 22 },
              { letter: 'D', text: 'En la facultad', pct: 6 },
            ].map((o) => (
              <div key={o.letter} style={{
                background: m.card, borderRadius: 16, padding: 14,
                border: `2px solid ${o.correct ? g.c : m.line}`,
                display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', inset: 0, width: `${o.pct}%`, background: o.correct ? `color-mix(in oklch, ${g.c} 18%, transparent)` : m.bgAlt }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 13, background: o.correct ? g.c : m.bgAlt, color: o.correct ? '#fff' : m.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>{o.letter}</div>
                  <span style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>{o.text}</span>
                  <span style={{ fontSize: 16, fontWeight: 900, color: o.correct ? g.c : m.inkSoft, fontVariantNumeric: 'tabular-nums' }}>{o.pct}%</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14, fontSize: 11, color: m.inkSoft, fontWeight: 600 }}>
            <span>⏱ 7s restantes</span>
            <span>·</span>
            <span>👥 42 jugando</span>
            <span>·</span>
            <span>💯 38 respondieron</span>
          </div>
        </div>
        <div style={{ background: m.bgAlt, borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, color: m.inkSoft, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>🏆 Ranking</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            {leaderboard.map((p) => (
              <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, background: p.rank === 1 ? g.c : m.card, color: p.rank === 1 ? '#fff' : m.ink, padding: '7px 9px', borderRadius: 10 }}>
                <span style={{ width: 18, fontSize: 12, fontWeight: 900 }}>{p.rank}</span>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: p.av }} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: 700 }}>{p.name}</span>
                <span style={{ fontSize: 12, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{p.pts.toLocaleString('es')}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, background: m.card, borderRadius: 12, padding: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: m.inkSoft, fontWeight: 800, textTransform: 'uppercase' }}>Escaneá para unirte</div>
            <div style={{ width: 72, height: 72, margin: '6px auto', background: `repeating-linear-gradient(45deg, ${m.ink} 0 3px, transparent 3px 6px), repeating-linear-gradient(-45deg, ${m.ink} 0 3px, transparent 3px 6px)`, borderRadius: 4 }} />
            <div style={{ fontSize: 11, fontWeight: 800 }}>wedplay.ar/<span style={{ color: g.c }}>nachoflor</span></div>
          </div>
        </div>
      </div>
    </WPTVFrame>
  );
}

Object.assign(window, { DirA_Home, DirA_GuestLogin, DirA_AdminLogin, DirA_Bingo, DirA_Quiz, DirA_AdminTV });
