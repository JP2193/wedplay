// tokens.jsx — shared design tokens for WedPlay
// Colors per game, font stacks, modes. Bold festive palette, saturated but tuned.

const WP_GAMES = {
  bingo:    { key: 'bingo',    name: 'Bingo Humano',  hue: 340, c: 'oklch(0.68 0.22 358)',  c2: 'oklch(0.78 0.18 28)',   ink: '#fff', soft: 'oklch(0.95 0.04 358)' },
  quiz:     { key: 'quiz',     name: 'Quiz',          hue: 160, c: 'oklch(0.68 0.15 165)',  c2: 'oklch(0.78 0.14 180)',  ink: '#fff', soft: 'oklch(0.94 0.04 165)' },
  guess:    { key: 'guess',    name: 'Adivina Quién', hue: 280, c: 'oklch(0.63 0.20 290)',  c2: 'oklch(0.72 0.18 310)',  ink: '#fff', soft: 'oklch(0.95 0.04 290)' },
  wishes:   { key: 'wishes',   name: 'Deseos',        hue: 45,  c: 'oklch(0.76 0.16 70)',   c2: 'oklch(0.82 0.15 55)',   ink: '#3a2a10', soft: 'oklch(0.96 0.05 70)' },
  timeline: { key: 'timeline', name: 'Timeline',      hue: 210, c: 'oklch(0.62 0.16 230)',  c2: 'oklch(0.75 0.14 210)',  ink: '#fff', soft: 'oklch(0.94 0.04 230)' },
  photo:    { key: 'photo',    name: 'Foto Challenge',hue: 20,  c: 'oklch(0.68 0.20 30)',   c2: 'oklch(0.78 0.18 45)',   ink: '#fff', soft: 'oklch(0.95 0.05 30)' },
  playlist: { key: 'playlist', name: 'Playlist',      hue: 130, c: 'oklch(0.66 0.18 140)',  c2: 'oklch(0.78 0.16 125)',  ink: '#fff', soft: 'oklch(0.94 0.05 140)' },
};

const WP_MODE = {
  light: {
    bg: 'oklch(0.985 0.008 80)',       // warm ivory
    bgAlt: 'oklch(0.97 0.012 75)',
    ink: 'oklch(0.22 0.02 50)',
    inkSoft: 'oklch(0.45 0.02 50)',
    line: 'oklch(0.88 0.02 70)',
    card: '#fff',
  },
  dark: {
    bg: 'oklch(0.19 0.015 40)',        // warm charcoal
    bgAlt: 'oklch(0.24 0.018 40)',
    ink: 'oklch(0.96 0.01 70)',
    inkSoft: 'oklch(0.72 0.015 60)',
    line: 'oklch(0.32 0.02 50)',
    card: 'oklch(0.24 0.02 40)',
  },
};

// Two logo type treatments (A + B are font pairings; used in tweaks)
const WP_LOGO_FONTS = {
  unbounded: { family: '"Unbounded", system-ui', weight: 800, letter: '-0.04em', url: 'https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700;800;900&display=swap' },
  fraunces:  { family: '"Fraunces", Georgia, serif', weight: 900, letter: '-0.03em', url: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,900,100&display=swap' },
  redaction: { family: '"Bricolage Grotesque", system-ui', weight: 800, letter: '-0.045em', url: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@10..48,700;10..48,800&display=swap' },
};

const WP_I18N = {
  rio: {
    play: 'Jugá',
    admin: 'Admin',
    tagline: 'Juegos para tu boda',
    guestsIn: 'Entrar como invitado',
    adminIn: 'Soy novio / admin',
    scan: 'Escaneá el QR o ingresá el código',
    yourName: '¿Cómo te llamás?',
    eventCode: 'Código del evento',
    join: 'Entrar a la fiesta',
    email: 'Email',
    password: 'Clave',
    enter: 'Ingresar',
    back: '← Volver',
    live: 'EN VIVO',
    players: 'jugando',
    round: 'Ronda',
    start: 'Arrancar',
    skip: 'Saltar',
    submit: 'Enviar',
    leaderboard: 'Ranking',
    wish: 'Dejales un deseo',
    send: 'Enviar deseo',
  },
  neutro: {
    play: 'Juega',
    admin: 'Admin',
    tagline: 'Juegos para tu boda',
    guestsIn: 'Entrar como invitado',
    adminIn: 'Soy novio / admin',
    scan: 'Escanea el QR o ingresa el código',
    yourName: '¿Cómo te llamas?',
    eventCode: 'Código del evento',
    join: 'Entrar a la fiesta',
    email: 'Email',
    password: 'Contraseña',
    enter: 'Ingresar',
    back: '← Volver',
    live: 'EN VIVO',
    players: 'jugando',
    round: 'Ronda',
    start: 'Comenzar',
    skip: 'Saltar',
    submit: 'Enviar',
    leaderboard: 'Ranking',
    wish: 'Déjales un deseo',
    send: 'Enviar deseo',
  },
};

// Confetti-like decorative shapes for backgrounds — SVG strings
function wpConfetti(seed = 1, count = 28, hues = [340, 45, 160, 280, 20, 130]) {
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = rnd() * 100, y = rnd() * 100;
    const h = hues[Math.floor(rnd() * hues.length)];
    const r = 2 + rnd() * 6;
    const shape = Math.floor(rnd() * 3);
    const rot = Math.floor(rnd() * 180);
    const c = `oklch(0.72 0.18 ${h})`;
    if (shape === 0) out += `<circle cx="${x}" cy="${y}" r="${r * 0.35}" fill="${c}"/>`;
    else if (shape === 1) out += `<rect x="${x}" y="${y}" width="${r}" height="${r * 0.5}" rx="0.5" fill="${c}" transform="rotate(${rot} ${x} ${y})"/>`;
    else out += `<path d="M${x} ${y - r * 0.5} L${x + r * 0.5} ${y} L${x} ${y + r * 0.5} L${x - r * 0.5} ${y} Z" fill="${c}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${out}</svg>`;
}

Object.assign(window, { WP_GAMES, WP_MODE, WP_LOGO_FONTS, WP_I18N, wpConfetti });
