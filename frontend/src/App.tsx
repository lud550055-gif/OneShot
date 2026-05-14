import React, { useState } from 'react'
import FuzzySets from './components/FuzzySets'
import FuzzyInference from './components/FuzzyInference'
import DecisionTree from './components/DecisionTree'
import Architecture from './components/Architecture'

type Tab = 'fuzzy-sets' | 'fuzzy-inference' | 'decision-tree' | 'architecture'

const TABS: { id: Tab; label: string; badge: string }[] = [
  { id: 'fuzzy-sets', label: 'Нечёткие множества', badge: 'ПР №1' },
  { id: 'fuzzy-inference', label: 'Нечёткий вывод', badge: 'ПР №2' },
  { id: 'decision-tree', label: 'Дерево решений', badge: 'Лекция' },
  { id: 'architecture', label: 'Архитектура СППР', badge: 'Лекция 2' },
]

const styles = {
  app: {
    position: 'relative' as const,
    zIndex: 1,
    minHeight: '100vh',
  },
  header: {
    padding: '40px 0 0',
    borderBottom: '1px solid var(--border)',
  },
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(0,212,255,0.08)',
    border: '1px solid rgba(0,212,255,0.2)',
    borderRadius: 4,
    padding: '4px 12px',
    fontFamily: 'var(--mono)',
    fontSize: 11,
    color: 'var(--accent)',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    marginBottom: 16,
  },
  h1: {
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    color: 'var(--text2)',
    fontSize: 15,
    fontWeight: 300,
    marginBottom: 24,
  },
  tabs: {
    display: 'flex',
    gap: 2,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: 4,
    width: 'fit-content',
  },
  tab: (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    border: 'none',
    background: active ? 'var(--accent)' : 'none',
    color: active ? '#000' : 'var(--text2)',
    fontFamily: 'var(--sans)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    borderRadius: 5,
    letterSpacing: 0.3,
    transition: 'all .2s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }),
  tabBadge: (active: boolean): React.CSSProperties => ({
    fontSize: 9,
    padding: '1px 6px',
    borderRadius: 3,
    background: active ? 'rgba(0,0,0,0.2)' : 'var(--surface2)',
    color: active ? '#000' : 'var(--text3)',
    fontFamily: 'var(--mono)',
    letterSpacing: 1,
  }),
  content: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px',
    paddingTop: 32,
    paddingBottom: 48,
  },
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('fuzzy-sets')

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.container}>
          <div style={styles.badge}>⬡ Decision Support System</div>
          <h1 style={styles.h1}>
            СППР — <span style={{ color: 'var(--accent)' }}>Интеллектуальные методы ИБ</span>
          </h1>
          <p style={styles.subtitle}>
            Нечёткие множества · Нечёткий логический вывод · Деревья решений · Архитектура СППР
          </p>

          <div style={styles.tabs}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                style={styles.tab(activeTab === tab.id)}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                <span style={styles.tabBadge(activeTab === tab.id)}>{tab.badge}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={styles.content}>
        {activeTab === 'fuzzy-sets' && <FuzzySets />}
        {activeTab === 'fuzzy-inference' && <FuzzyInference />}
        {activeTab === 'decision-tree' && <DecisionTree />}
        {activeTab === 'architecture' && <Architecture />}
      </div>
    </div>
  )
}
