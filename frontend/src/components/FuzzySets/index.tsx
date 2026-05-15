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
  { value: 'not',         label: 'НЕ A (дополнение, Заде)' },
  { value: 'not_sugeno',  label: 'НЕ A (дополнение, Сугено, λ=1)' },
  { value: 'and_min',     label: 'A ∩ B (T-min, Заде)' },
  { value: 'and_prod',    label: 'A ∩ B (T-prod, алгебр.)' },
  { value: 'and_bounded', label: 'A ∩ B (T-bounded, граничн.)' },
  { value: 'and_drastic', label: 'A ∩ B (T-drastic, усиленн.)' },
  { value: 'or_max',      label: 'A ∪ B (S-max, Заде)' },
  { value: 'or_sum',      label: 'A ∪ B (S-sum, алгебр.)' },
  { value: 'or_bounded',  label: 'A ∪ B (S-bounded, граничн.)' },
  { value: 'or_drastic',  label: 'A ∪ B (S-drastic, усиленн.)' },
  { value: 'con',         label: 'CON(A) — «Очень A»' },
  { value: 'dil',         label: 'DIL(A) — «Довольно A»' },
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

    const merged: Record<string, number>[] = curves[0].points.map((p, i) => {
      const row: Record<string, number> = { x: Math.round(p.x * 100) / 100 }
      curves.forEach(c => {
        row[c.name] = Math.round(c.points[i].mu * 1000) / 1000
      })
      return row
    })
    setChartData(merged)

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
        <strong style={{ color: 'var(--text)' }}>Нечёткие множества (Л.Заде, 1965)</strong>{' '}
        —{' '}
        формализм для описания понятий с нечётко заданными границами.{' '}
        Каждый элемент x принадлежит множеству A со степенью{' '}
        μ_A(x) ∈ [0,1].{' '}
        Реализованы: функции принадлежности (трапец., треугольная, гаусс., Z, S),{' '}
        T/S-нормы, лингв. модификаторы CON/DIL, max-min/max-prod композиция.
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {[
            'ФП: треугольн., трапец., гаусс., Z, S',
            'T-нормы: min, prod, bounded, drastic',
            'S-нормы: max, sum, bounded, drastic',
            'CON / DIL',
            'max-min / max-prod',
          ].map(s => (
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
      <Section title="01 / Выбор задачи ИБ">
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
        <Section title="02 / Функции принадлежности">
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
              <ReferenceLine x={xPoint} stroke="var(--warn)" strokeDasharray="4 2" label={{ value: `x₀=${xPoint}`, fill: 'var(--warn)', fontSize: 10 }} />
            </LineChart>
          </ResponsiveContainer>

          {/* x0 slider */}
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text2)' }}>
              Точка вычисления x₀ ={' '}
              <strong style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}>{xPoint}</strong>
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

          {/* Membership values at x0 */}
          {Object.keys(membership).length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)', alignSelf: 'center' }}>μ(x₀={xPoint}):</span>
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
                  μ<sub>{name.split(' ')[0]}</sub> = {mu.toFixed(3)}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Operations */}
      {selectedTask?.sets && selectedTask.sets.length >= 2 && (
        <Section title="03 / Операции над нечёткими множествами">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-end' }}>
            <Select
              label="Операция"
              value={selectedOp}
              onChange={e => setSelectedOp(e.target.value)}
              options={OPERATIONS}
              style={{ flex: '1', minWidth: 220 }}
            />
            <Select
              label="Множество A"
              value={String(setAIdx)}
              onChange={e => setSetAIdx(Number(e.target.value))}
              options={selectedTask.sets.map((s, i) => ({ value: String(i), label: s.name }))}
              style={{ minWidth: 160 }}
            />
            {!['not', 'not_sugeno', 'con', 'dil'].includes(selectedOp) && (
              <Select
                label="Множество B"
                value={String(setBIdx)}
                onChange={e => setSetBIdx(Number(e.target.value))}
                options={selectedTask.sets.map((s, i) => ({ value: String(i), label: s.name }))}
                style={{ minWidth: 160 }}
              />
            )}
            <Btn onClick={handleOperation}>▶ Выполнить</Btn>
          </div>

          {opResult && (
            <>
              <Alert variant="ok">
                <strong>{opLabel}</strong>
              </Alert>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={opResult.map(p => ({ x: Math.round(p.x * 100) / 100, 'μ': Math.round(p.mu * 1000) / 1000 }))}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="x" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <YAxis domain={[0, 1]} stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
                  <Line type="monotone" dataKey={'μ'} stroke="var(--accent3)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </Section>
      )}

      {/* Composition */}
      {selectedTask?.r1 && selectedTask?.r2 && (
        <Section title="04 / Композиция нечётких отношений">
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            Строится max-min или max-prod свёртка отношений R₁(X,Y) и R₂(Y,Z):{' '}
            μ<sub>R₁·R₂</sub>(x,z) = max<sub>y</sub>[μ<sub>R₁</sub>(x,y) ∧ μ<sub>R₂</sub>(y,z)]
          </p>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
              R₁ — Признаки → Тип атаки:
            </p>
            <MatrixTable
              data={selectedTask.r1}
              rowLabels={selectedTask.r1Labels}
              colLabels={selectedTask.r1Cols}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
              R₂ — Тип атаки → Ущерб:
            </p>
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
                { value: 'max_min', label: 'max-min (∧)' },
                { value: 'max_prod', label: 'max-prod (×)' },
              ]}
            />
            <Btn onClick={handleComposition}>▶ Вычислить R₁·R₂</Btn>
          </div>

          {composition && (
            <>
              <Alert variant="ok">
                Результат R₁·R₂ ({compMethod === 'max_min' ? 'max-min' : 'max-prod'} композиция):
              </Alert>
              <MatrixTable
                data={composition}
                rowLabels={selectedTask.r1Labels}
                colLabels={selectedTask.r2Cols}
              />
              <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text2)' }}>
                Строки = признаки инцидента,{' '}
                столбцы = степень ущерба.{' '}
                Максимальное значение в строке{' '}
                соответствует наиболее вероятному{' '}
                уровню ущерба для данного набора признаков.
              </p>
            </>
          )}
        </Section>
      )}
    </div>
  )
}
