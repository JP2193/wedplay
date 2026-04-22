// dir-b.jsx — Direction B: "Bold Retro Poster"
// High-contrast bold card, serif display + grotesque, big numerals.
// Dark forest or ivory bg, chunky buttons, grid of games as a "poster".

function DirB_Home({ mode = 'light', logoFont = 'fraunces', games = ['bingo','quiz','guess','wishes','timeline','photo','playlist'], t = WP_I18N.rio, names = 'Nacho & Flor', date = '22 · 11 · 2026' }) {
  const m = WP_MODE[mode];
  return (
    <WPPhoneFrame mode={mode}>
      <div style={{ height: 'calc(100% - 30px)', display: 'flex', flexDirection: 'column', background: m.bg }}>
        <div style={{ padding: '14px 20px 12px', borderBottom: `1px solid ${m.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: m.inkSoft, textTransform: 'uppercase' }}>WEDPLAY · N°01</div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, color: m.inkSoft }}>{date}</div>
        </div>
        {/* Giant poster title */}
        <div style={{ padding: '18px 20px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: m.inkSoft, letterSpacing: 0.4, marginBottom: 6 }}>La boda de</div>
          <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 36, lineHeight: 0.9, letterSpacing: -1.2, color: m.ink }}>
            {names.split(' & ')[0]}
            <span style={{ display: 'block', fontStyle: 'italic', fontSize: 22, fontWeight: 600, color: 'oklch(0.62 0.22 358)', letterSpacing: -0.5, margin: '2px 0 2px 24px' }}>&amp;</span>
            {names.split(' & ')[1]}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <div style={{ flex: 1, height: 1, background: m.line }} />
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: m.inkSoft, textTransform: 'uppercase' }}>{t.tagline}</div>
            <div style={{ flex: 1, height: 1, background: m.line }} />
          </div>
        </div>
        {/* hero placeholder */}
        <div style={{ margin: '0 20px 14px', aspectRatio: '5/3', borderRadius: 2,
          background: `repeating-linear-gradient(-45deg, ${m.bgAlt} 0 6px, ${m.bg} 6px 12px)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${m.line}`, color: m.inkSoft, fontSize: 10, fontFamily: 'ui-monospace, monospace' }}>
          [ photo ]
        </div>
        {/* game list */}
        <div style={{ padding: '0 20px 10px', flex: 1, overflow: 'auto' }}>
          {games.map((gk, i) => {
            const g = WP_GAMES[gk];
            return (
              <div key={gk} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderTop: `1px solid ${m.line}`,
              }}>
                <div style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', fontWeight: 800, color: m.inkSoft, width: 20 }}>0{i+1}</div>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: g.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WPGameGlyph game={gk} size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 800, fontSize: 15, letterSpacing: -0.3, color: m.ink }}>{g.name}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: g.c }}>{t.play} →</div>
              </div>
            );
          })}
          <div style={{ borderTop: `1px solid ${m.line}` }} />
        </div>
        <div style={{ padding: '10px 20px 14px', borderTop: `1px solid ${m.line}`, display: 'flex', gap: 8 }}>
          <WPButton size="sm" variant="solid" color={m.ink} ink={m.bg}>Invitado</WPButton>
          <WPButton size="sm" variant="ghost" color={m.ink}>💍 Novios</WPButton>
        </div>
      </div>
    </WPPhoneFrame>
  );
}

function DirB_GuestLogin({ mode = 'light', logoFont = 'fraunces', t = WP_I18N.rio }) {
  const m = WP_MODE[mode];
  return (
    <WPPhoneFrame mode={mode}>
      <div style={{ height: 'calc(100% - 30px)', padding: '14px 20px 18px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: m.inkSoft, textTransform: 'uppercase', marginBottom: 20 }}>← {t.back}</div>
        <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 30, lineHeight: 0.95, letterSpacing: -1, marginBottom: 4 }}>
          Sumate a <span style={{ fontStyle: 'italic', color: 'oklch(0.62 0.22 358)' }}>la fiesta</span>
        </div>
        <div style={{ fontSize: 12, color: m.inkSoft, marginBottom: 20, fontWeight: 500 }}>{t.scan}</div>
        {/* big QR poster */}
        <div style={{ alignSelf: 'center', width: 180, padding: 14, background: m.ink, borderRadius: 2, marginBottom: 4 }}>
          <div style={{ width: '100%', aspectRatio: '1/1', background: m.bg, borderRadius: 2, position: 'relative',
            backgroundImage: `
              radial-gradient(circle at 20% 20%, ${m.ink} 20%, transparent 22%),
              radial-gradient(circle at 80% 20%, ${m.ink} 20%, transparent 22%),
              radial-gradient(circle at 20% 80%, ${m.ink} 20%, transparent 22%)`,
            backgroundSize: '40% 40%', backgroundPosition: 'top left, top right, bottom left', backgroundRepeat: 'no-repeat' }}>
            <div style={{ position: 'absolute', inset: '30%', background: `repeating-linear-gradient(45deg, ${m.ink} 0 4px, transparent 4px 8px)` }} />
          </div>
          <div style={{ color: m.bg, fontFamily: 'ui-monospace, monospace', fontSize: 9, fontWeight: 700, textAlign: 'center', marginTop: 8, letterSpacing: 2 }}>NACHOFLOR22</div>
        </div>
        <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: m.line }} />
          <div style={{ fontSize: 10, fontWeight: 800, color: m.inkSoft, letterSpacing: 1 }}>O CON CÓDIGO</div>
          <div style={{ flex: 1, height: 1, background: m.line }} />
        </div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
          {['N','A','F','_','_','_'].map((c, i) => (
            <div key={i} style={{ flex: 1, aspectRatio: '3/4', borderRadius: 2, background: i < 3 ? m.ink : m.card,
              color: i < 3 ? m.bg : m.line,
              border: `1.5px solid ${i < 3 ? m.ink : m.line}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, fontFamily: WP_LOGO_FONTS[logoFont].family }}>{c}</div>
          ))}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <WPButton size="lg" color={m.ink} ink={m.bg} style={{ borderRadius: 2 }}>{t.join.toUpperCase()} →</WPButton>
        </div>
      </div>
    </WPPhoneFrame>
  );
}

function DirB_AdminLogin({ mode = 'light', logoFont = 'fraunces', t = WP_I18N.rio, names = 'Nacho & Flor' }) {
  const m = WP_MODE[mode];
  return (
    <WPPhoneFrame mode={mode}>
      <div style={{ height: 'calc(100% - 30px)', padding: '14px 20px 18px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: m.inkSoft, textTransform: 'uppercase', marginBottom: 14 }}>← {t.back}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', padding: '4px 10px', border: `1.5px solid ${m.ink}`, borderRadius: 2, marginBottom: 14 }}>
          <span style={{ fontSize: 11 }}>💍</span>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1 }}>NOVIOS</span>
        </div>
        <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 26, lineHeight: 0.95, letterSpacing: -0.8, marginBottom: 2 }}>
          Hola de nuevo,
        </div>
        <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontStyle: 'italic', fontWeight: 900, fontSize: 30, lineHeight: 0.95, letterSpacing: -0.8, marginBottom: 22, color: 'oklch(0.62 0.22 358)' }}>
          {names}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: `1.5px solid ${m.ink}` }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${m.line}` }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: m.inkSoft, textTransform: 'uppercase' }}>{t.email}</span>
            <input defaultValue="nacho@novios.com" style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, color: m.ink, fontFamily: 'inherit', textAlign: 'right', width: '60%' }} />
          </label>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1.5px solid ${m.ink}` }}>
            <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: m.inkSoft, textTransform: 'uppercase' }}>{t.password}</span>
            <span style={{ fontSize: 16, letterSpacing: 3, color: m.ink }}>••••••••</span>
          </label>
        </div>
        <div style={{ fontSize: 11, color: m.inkSoft, marginTop: 10, fontWeight: 600, textAlign: 'right' }}>¿La olvidaste?</div>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <WPButton size="lg" color={m.ink} ink={m.bg} style={{ borderRadius: 2 }}>{t.enter.toUpperCase()} AL PANEL →</WPButton>
          <div style={{ textAlign: 'center', fontSize: 10, color: m.inkSoft, fontWeight: 700, letterSpacing: 0.6 }}>🔒 SESIÓN PRIVADA · SÓLO NOVIOS</div>
        </div>
      </div>
    </WPPhoneFrame>
  );
}

function DirB_GuessWho({ mode = 'light', logoFont = 'fraunces', t = WP_I18N.rio, names = 'Nacho & Flor' }) {
  const m = WP_MODE[mode];
  const g = WP_GAMES.guess;
  const [he, she] = names.split(' & ');
  return (
    <WPPhoneFrame mode={mode}>
      <div style={{ height: 'calc(100% - 30px)', display: 'flex', flexDirection: 'column', padding: '14px 20px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: m.inkSoft, textTransform: 'uppercase' }}>← {t.back}</span>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: g.c, textTransform: 'uppercase' }}>5 / 12</span>
        </div>
        <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 26, letterSpacing: -0.8, lineHeight: 1, marginBottom: 4 }}>
          Adivina <span style={{ fontStyle: 'italic', color: g.c }}>quién</span>
        </div>
        <div style={{ fontSize: 13, color: m.inkSoft, marginBottom: 16, fontWeight: 600 }}>¿Quién <span style={{ color: m.ink, fontWeight: 800 }}>se olvida las llaves</span> más seguido?</div>
        {/* VS card */}
        <div style={{ position: 'relative', flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 2, overflow: 'hidden', border: `1.5px solid ${m.ink}` }}>
          <div style={{ background: g.c, color: '#fff', padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, opacity: 0.9 }}>OPCIÓN A</div>
            <div>
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: `repeating-linear-gradient(45deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 8px)`, border: '2px solid #fff', marginBottom: 8 }} />
              <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 28, letterSpacing: -0.5, lineHeight: 0.95 }}>{he}</div>
              <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.85, letterSpacing: 0.6, marginTop: 4 }}>42% votó</div>
            </div>
          </div>
          <div style={{ background: g.c2, color: '#fff', padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, opacity: 0.9, textAlign: 'right' }}>OPCIÓN B</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ width: 58, height: 58, borderRadius: '50%', background: `repeating-linear-gradient(-45deg, rgba(255,255,255,0.3) 0 4px, transparent 4px 8px)`, border: '2px solid #fff', marginLeft: 'auto', marginBottom: 8 }} />
              <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontStyle: 'italic', fontSize: 28, letterSpacing: -0.5, lineHeight: 0.95 }}>{she}</div>
              <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.85, letterSpacing: 0.6, marginTop: 4 }}>58% votó</div>
            </div>
          </div>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: m.bg, color: m.ink, width: 44, height: 44, borderRadius: '50%', border: `2px solid ${m.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: WP_LOGO_FONTS[logoFont].family, fontStyle: 'italic', fontWeight: 900, fontSize: 16 }}>vs</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <WPButton size="md" color={g.c} style={{ borderRadius: 2 }}>VOTAR A</WPButton>
          <WPButton size="md" color={g.c2} style={{ borderRadius: 2 }}>VOTAR B</WPButton>
        </div>
      </div>
    </WPPhoneFrame>
  );
}

function DirB_Wishes({ mode = 'light', logoFont = 'fraunces', t = WP_I18N.rio, names = 'Nacho & Flor' }) {
  const m = WP_MODE[mode];
  const g = WP_GAMES.wishes;
  const msgs = [
    { from: 'Abuela Marta', text: 'Que la vida les regale mil aventuras juntos y paciencia infinita ✨', color: 'oklch(0.85 0.12 45)' },
    { from: 'Tomás (hermano)', text: 'Flor, cuidalo bien. Nacho, no te lo merecés jajaj. LOS AMO 💙', color: 'oklch(0.82 0.12 200)' },
    { from: 'Sofi & Juan', text: 'Gracias por la mejor fiesta del año. ¡Brindamos por ustedes!', color: 'oklch(0.85 0.12 340)' },
  ];
  return (
    <WPPhoneFrame mode={mode}>
      <div style={{ height: 'calc(100% - 30px)', padding: '14px 20px 14px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: m.inkSoft, textTransform: 'uppercase', marginBottom: 14 }}>← {t.back}</div>
        <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 28, letterSpacing: -0.8, lineHeight: 0.95, marginBottom: 2 }}>
          Un deseo para
        </div>
        <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontStyle: 'italic', fontWeight: 900, fontSize: 28, letterSpacing: -0.8, lineHeight: 0.95, marginBottom: 16, color: g.c }}>
          {names}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {msgs.map((m2, i) => (
            <div key={i} style={{
              background: m2.color, padding: 12, borderRadius: 4,
              marginBottom: 10, transform: `rotate(${i % 2 === 0 ? -1.2 : 1.5}deg)`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
              border: `1px solid rgba(0,0,0,0.08)`,
            }}>
              <div style={{ fontFamily: '"Caveat", "Bradley Hand", cursive', fontSize: 14, lineHeight: 1.3, color: 'oklch(0.25 0.02 50)', marginBottom: 6 }}>{m2.text}</div>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: 'oklch(0.30 0.04 50)', textTransform: 'uppercase' }}>— {m2.from}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 6, background: m.bgAlt, borderRadius: 4, padding: 10, border: `1.5px solid ${m.ink}` }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: m.inkSoft, marginBottom: 4 }}>TU DESEO</div>
          <div style={{ fontFamily: '"Caveat", cursive', fontSize: 14, color: m.inkSoft, fontStyle: 'italic' }}>Escribí algo lindo para ellos…</div>
        </div>
        <div style={{ marginTop: 8 }}>
          <WPButton size="md" color={m.ink} ink={m.bg} style={{ borderRadius: 2 }}>{t.send.toUpperCase()} ✉</WPButton>
        </div>
      </div>
    </WPPhoneFrame>
  );
}

function DirB_AdminTV({ mode = 'light', logoFont = 'fraunces', t = WP_I18N.rio, names = 'Nacho & Flor' }) {
  const m = WP_MODE[mode];
  const tiles = [
    { k: 'bingo', pl: 42, act: 'En curso · 6/25 promedio' },
    { k: 'quiz', pl: 38, act: 'Próxima ronda en 40s' },
    { k: 'guess', pl: 51, act: '7 preguntas jugadas' },
    { k: 'wishes', pl: 72, act: '34 deseos enviados' },
    { k: 'photo', pl: 29, act: '18 fotos subidas' },
    { k: 'playlist', pl: 44, act: '26 canciones votadas' },
  ];
  return (
    <WPTVFrame mode={mode}>
      <div style={{ height: '100%', padding: 28, display: 'flex', flexDirection: 'column' }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: 16, borderBottom: `2px solid ${m.ink}`, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, color: m.inkSoft, textTransform: 'uppercase', marginBottom: 4 }}>PANEL DE NOVIOS · EN VIVO</div>
            <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 40, letterSpacing: -1.2, lineHeight: 0.9 }}>
              {names.split(' & ')[0]} <span style={{ fontStyle: 'italic', color: 'oklch(0.62 0.22 358)', fontWeight: 600 }}>&amp;</span> {names.split(' & ')[1]}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: m.inkSoft }}>INVITADOS</div>
              <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 32, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>84</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: m.inkSoft }}>JUEGOS</div>
              <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 32, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>07</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: m.inkSoft }}>PUNTOS</div>
              <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 32, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: 'oklch(0.62 0.22 358)' }}>12.4K</div>
            </div>
          </div>
        </div>
        {/* grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '1fr 1fr', gap: 12 }}>
          {tiles.map((t0) => {
            const g = WP_GAMES[t0.k];
            return (
              <div key={t0.k} style={{ border: `1.5px solid ${m.line}`, borderRadius: 4, padding: 14, display: 'flex', flexDirection: 'column', background: m.card, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 10, right: 10, width: 40, height: 40, borderRadius: 8, background: g.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <WPGameGlyph game={t0.k} size={28} />
                </div>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: g.c, textTransform: 'uppercase' }}>● ACTIVO</div>
                <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 20, letterSpacing: -0.5, lineHeight: 1, margin: '8px 0 4px' }}>{g.name}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: m.inkSoft, marginBottom: 'auto' }}>{t0.act}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, paddingTop: 8, borderTop: `1px solid ${m.line}` }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 800, color: m.inkSoft, letterSpacing: 0.5 }}>JUGANDO</div>
                    <div style={{ fontFamily: WP_LOGO_FONTS[logoFont].family, fontWeight: 900, fontSize: 24, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{t0.pl}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ padding: '4px 8px', background: m.ink, color: m.bg, fontSize: 9, fontWeight: 900, letterSpacing: 0.8, borderRadius: 2 }}>PAUSAR</div>
                    <div style={{ padding: '4px 8px', background: g.c, color: '#fff', fontSize: 9, fontWeight: 900, letterSpacing: 0.8, borderRadius: 2 }}>VER</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 14, borderTop: `1.5px solid ${m.ink}`, fontSize: 10, fontWeight: 800, letterSpacing: 1, color: m.inkSoft }}>
          <span>SALA · <span style={{ color: m.ink, fontFamily: 'ui-monospace, monospace' }}>NACHOFLOR22</span></span>
          <span>🔴 LIVE · 22:14</span>
          <span>wedplay.ar/nachoflor</span>
        </div>
      </div>
    </WPTVFrame>
  );
}

Object.assign(window, { DirB_Home, DirB_GuestLogin, DirB_AdminLogin, DirB_GuessWho, DirB_Wishes, DirB_AdminTV });
