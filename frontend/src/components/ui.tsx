import React from 'react'

// ─── Section card ─────────────────────────────────────────────────────────────

interface SectionProps {
  title: string
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Section({ title, children, style }: SectionProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: 24,
      marginBottom: 20,
      ...style,
    }}>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        color: 'var(--accent)',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {title}
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      {children}
    </div>
  )
}

// ─── Alert ────────────────────────────────────────────────────────────────────

type AlertVariant = 'info' | 'ok' | 'warn' | 'err'

const alertColors: Record<AlertVariant, { bg: string; border: string; color: string }> = {
  info: { bg: 'rgba(0,212,255,0.07)', border: 'rgba(0,212,255,0.2)', color: 'var(--accent)' },
  ok:   { bg: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.2)', color: 'var(--accent3)' },
  warn: { bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.2)', color: 'var(--warn)' },
  err:  { bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.2)', color: 'var(--danger)' },
}

export function Alert({ variant = 'info', children, style }: { variant?: AlertVariant; children: React.ReactNode; style?: React.CSSProperties }) {
  const c = alertColors[variant]
  return (
    <div style={{
      borderRadius: 6,
      padding: '12px 16px',
      fontSize: 13,
      marginBottom: 16,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      background: c.bg,
      border: `1px solid ${c.border}`,
      color: c.color,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Button ──────────────────────────────────────────────────────────────────

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md'
}

export function Btn({ variant = 'primary', size = 'md', children, style, ...rest }: BtnProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: 'none',
    borderRadius: 6,
    fontFamily: 'var(--sans)',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: 0.3,
    transition: 'all .2s',
    padding: size === 'sm' ? '6px 14px' : '10px 22px',
    fontSize: size === 'sm' ? 12 : 13,
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#000' },
    secondary: {
      background: 'var(--surface2)',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    danger: {
      background: 'rgba(239,68,68,0.1)',
      color: 'var(--danger)',
      border: '1px solid rgba(239,68,68,0.2)',
    },
  }

  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {children}
    </button>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────

export function Input({
  label,
  style,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && <label style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</label>}
      <input
        {...rest}
        style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text)',
          fontFamily: 'var(--mono)',
          fontSize: 13,
          padding: '8px 12px',
          outline: 'none',
        }}
      />
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────

export function Select({
  label,
  options,
  style,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {label && <label style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</label>}
      <select
        {...rest}
        style={{
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          color: 'var(--text)',
          fontFamily: 'var(--mono)',
          fontSize: 13,
          padding: '8px 12px',
          outline: 'none',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Chip row ─────────────────────────────────────────────────────────────────

export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(0,212,255,0.12)' : 'var(--surface2)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 20,
        padding: '4px 14px',
        fontSize: 12,
        color: active ? 'var(--accent)' : 'var(--text2)',
        cursor: 'pointer',
        transition: 'all .15s',
      }}
    >
      {children}
    </button>
  )
}

// ─── Step list ───────────────────────────────────────────────────────────────

export function StepList({ steps }: { steps: { step: string; description: string }[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          display: 'flex',
          gap: 12,
          padding: '10px 14px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          borderLeft: '3px solid var(--accent)',
        }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--accent)',
            minWidth: 80,
            letterSpacing: 0.5,
          }}>
            {i + 1}. {s.step}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{s.description}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Mono badge ──────────────────────────────────────────────────────────────

export function MonoBadge({ children, color = 'var(--accent)' }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontFamily: 'var(--mono)',
      fontSize: 12,
      color,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: 4,
      padding: '2px 8px',
    }}>
      {children}
    </span>
  )
}

// ─── Matrix table ─────────────────────────────────────────────────────────────

export function MatrixTable({
  data,
  rowLabels,
  colLabels,
  highlight,
}: {
  data: number[][]
  rowLabels?: string[]
  colLabels?: string[]
  highlight?: (v: number) => string
}) {
  const defaultHighlight = (v: number) => {
    if (v >= 0.8) return 'var(--danger)'
    if (v >= 0.6) return 'var(--warn)'
    if (v >= 0.4) return 'var(--accent3)'
    return 'var(--text2)'
  }
  const hl = highlight ?? defaultHighlight

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
        <thead>
          <tr>
            <th style={thStyle}></th>
            {(colLabels ?? data[0]?.map((_, j) => `C${j + 1}`) ?? []).map((h, j) => (
              <th key={j} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <th style={{ ...thStyle, textAlign: 'left', paddingLeft: 10 }}>
                {rowLabels?.[i] ?? `R${i + 1}`}
              </th>
              {row.map((v, j) => (
                <td key={j} style={{
                  ...tdStyle,
                  color: hl(v),
                  fontFamily: 'var(--mono)',
                  fontWeight: v >= 0.7 ? 600 : 400,
                }}>
                  {v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  background: 'var(--surface2)',
  color: 'var(--text2)',
  fontFamily: 'var(--mono)',
  fontSize: 11,
  letterSpacing: 1,
  textTransform: 'uppercase',
  padding: '10px 12px',
  textAlign: 'center',
  border: '1px solid var(--border)',
  whiteSpace: 'nowrap',
}

const tdStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  padding: '6px 10px',
  textAlign: 'center',
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

export function Spinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      color: 'var(--text2)',
      fontFamily: 'var(--mono)',
      fontSize: 13,
      gap: 10,
    }}>
      <div style={{
        width: 16,
        height: 16,
        border: '2px solid var(--border)',
        borderTop: '2px solid var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      Вычисление...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
