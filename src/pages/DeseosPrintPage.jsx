import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getRoomByCode } from '../lib/rooms'

const P = {
  bg:       '#f6f0e3',
  bgGrad:   'linear-gradient(135deg, #f6f0e3 0%, #f9f3e6 50%, #efe4cc 100%)',
  cardBg:   '#f1e4c4',
  ink:      '#2a2114',
  inkSoft:  '#6b5a3a',
  accent:   '#a8843a',
  quote:    '#c9a876',
}

// A4 proportions: 595x842pt → scaled display
const PAGE_W = 480
const PAGE_H = 678

/* ─── PageShell ───────────────────────────────────────────── */
function PageShell({ children, useGrad = false }) {
  return (
    <div style={{
      width: PAGE_W,
      height: PAGE_H,
      background: useGrad ? P.bgGrad : '#ffffff',
      boxShadow: '0 1px 2px rgba(0,0,0,.06), 0 12px 36px rgba(0,0,0,.08)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"DM Sans", system-ui, sans-serif',
    }}>
      {children}
    </div>
  )
}

/* ─── PageLabel ───────────────────────────────────────────── */
function PageLabel({ n, total, label }) {
  return (
    <div className="no-print" style={{
      fontSize: 10,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: '#9a9893',
      display: 'flex',
      gap: 10,
      alignItems: 'center',
    }}>
      <span style={{ width: 24, height: 1, background: 'rgba(0,0,0,0.12)', display: 'block' }} />
      {String(n).padStart(2, '0')} / {String(total).padStart(2, '0')} · {label}
      <span style={{ width: 24, height: 1, background: 'rgba(0,0,0,0.12)', display: 'block' }} />
    </div>
  )
}

/* ─── CoverPage ───────────────────────────────────────────── */
function CoverPage({ room, wishCount }) {
  return (
    <PageShell useGrad>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 50px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 10,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: P.inkSoft,
          marginBottom: 32,
          fontFamily: '"DM Sans", system-ui, sans-serif',
        }}>
          Libro de deseos
        </div>

        <div style={{ width: 60, height: 1, background: P.accent, opacity: 0.5, marginBottom: 28 }} />

        <div style={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontSize: 52,
          fontWeight: 300,
          color: P.ink,
          lineHeight: 1.05,
          fontStyle: 'italic',
          letterSpacing: '-0.5px',
        }}>
          {room?.event_name ?? 'Nuestros Deseos'}
        </div>

        <div style={{ width: 60, height: 1, background: P.accent, opacity: 0.5, marginTop: 28, marginBottom: 20 }} />

        {room?.event_date && (
          <div style={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontStyle: 'italic',
            fontSize: 15,
            color: P.inkSoft,
            marginBottom: 4,
          }}>
            {new Date(room.event_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}

        <div style={{
          position: 'absolute',
          bottom: 48,
          left: 0, right: 0,
          textAlign: 'center',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: P.inkSoft,
          opacity: 0.6,
          fontFamily: '"DM Sans", system-ui, sans-serif',
        }}>
          {wishCount} mensajes de quienes nos acompañaron
        </div>
      </div>
    </PageShell>
  )
}

/* ─── PdfWishCell ─────────────────────────────────────────── */
function PdfWishCell({ wish }) {
  const maxChars = 280
  const truncated = wish.message.length > maxChars
    ? wish.message.slice(0, maxChars).trimEnd() + '…'
    : wish.message

  const hora = new Date(wish.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{
      borderLeft: `2px solid ${P.accent}`,
      paddingLeft: 14,
      paddingTop: 4,
      paddingBottom: 4,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      overflow: 'hidden',
    }}>
      <div>
        <span style={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontSize: 26,
          color: P.quote,
          lineHeight: 0.6,
          display: 'block',
          marginBottom: 6,
          userSelect: 'none',
        }}>&ldquo;</span>
        <p style={{
          margin: 0,
          fontFamily: '"Fraunces", Georgia, serif',
          fontSize: 11,
          lineHeight: 1.5,
          color: P.ink,
          fontWeight: 400,
        }}>
          {truncated}
        </p>
      </div>
      <div style={{ marginTop: 10 }}>
        <div style={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 11,
          color: P.accent,
          fontWeight: 500,
        }}>
          — {wish.display_name || wish.guest_name}
        </div>
      </div>
    </div>
  )
}

/* ─── InternalPage ────────────────────────────────────────── */
function InternalPage({ wishes, room, pageNum, totalPages }) {
  const dateStr = room?.event_date
    ? new Date(room.event_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <PageShell>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 28, left: 36, right: 36,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingBottom: 14,
        borderBottom: `1px solid ${P.inkSoft}22`,
      }}>
        <div style={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 13,
          color: P.ink,
        }}>
          {room?.event_name ?? ''}
        </div>
        <div style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 8,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: P.inkSoft,
        }}>
          Libro de deseos
        </div>
      </div>

      {/* Grid 2×2 */}
      <div style={{
        position: 'absolute',
        top: 72, bottom: 52,
        left: 36, right: 36,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 18,
      }}>
        {wishes.map(w => <PdfWishCell key={w.id} wish={w} />)}
        {Array.from({ length: 4 - wishes.length }).map((_, i) => <div key={`empty-${i}`} />)}
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: 24, left: 36, right: 36,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontSize: 8,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: P.inkSoft,
      }}>
        <span>{dateStr}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          · {pageNum} / {totalPages} ·
        </span>
      </div>
    </PageShell>
  )
}

/* ─── BackPage ────────────────────────────────────────────── */
function BackPage({ room, wishes }) {
  const dateStr = room?.event_date
    ? new Date(room.event_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <PageShell useGrad>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 60px 160px',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 10,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: P.inkSoft,
          marginBottom: 24,
        }}>
          Gracias
        </div>

        <div style={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 20,
          fontWeight: 300,
          color: P.ink,
          lineHeight: 1.45,
          marginBottom: 28,
          maxWidth: 300,
        }}>
          Por estar, por venir, por escribir. Estas palabras nos van a acompañar siempre.
        </div>

        <div style={{ width: 40, height: 1, background: P.accent, opacity: 0.5, marginBottom: 20 }} />

        <div style={{
          fontFamily: '"Fraunces", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 15,
          color: P.accent,
        }}>
          {room?.event_name ?? ''}
        </div>

        {dateStr && (
          <div style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: 9,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: P.inkSoft,
            marginTop: 6,
          }}>
            {dateStr}
          </div>
        )}
      </div>

      {/* Índice de autores */}
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: 52, right: 52,
      }}>
        <div style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 8,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: P.inkSoft,
          marginBottom: 10,
          opacity: 0.7,
          textAlign: 'center',
        }}>
          Índice de mensajes
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3px 20px',
        }}>
          {wishes.map(w => {
            const hora = new Date(w.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            return (
              <div key={w.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderBottom: `1px dotted ${P.inkSoft}33`,
                paddingBottom: 2,
              }}>
                <span style={{
                  fontFamily: '"Fraunces", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 9,
                  color: P.ink,
                }}>
                  {w.display_name || w.guest_name}
                </span>
                <span style={{
                  fontFamily: '"DM Sans", system-ui, sans-serif',
                  fontSize: 9,
                  color: P.inkSoft,
                }}>
                  {hora}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}

/* ─── DeseosWishPrintPage ─────────────────────────────── */
export default function DeseosWishPrintPage() {
  const { code } = useParams()
  const [room, setRoom] = useState(null)
  const [wishes, setWishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { init() }, [code])

  async function init() {
    const roomData = await getRoomByCode(code)
    if (!roomData) { setError('Cuarto no encontrado.'); setLoading(false); return }
    setRoom(roomData)

    const { data } = await supabase
      .from('wishes').select('*')
      .eq('room_id', roomData.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: true })
    if (data) setWishes(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.bgGrad }}>
      <p style={{ color: P.inkSoft, fontSize: 13, fontFamily: '"DM Sans", system-ui, sans-serif' }}>Cargando deseos...</p>
    </div>
  )
  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: P.bgGrad, padding: 32 }}>
      <p style={{ color: P.inkSoft, textAlign: 'center', fontFamily: '"DM Sans", system-ui, sans-serif' }}>{error}</p>
    </div>
  )

  // Distribuir deseos en páginas: 4 por página
  const perPage = 4
  const internalPages = []
  for (let i = 0; i < wishes.length; i += perPage) {
    internalPages.push(wishes.slice(i, i + perPage))
  }
  const totalPages = internalPages.length + 2 // portada + internas + contraportada

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=DM+Sans:wght@400;500;600&display=swap');
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; }
          @page { margin: 0; size: A4 portrait; }
          .print-book {
            padding: 0 !important;
            gap: 0 !important;
            background: transparent !important;
            display: block !important;
            min-height: 0 !important;
          }
          .print-page {
            break-after: page;
            page-break-after: always;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .print-page:last-child {
            break-after: avoid;
            page-break-after: avoid;
          }
          .print-page > div {
            width: 100% !important;
            height: 100% !important;
            box-shadow: none !important;
          }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* Barra de acción — oculta al imprimir */}
      <div
        className="no-print"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(250,249,247,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${P.quote}44`,
          padding: '14px 28px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: '"DM Sans", system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 13, color: P.inkSoft }}>
          <strong style={{ color: P.ink }}>{wishes.length}</strong> deseos
          {' · '}
          <strong style={{ color: P.ink }}>{totalPages}</strong> páginas
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.close()}
            style={{
              fontSize: 12, fontWeight: 500, padding: '7px 14px', borderRadius: 8,
              border: `1px solid ${P.quote}66`, background: 'transparent',
              color: P.inkSoft, cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
          <button
            onClick={() => window.print()}
            style={{
              fontSize: 12, fontWeight: 600, padding: '7px 18px', borderRadius: 8,
              border: 'none', background: P.accent, color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M6 1v8M3 6l3 3 3-3M2 11h8" />
            </svg>
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Libro */}
      <div className="print-book" style={{
        background: '#e8e6e0',
        minHeight: '100vh',
        paddingTop: 80,
        paddingBottom: 60,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        fontFamily: '"DM Sans", system-ui, sans-serif',
      }}>
        <PageLabel n={1} total={totalPages} label="Portada" />
        <div className="print-page">
          <CoverPage room={room} wishCount={wishes.length} />
        </div>

        {wishes.length === 0 ? (
          <div className="no-print" style={{ color: P.inkSoft, fontSize: 13, padding: '40px 0' }}>
            No hay deseos aprobados todavía.
          </div>
        ) : (
          internalPages.map((pageWishes, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <PageLabel n={i + 2} total={totalPages} label={`Página ${i + 1}`} />
              <div className="print-page">
                <InternalPage
                  wishes={pageWishes}
                  room={room}
                  pageNum={i + 1}
                  totalPages={internalPages.length}
                />
              </div>
            </div>
          ))
        )}

        <PageLabel n={totalPages} total={totalPages} label="Contraportada" />
        <div className="print-page">
          <BackPage room={room} wishes={wishes} />
        </div>
      </div>
    </>
  )
}
