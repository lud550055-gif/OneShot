import React, { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Section, Alert, Btn, Select, MonoBadge, MatrixTable, Spinner } from '../ui'
import { getFuzzySetsTasks, computeMembership, performOperation, computeComposition } from '../../api/client'
import type { FuzzySetsTask, MFPoint, MembershipFunction } from '../../types'

const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444']

const OPERATIONS = [
  { value: 'not',         label: 'РќР• A (РґРѕРїРѕР»РЅРµРЅРёРµ, Р—Р°РґРµ)' },
  { value: 'not_sugeno',  label: 'РќР• A (РґРѕРїРѕР»РЅРµРЅРёРµ, РЎСѓРіРµРЅРѕ, О»=1)' },
  { value: 'and_min',     label: 'A в€© B (T-min, Р—Р°РґРµ)' },
  { value: 'and_prod',    label: 'A в€© B (T-prod, Р°Р»РіРµР±СЂ.)' },
  { value: 'and_bounded', label: 'A в€© B (T-bounded, РіСЂР°РЅРёС‡РЅ.)' },
  { value: 'and_drastic', label: 'A в€© B (T-drastic, СѓСЃРёР»РµРЅРЅ.)' },
  { value: 'or_max',      label: 'A в€Є B (S-max, Р—Р°РґРµ)' },
  { value: 'or_sum',      label: 'A в€Є B (S-sum, Р°Р»РіРµР±СЂ.)' },
  { value: 'or_bounded',  label: 'A в€Є B (S-bounded, РіСЂР°РЅРёС‡РЅ.)' },
  { value: 'or_drastic',  label: 'A в€Є B (S-drastic, СѓСЃРёР»РµРЅРЅ.)' },
  { value: 'con',         label: 'CON(A) вЂ” В«РћС‡РµРЅСЊ AВ»' },
  { value: 'dil',         label: 'DIL(A) вЂ” В«Р”РѕРІРѕР»СЊРЅРѕ AВ»' },
]

export default function FuzzySets() {
  const [tasks, setTasks] = useState<FuzzySetsTask[]>([])
  const [selectedTask, setSelectedTask] = useState<FuzzySetsTask | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState<Record<string, number>[]>([])
  const [opResult, setOpResult] = useState<MFPoint[] | null>(null)
  const [opLabel, setOpLabel] = useState('')
  const [selectedOp, setSelectedOp] = useState('and_min')
  const [setAIdx, setSetAIdx] = useState(0)
  const [setBIdx, setSetBIdx] = useState(2)
  const [composition, setComposition] = useState<number[][] | null>(null)
  const [compMethod, setCompMethod] = useState('max_min')
  const [xPoint, setXPoint] = useState(0)
  const [membership, setMembership] = useState<Record<string, number>>({})

  useEffect(() => {
    getFuzzySetsTasks().then(res => {
      setTasks(res.data.tasks)
      if (res.data.tasks.length > 0) {
        loadTask(res.data.tasks[0])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const loadTask = async (task: FuzzySetsTask) => {
    setSelectedTask(task)
    setXPoint(task.xPoint ?? ((task.xMin ?? 0) + (task.xMax ?? 1)) / 2)
    setOpResult(null)
    setComposition(null)

    if (!task.sets || task.sets.length === 0) return

    const xMin = task.xMin ?? 0
    const xMax = task.xMax ?? 1
    const steps = 250

    const curves = await Promise.all(
      task.sets.map(s =>
        computeMembership(s.mf, xMin, xMax, steps).then(r => ({
          name: s.name,
          points: r.data.points,
        }))
      )
    )

    // Merge into chart data
    const merged: Record<string, number>[] = curves[0].points.map((p, i) => {
      const row: Record<string, number> = { x: Math.round(p.x * 100) / 100 }
      curves.forEach(c => {
        row[c.name] = Math.round(c.points[i].mu * 1000) / 1000
      })
      return row
    })
    setChartData(merged)

    // Compute memberships at xPoint
    computeMembershipsAtPoint(task, task.xPoint ?? xMin, curves)
  }

  const computeMembershipsAtPoint = async (task: FuzzySetsTask, x: number, curves: { name: string; points: MFPoint[] }[]) => {
    const xMin = task.xMin ?? 0
    const xMax = task.xMax ?? 1
    const steps = 250
    const idx = Math.min(Math.round(((x - xMin) / (xMax - xMin)) * (steps - 1)), steps - 1)
    const result: Record<string, number> = {}
    curves.forEach(c => {
      result[c.name] = c.points[idx]?.mu ?? 0
    })
    setMembership(result)
  }

  const handleXPointChange = async (x: number) => {
    setXPoint(x)
    if (!selectedTask?.sets) return
    const xMin = selectedTask.xMin ?? 0
    const xMax = selectedTask.xMax ?? 1
    const steps = 250
    const curves = await Promise.all(
      selectedTask.sets.map(s =>
        computeMembership(s.mf, xMin, xMax, steps).then(r => ({
          name: s.name,
          points: r.data.points,
        }))
      )
    )
    computeMembershipsAtPoint(selectedTask, x, curves)
  }

  const handleOperation = async () => {
    if (!selectedTask?.sets || selectedTask.sets.length === 0) return
    const xMin = selectedTask.xMin ?? 0
    const xMax = selectedTask.xMax ?? 1
    const steps = 250

    const [a, b] = await Promise.all([
      computeMembership(selectedTask.sets[setAIdx].mf, xMin, xMax, steps),
      selectedTask.sets[setBIdx]
        ? computeMembership(selectedTask.sets[setBIdx].mf, xMin, xMax, steps)
        : Promise.resolve({ data: { points: [] } }),
    ])

    const res = await performOperation(a.data.points, b.data.points, selectedOp, 1)
    setOpResult(res.data.result)
    setOpLabel(res.data.label)
  }

  const handleComposition = async () => {
    if (!selectedTask?.r1 || !selectedTask?.r2) return
    const res = await computeComposition(selectedTask.r1, selectedTask.r2, compMethod)
    setComposition(res.data.result)
  }

  if (loading) return <Spinner />

  return (
    <div>
      {/* Method description */}
      <div style={{
        background: 'var(--surface2)',
        borderLeft: '3px solid var(--accent)',
        padding: '12px 16px',
        borderRadius: '0 6px 6px 0',
        fontSize: 13,
        color: 'var(--text2)',
        lineHeight: 1.6,
        marginBottom: 20,
      }}>
        <strong style={{ color: 'var(--text)' }}>РќРµС‡С‘С‚РєРёРµ РјРЅРѕР¶РµСЃС‚РІР° (Р›.Р—Р°РґРµ, 1965)</strong> вЂ” С„РѕСЂРјР°Р»РёР·Рј РґР»СЏ РѕРїРёСЃР°РЅРёСЏ
        РїРѕРЅСЏС‚РёР№ СЃ РЅРµС‡С‘С‚РєРѕ Р·Р°РґР°РЅРЅС‹РјРё РіСЂР°РЅРёС†Р°РјРё. РљР°Р¶РґС‹Р№ СЌР»РµРјРµРЅС‚ x РїСЂРёРЅР°РґР»РµР¶РёС‚ РјРЅРѕР¶РµСЃС‚РІСѓ A СЃРѕ СЃС‚РµРїРµРЅСЊСЋ Ој_A(x) в€€ [0,1].
        Р РµР°Р»РёР·РѕРІР°РЅС‹: С„СѓРЅРєС†РёРё РїСЂРёРЅР°РґР»РµР¶РЅРѕСЃС‚Рё (С‚СЂР°РїРµС†., С‚СЂРµСѓРіРѕР»СЊРЅР°СЏ, РіР°СѓСЃСЃ., Z, S), T/S-РЅРѕСЂРјС‹,
        Р»РёРЅРіРІ. РјРѕРґРёС„РёРєР°С‚РѕСЂС‹ CON/DIL, max-min/max-prod РєРѕРјРїРѕР·РёС†РёСЏ.
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {['Р¤Рџ: С‚СЂРµСѓРіРѕР»СЊРЅ., С‚СЂР°РїРµС†., РіР°СѓСЃСЃ., Z, S', 'T-РЅРѕСЂРјС‹: min, prod, bounded, drastic',
            'S-РЅРѕСЂРјС‹: max, sum, bounded, drastic', 'CON / DIL', 'max-min / max-prod'].map(s => (
            <span key={s} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '2px 8px',
              fontSize: 11,
              color: 'var(--text3)',
              fontFamily: 'var(--mono)',
            }}>{s}</span>
          ))}
        </div>
      </div>

      {/* Task selector */}
      <Section title="01 / Р’С‹Р±РѕСЂ Р·Р°РґР°С‡Рё РР‘">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {tasks.map(t => (
            <button
              key={t.id}
              onClick={() => loadTask(t)}
              style={{
                background: selectedTask?.id === t.id ? 'rgba(0,212,255,0.12)' : 'var(--surface2)',
                border: `1px solid ${selectedTask?.id === t.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '12px 16px',
                color: selectedTask?.id === t.id ? 'var(--accent)' : 'var(--text2)',
                cursor: 'pointer',
                textAlign: 'left',
                maxWidth: 260,
                transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.domain}</div>
            </button>
          ))}
        </div>

        {selectedTask && (
          <Alert variant="info" style={{ marginTop: 16, marginBottom: 0 }}>
            {selectedTask.description}
          </Alert>
        )}
      </Section>

      {/* MF Chart */}
      {selectedTask?.sets && chartData.length > 0 && (
        <Section title="02 / Р¤СѓРЅРєС†РёРё РїСЂРёРЅР°РґР»РµР¶РЅРѕСЃС‚Рё">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="x"
                stroke="var(--text3)"
                tick={{ fill: 'var(--text3)', fontSize: 11 }}
                label={{ value: selectedTask.xLabel, position: 'insideBottom', offset: -2, fill: 'var(--text2)', fontSize: 11 }}
              />
              <YAxis domain={[0, 1]} stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}
                itemStyle={{ color: 'var(--text2)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {selectedTask.sets.map((s, i) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  animationDuration={400}
                />
              ))}
              <ReferenceLine x={xPoint} stroke="var(--warn)" strokeDasharray="4 2" label={{ value: `xв‚Ђ=${xPoint}`, fill: 'var(--warn)', fontSize: 10 }} />
            </LineChart>
          </ResponsiveContainer>

          {/* xв‚Ђ slider */}
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)' }}>
              РўРѕС‡РєР° РІС‹С‡РёСЃР»РµРЅРёСЏ xв‚Ђ = <strong style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{xPoint}</strong>
            </label>
            <input
              type="range"
              min={selectedTask.xMin ?? 0}
              max={selectedTask.xMax ?? 1}
              step={(((selectedTask.xMax ?? 1) - (selectedTask.xMin ?? 0)) / 100)}
              value={xPoint}
              onChange={e => handleXPointChange(Number(e.target.value))}
              style={{ width: '100%', marginTop: 8, accentColor: 'var(--accent)' }}
            />
          </div>

          {/* Membership values at xв‚Ђ */}
          {Object.keys(membership).length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)', alignSelf: 'center' }}>Ој(xв‚Ђ={xPoint}):</span>
              {Object.entries(membership).map(([name, mu], i) => (
                <span key={name} style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  color: COLORS[i % COLORS.length],
                  background: `${COLORS[i % COLORS.length]}18`,
                  border: `1px solid ${COLORS[i % COLORS.length]}40`,
                  borderRadius: 4,
                  padding: '2px 8px',
                }}>
                  Ој<sub>{name.split(' ')[0]}</sub> = {mu.toFixed(3)}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Operations */}
      {selectedTask?.sets && selectedTask.sets.length >= 2 && (
        <Section title="03 / РћРїРµСЂР°С†РёРё РЅР°Рґ РЅРµС‡С‘С‚РєРёРјРё РјРЅРѕР¶РµСЃС‚РІР°РјРё">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
            <Select
              label="РћРїРµСЂР°С†РёСЏ"
              value={selectedOp}
              onChange={e => setSelectedOp(e.target.value)}
              options={OPERATIONS}
              style={{ flex: '1', minWidth: 220 }}
            />
            <Select
              label="РњРЅРѕР¶РµСЃС‚РІРѕ A"
              value={String(setAIdx)}
              onChange={e => setSetAIdx(Number(e.target.value))}
              options={selectedTask.sets.map((s, i) => ({ value: String(i), label: s.name }))}
              style={{ minWidth: 160 }}
            />
            {!['not', 'not_sugeno', 'con', 'dil'].includes(selectedOp) && (
              <Select
                label="РњРЅРѕР¶РµСЃС‚РІРѕ B"
                value={String(setBIdx)}
                onChange={e => setSetBIdx(Number(e.target.value))}
                options={selectedTask.sets.map((s, i) => ({ value: String(i), label: s.name }))}
                style={{ minWidth: 160 }}
              />
            )}
            <Btn onClick={handleOperation}>в–¶ Р’С‹РїРѕР»РЅРёС‚СЊ</Btn>
          </div>

          {opResult && (
            <>
              <Alert variant="ok">
                <strong>{opLabel}</strong>
              </Alert>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={opResult.map(p => ({ x: Math.round(p.x * 100) / 100, Ој: Math.round(p.mu * 1000) / 1000 }))}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="x" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <YAxis domain={[0, 1]} stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
                  <Line type="monotone" dataKey="Ој" stroke="var(--accent3)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </Section>
      )}

      {/* Composition (for compromise task) */}
      {selectedTask?.r1 && selectedTask?.r2 && (
        <Section title="04 / РљРѕРјРїРѕР·РёС†РёСЏ РЅРµС‡С‘С‚РєРёС… РѕС‚РЅРѕС€РµРЅРёР№">
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            РЎС‚СЂРѕРёС‚СЃСЏ max-min РёР»Рё max-prod СЃРІС‘СЂС‚РєР° РѕС‚РЅРѕС€РµРЅРёР№ Rв‚Ѓ(X,Y) Рё Rв‚‚(Y,Z):
            Ој<sub>Rв‚ЃВ·Rв‚‚</sub>(x,z) = max<sub>y</sub>[Ој<sub>Rв‚Ѓ</sub>(x,y) в€§ Ој<sub>Rв‚‚</sub>(y,z)]
          </p>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Rв‚Ѓ вЂ” РџСЂРёР·РЅР°РєРё в†’ РўРёРї Р°С‚Р°РєРё:</p>
            <MatrixTable
              data={selectedTask.r1}
              rowLabels={selectedTask.r1Labels}
              colLabels={selectedTask.r1Cols}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Rв‚‚ вЂ” РўРёРї Р°С‚Р°РєРё в†’ РЈС‰РµСЂР±:</p>
            <MatrixTable
              data={selectedTask.r2}
              rowLabels={selectedTask.r1Cols}
              colLabels={selectedTask.r2Cols}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <Select
              value={compMethod}
              onChange={e => setCompMethod(e.target.value)}
              options={[
                { value: 'max_min', label: 'max-min (в€§)' },
                { value: 'max_prod', label: 'max-prod (Г—)' },
              ]}
            />
            <Btn onClick={handleComposition}>в–¶ Р’С‹С‡РёСЃР»РёС‚СЊ Rв‚ЃВ·Rв‚‚</Btn>
          </div>

          {composition && (
            <>
              <Alert variant="ok">
                Р РµР·СѓР»СЊС‚Р°С‚ Rв‚ЃВ·Rв‚‚ ({compMethod === 'max_min' ? 'max-min' : 'max-prod'} РєРѕРјРїРѕР·РёС†РёСЏ):
              </Alert>
              <MatrixTable
                data={composition}
                rowLabels={selectedTask.r1Labels}
                colLabels={selectedTask.r2Cols}
              />
              <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text2)' }}>
                РЎС‚СЂРѕРєРё = РїСЂРёР·РЅР°РєРё РёРЅС†РёРґРµРЅС‚Р°, СЃС‚РѕР»Р±С†С‹ = СЃС‚РµРїРµРЅСЊ СѓС‰РµСЂР±Р°. РњР°РєСЃРёРјР°Р»СЊРЅРѕРµ Р·РЅР°С‡РµРЅРёРµ РІ СЃС‚СЂРѕРєРµ
                СѓРєР°Р·С‹РІР°РµС‚ РЅР° РЅР°РёР±РѕР»РµРµ РІРµСЂРѕСЏС‚РЅС‹Р№ СѓСЂРѕРІРµРЅСЊ СѓС‰РµСЂР±Р° РґР»СЏ РґР°РЅРЅРѕРіРѕ РЅР°Р±РѕСЂР° РїСЂРёР·РЅР°РєРѕРІ.
              </p>
            </>
          )}
        </Section>
      )}
    </div>
  )
}
