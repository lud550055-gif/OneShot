import React, { useState } from 'react'
import { Section, Alert, MonoBadge } from '../ui'

const LAYERS = [
  {
    id: 'eis',
    name: 'EIS / Интерфейс конечного пользователя',
    acronym: 'EIS',
    color: '#00d4ff',
    description: 'Executive Information System — React-приложение, предоставляющее интерактивный интерфейс аналитика ИБ.',
    components: [
      'React 18 + TypeScript + Vite',
      'Recharts — визуализация нечётких МФ, деревьев решений, диаграмм',
      'Модуль «Нечёткие множества» (Практическая работа №1)',
      'Модуль «Нечёткий логический вывод» (Практическая работа №2)',
      'Модуль «Дерево решений ID3» (Лекция)',
      'Nginx — раздача статики и проксирование /api',
    ],
    tech: ['React 18', 'TypeScript', 'Vite', 'Recharts', 'Nginx'],
  },
  {
    id: 'olap',
    name: 'OLAP / Аналитический движок',
    acronym: 'OLAP',
    color: '#7c3aed',
    description: 'On-Line Analytical Processing — Go/Gin-сервис, реализующий алгоритмы мягких вычислений и предоставляющий REST API.',
    components: [
      'Go 1.22 + Gin — REST API сервер',
      'Алгоритмы нечётких множеств: T-нормы, S-нормы, модификаторы, состав. отношений',
      'Нечёткий вывод: Мамдани, Ларсен, Такаги-Сугено + 4 метода дефаззификации',
      'Дерево решений ID3: энтропия, информационный прирост, Gini-индекс',
      'Сохранение истории вычислений в PostgreSQL',
      'CORS middleware, /health endpoint',
    ],
    tech: ['Go', 'Gin', 'REST API', 'ID3', 'Fuzzy Logic'],
  },
  {
    id: 'dm',
    name: 'Data Mining / Интеллектуальный анализ',
    acronym: 'DM',
    color: '#10b981',
    description: 'Реализованные алгоритмы машинного обучения и интеллектуального анализа данных в предметной области ИБ.',
    components: [
      'Обнаружение вторжений (IDS) — нечёткий вывод Мамдани',
      'Оценка риска доступа — вывод Ларсена',
      'Классификация инцидентов — Такаги-Сугено',
      'Обнаружение малвари — дерево решений (api_calls, entropy, packer)',
      'Обнаружение фишинга — дерево решений (url_length, ip, domain_age)',
      'Аномалии сети — дерево решений (DDoS vs normal)',
    ],
    tech: ['Fuzzy ID3', 'Mamdani', 'Larsen', 'Sugeno', 'Entropy'],
  },
  {
    id: 'dwh',
    name: 'DWH / Хранилище данных',
    acronym: 'DWH',
    color: '#f59e0b',
    description: 'Data Warehouse — PostgreSQL 16, хранит историю вычислений, обучающие выборки и параметры задач.',
    components: [
      'PostgreSQL 16 — основная СУБД',
      'Таблица calculation_history (id, module, method, input JSONB, output JSONB, created_at)',
      'Индекс на module и created_at для быстрой фильтрации',
      'Обучающие данные задач ИБ (4×10 выборок)',
      'Graceful degradation — система работает без БД',
    ],
    tech: ['PostgreSQL 16', 'JSONB', 'Docker Volume'],
  },
  {
    id: 'infra',
    name: 'Инфраструктура / DevOps',
    acronym: 'INFRA',
    color: '#ef4444',
    description: 'Docker Compose оркестрация 4 сервисов с healthcheck-зависимостями и изолированными сетями.',
    components: [
      'Docker Compose — оркестрация контейнеров',
      'Nginx — reverse proxy: / → frontend:80, /api/ → backend:8080',
      'Backend Dockerfile: multi-stage (golang:1.22-alpine → alpine:3.19)',
      'Frontend Dockerfile: multi-stage (node:20-alpine → nginx:alpine)',
      'Postgres healthcheck (pg_isready) перед стартом backend',
      'postgres_data volume для персистентности данных',
    ],
    tech: ['Docker', 'Docker Compose', 'Nginx', 'Alpine'],
  },
]

const DATA_FLOWS = [
  { from: 'Пользователь', to: 'EIS (React)', desc: 'Ввод параметров нечётких переменных, выбор задачи ИБ' },
  { from: 'EIS (React)', to: 'Nginx', desc: 'HTTP-запросы: GET /api/v1/inference/tasks, POST /api/v1/inference/run' },
  { from: 'Nginx', to: 'OLAP (Go/Gin)', desc: 'Проксирование /api/* → backend:8080' },
  { from: 'OLAP (Go/Gin)', to: 'DM (Алгоритмы)', desc: 'Вызов fuzzy_inference.RunMamdani / decision_tree.BuildDecisionTree' },
  { from: 'OLAP (Go/Gin)', to: 'DWH (PostgreSQL)', desc: 'INSERT INTO calculation_history (JSONB payload)' },
  { from: 'DM (Алгоритмы)', to: 'OLAP (Go/Gin)', desc: 'InferenceResponse: crispOutput, steps, activations, accumulatedMF' },
  { from: 'OLAP (Go/Gin)', to: 'EIS (React)', desc: 'JSON-ответ с результатами и пошаговым объяснением' },
  { from: 'EIS (React)', to: 'Пользователь', desc: 'Визуализация: МФ, дерево решений SVG, диаграммы информационного прироста' },
]

const DECISION_PROCESS = [
  {
    step: '1. Ввод данных',
    desc: 'Аналитик выбирает задачу ИБ (IDS, контроль доступа, обнаружение малвари) и вводит наблюдаемые значения признаков через UI-контролы.',
    icon: '📥',
  },
  {
    step: '2. Фаззификация',
    desc: 'Чёткие числовые значения преобразуются в нечёткие: μ_низкий(650) = 0.0, μ_средний(650) = 0.35, μ_высокий(650) = 0.65.',
    icon: '〰️',
  },
  {
    step: '3. Нечёткий вывод',
    desc: 'База правил активируется: ЕСЛИ packet_rate=HIGH И entropy=HIGH ТО threat=CRITICAL (α = min(0.65, 0.72) = 0.65).',
    icon: '⚙️',
  },
  {
    step: '4. Дефаззификация',
    desc: 'Аккумулированная нечёткая область сворачивается в чёткое число методом COG/MOM. Например: threat_level = 87.3.',
    icon: '🎯',
  },
  {
    step: '5. Классификация',
    desc: 'При необходимости запускается дерево решений ID3 для категориальной классификации (benign/malware, P1-P4).',
    icon: '🌳',
  },
  {
    step: '6. Рекомендация',
    desc: 'Система выдаёт ЛПР лингвистическую оценку и путь принятия решения для аудита и объяснимости.',
    icon: '📊',
  },
]

const MODULES = [
  { id: 'м1', name: 'Нечёткие множества', ref: 'Практическая работа №1', color: '#00d4ff', desc: 'Функции принадлежности, T/S-нормы, модификаторы, состав. отношений' },
  { id: 'м2', name: 'Нечёткий вывод', ref: 'Практическая работа №2', color: '#7c3aed', desc: 'Мамдани, Ларсен, Такаги-Сугено + 4 метода дефаззификации' },
  { id: 'м3', name: 'Дерево решений', ref: 'Лекция «Деревья решений»', color: '#10b981', desc: 'ID3: энтропия Шеннона, информационный прирост, Gini, IF-THEN правила' },
  { id: 'м4', name: 'Архитектура СППР', ref: 'Лекция 2', color: '#f59e0b', desc: 'DWH + OLAP + DM + EIS — логическая архитектура системы' },
]

export default function Architecture() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null)

  const active = LAYERS.find(l => l.id === activeLayer) ?? null

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'var(--surface2)',
        borderLeft: '3px solid var(--warn)',
        padding: '12px 16px',
        borderRadius: '0 6px 6px 0',
        fontSize: 13,
        color: 'var(--text2)',
        lineHeight: 1.6,
        marginBottom: 20,
      }}>
        <strong style={{ color: 'var(--text)' }}>Логическая архитектура учебной СППР</strong> — реализована по модели{' '}
        <em>DWH → OLAP → Data Mining → EIS</em> (Лекция 2). Кликните на слой для просмотра компонентов.
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {['DWH', 'OLAP', 'Data Mining', 'EIS', 'Docker Compose', 'REST API', 'Нечёткий вывод', 'ID3'].map(s => (
            <span key={s} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Layer pyramid */}
      <Section title="01 / Архитектурные слои СППР">
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
          Система построена по классической четырёхуровневой архитектуре Лекции 2. Кликните на слой для детального описания.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {LAYERS.map((layer, i) => (
            <div
              key={layer.id}
              onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
              style={{
                background: activeLayer === layer.id ? `${layer.color}12` : 'var(--surface2)',
                border: `1px solid ${activeLayer === layer.id ? layer.color : 'var(--border)'}`,
                borderLeft: `4px solid ${layer.color}`,
                borderRadius: 8,
                padding: '14px 18px',
                cursor: 'pointer',
                transition: 'all .2s',
                marginLeft: `${i * 12}px`,
                marginRight: `${i * 12}px`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <MonoBadge color={layer.color}>{layer.acronym}</MonoBadge>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{layer.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {layer.tech.slice(0, 3).map(t => (
                    <span key={t} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 6px' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {activeLayer === layer.id && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.6 }}>{layer.description}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {layer.components.map((c, ci) => (
                      <div key={ci} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: layer.color, fontFamily: 'var(--mono)', fontSize: 12, minWidth: 16, marginTop: 1 }}>▸</span>
                        <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                    {layer.tech.map(t => (
                      <span key={t} style={{ fontFamily: 'var(--mono)', fontSize: 11, color: layer.color, background: `${layer.color}18`, border: `1px solid ${layer.color}40`, borderRadius: 3, padding: '2px 8px' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Data flow */}
      <Section title="02 / Поток данных в системе">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {DATA_FLOWS.map((flow, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg)', flexShrink: 0, marginTop: 16 }} />
                {i < DATA_FLOWS.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--border)', minHeight: 16 }} />}
              </div>
              <div style={{ flex: 1, padding: '10px 12px', marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 2 }}>
                  {flow.from} → {flow.to}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{flow.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Decision process */}
      <Section title="03 / Процесс принятия решений">
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Шесть этапов от ввода наблюдаемых данных до формирования рекомендации ЛПР.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {DECISION_PROCESS.map((step, i) => (
            <div key={i} style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 16,
              borderTop: `3px solid var(--accent)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{step.icon}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{step.step}</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Module summary */}
      <Section title="04 / Реализованные модули">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {MODULES.map(m => (
            <div key={m.id} style={{
              background: `${m.color}08`,
              border: `1px solid ${m.color}40`,
              borderRadius: 8,
              padding: 18,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: m.color, background: `${m.color}20`, border: `1px solid ${m.color}40`, borderRadius: 4, padding: '2px 8px' }}>
                  {m.id.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 8 }}>{m.ref}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* System info */}
      <Section title="05 / Технический стек">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { label: 'Frontend', value: 'React 18 + TypeScript + Vite', color: 'var(--accent)' },
            { label: 'Charts', value: 'Recharts 2.12', color: 'var(--accent)' },
            { label: 'Backend', value: 'Go 1.22 + Gin', color: 'var(--accent2)' },
            { label: 'Database', value: 'PostgreSQL 16', color: 'var(--warn)' },
            { label: 'Proxy', value: 'Nginx (alpine)', color: 'var(--text2)' },
            { label: 'Containers', value: 'Docker Compose', color: 'var(--accent3)' },
            { label: 'Fuzzy Engine', value: 'Mamdani / Larsen / Sugeno', color: 'var(--accent2)' },
            { label: 'Decision Tree', value: 'ID3 (Shannon Entropy)', color: 'var(--accent3)' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
            }}>
              <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{item.label}</span>
              <span style={{ fontSize: 12, color: item.color, fontWeight: 600, textAlign: 'right' }}>{item.value}</span>
            </div>
          ))}
        </div>

        <Alert variant="ok" style={{ marginTop: 20, marginBottom: 0 }}>
          Система запускается командой <code style={{ fontFamily: 'var(--mono)', color: 'var(--accent3)' }}>docker-compose up --build</code> и доступна на{' '}
          <code style={{ fontFamily: 'var(--mono)', color: 'var(--accent3)' }}>http://localhost</code>.
          PostgreSQL данные сохраняются в volume <code style={{ fontFamily: 'var(--mono)' }}>postgres_data</code>.
        </Alert>
      </Section>
    </div>
  )
}
