import React, { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Section, Alert, Btn, MonoBadge, Spinner } from '../ui'
import { getDecisionTreeTasks, solveDecisionTreeTask, classifySample } from '../../api/client'
import type { DecisionTreeTask, TreeNode, EntropyStep } from '../../types'
import TreeViz from './TreeViz'

export default function DecisionTree() {
  const [tasks, setTasks] = useState<DecisionTreeTask[]>([])
  const [selectedTask, setSelectedTask] = useState<DecisionTreeTask | null>(null)
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [steps, setSteps] = useState<EntropyStep[]>([])
  const [rules, setRules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [building, setBuilding] = useState(false)
  const [testSample, setTestSample] = useState<Record<string, string>>({})
  const [classResult, setClassResult] = useState<{ class: string; path: string[] } | null>(null)
  const [activeStepIdx, setActiveStepIdx] = useState<number | null>(null)

  useEffect(() => {
    getDecisionTreeTasks().then(res => {
      setTasks(res.data.tasks)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const selectTask = (task: DecisionTreeTask) => {
    setSelectedTask(task)
    setTree(null)
    setSteps([])
    setRules([])
    setClassResult(null)
    const sample: Record<string, string> = {}
    task.features.forEach(f => {
      const vals = [...new Set(task.data.map(d => d.features[f]))]
      sample[f] = vals[0] ?? ''
    })
    setTestSample(sample)
  }

  const handleBuild = async () => {
    if (!selectedTask) return
    setBuilding(true)
    try {
      const res = await solveDecisionTreeTask(selectedTask.id)
      setTree(res.data.tree as unknown as TreeNode)
      setSteps(res.data.steps as unknown as EntropyStep[])
      setRules(res.data.rules)
    } catch (e) {
      console.error(e)
    } finally {
      setBuilding(false)
    }
  }

  const handleClassify = async () => {
    if (!tree) return
    const res = await classifySample(tree, testSample)
    setClassResult(res.data)
  }

  if (loading) return <Spinner />

  return (
    <div>
      {/* Method description */}
      <div style={{
        background: 'var(--surface2)',
        borderLeft: '3px solid var(--accent3)',
        padding: '12px 16px',
        borderRadius: '0 6px 6px 0',
        fontSize: 13,
        color: 'var(--text2)',
        lineHeight: 1.6,
        marginBottom: 20,
      }}>
        <strong style={{ color: 'var(--text)' }}>Алгоритм ID3 (Iterative Dichotomizer 3)</strong> — строит дерево решений,
        выбирая на каждом шаге признак с максимальным <em>информационным приростом</em>{' '}
        <code style={{ color: 'var(--accent3)', fontFamily: 'var(--mono)' }}>Gain(S,A) = H(S) − Σ(|S_v|/|S| · H(S_v))</code>, где{' '}
        <code style={{ color: 'var(--accent3)', fontFamily: 'var(--mono)' }}>H(S) = −Σ(p_i · log₂(p_i))</code> — энтропия Шеннона.
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {['Энтропия Шеннона', 'Information Gain', 'Индекс Джини', 'ID3 рекурсия', 'Извлечение правил'].map(s => (
            <span key={s} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Task selector */}
      <Section title="01 / Выбор задачи ИБ">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {tasks.map(t => (
            <button
              key={t.id}
              onClick={() => selectTask(t)}
              style={{
                background: selectedTask?.id === t.id ? 'rgba(16,185,129,0.1)' : 'var(--surface2)',
                border: `1px solid ${selectedTask?.id === t.id ? 'var(--accent3)' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '12px 16px',
                color: selectedTask?.id === t.id ? 'var(--accent3)' : 'var(--text2)',
                cursor: 'pointer',
                textAlign: 'left',
                maxWidth: 280,
                transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.domain}</div>
            </button>
          ))}
        </div>
        {selectedTask && (
          <Alert variant="ok" style={{ marginTop: 16, marginBottom: 0 }}>
            {selectedTask.description}
          </Alert>
        )}
      </Section>

      {selectedTask && (
        <>
          {/* Training data */}
          <Section title="02 / Обучающая выборка">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    {selectedTask.features.map(f => <th key={f} style={thStyle}>{f}</th>)}
                    <th style={thStyle}>КЛАСС</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTask.data.map((sample, i) => (
                    <tr key={i}>
                      <td style={{ ...tdStyle, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{i + 1}</td>
                      {selectedTask.features.map(f => (
                        <td key={f} style={{ ...tdStyle, color: 'var(--text2)', fontFamily: 'var(--mono)', fontSize: 11 }}>
                          {sample.features[f]}
                        </td>
                      ))}
                      <td style={{
                        ...tdStyle,
                        fontWeight: 600,
                        color: Object.values(sample.class).join('') === 'benign' || sample.class.includes('low') || sample.class === 'normal' || sample.class === 'legit'
                          ? 'var(--accent3)' : 'var(--danger)',
                      }}>
                        {selectedTask.classLabels?.[sample.class] ?? sample.class}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 16 }}>
              <Btn
                variant="primary"
                onClick={handleBuild}
                disabled={building}
                style={{ background: building ? 'var(--border)' : 'var(--accent3)', color: '#000' }}
              >
                {building ? '⏳ Построение...' : '▶ Построить дерево ID3'}
              </Btn>
            </div>
          </Section>

          {steps.length > 0 && (
            <Section title="03 / Вычисление энтропии и прироста информации">
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
                На каждом узле вычислена энтропия H(S) и информационный прирост Gain(S,A) для всех признаков.{' '}
                Выбирается признак с максимальным приростом (выделен зелёным).
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {steps.map((step, i) => (
                  <div key={i} style={{
                    background: 'var(--surface2)',
                    border: `1px solid ${activeStepIdx === i ? 'var(--accent3)' : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: 16,
                    cursor: 'pointer',
                    transition: 'border-color .2s',
                  }} onClick={() => setActiveStepIdx(activeStepIdx === i ? null : i)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{step.node}</span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <MonoBadge>H = {step.entropy.toFixed(4)} бит</MonoBadge>
                        <MonoBadge color="var(--accent3)">→ {step.selected}</MonoBadge>
                      </div>
                    </div>

                    {activeStepIdx === i && (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart
                          data={Object.entries(step.gainPerAttr).map(([attr, gain]) => ({
                            name: attr,
                            gain: Math.round(gain * 10000) / 10000,
                          }))}
                          margin={{ top: 5, right: 20, bottom: 30, left: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="name" tick={{ fill: 'var(--text3)', fontSize: 10 }} angle={-20} textAnchor="end" />
                          <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                            formatter={(v: number) => [v.toFixed(4), 'Gain']}
                          />
                          <Bar dataKey="gain" fill="var(--accent3)" radius={[3, 3, 0, 0]}
                            label={{ position: 'top', fontSize: 10, fill: 'var(--text3)', formatter: (v: number) => v.toFixed(3) }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {tree && (
            <>
              <Section title="04 / Дерево решений (визуализация)">
                <TreeViz tree={tree} classLabels={selectedTask.classLabels} />
              </Section>

              <Section title="05 / Извлечённые правила IF-THEN">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {rules.map((rule, i) => (
                    <div key={i} style={{
                      padding: '8px 14px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      borderLeft: '3px solid var(--accent3)',
                      fontSize: 13,
                      color: 'var(--text2)',
                      fontFamily: 'var(--mono)',
                    }}>
                      {rule}
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="06 / Классификация нового объекта">
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
                  Введите значения признаков нового объекта и нажмите «Классифицировать».
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {selectedTask.features.map(f => {
                    const vals = [...new Set(selectedTask.data.map(d => d.features[f]))]
                    return (
                      <div key={f} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 12, color: 'var(--text2)' }}>{f}</label>
                        <select
                          value={testSample[f] ?? ''}
                          onChange={e => setTestSample(prev => ({ ...prev, [f]: e.target.value }))}
                          style={{
                            background: 'var(--surface2)',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            color: 'var(--text)',
                            fontFamily: 'var(--mono)',
                            fontSize: 13,
                            padding: '8px 12px',
                          }}
                        >
                          {vals.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                    )
                  })}
                </div>
                <Btn onClick={handleClassify} variant="secondary">▶ Классифицировать</Btn>

                {classResult && (
                  <div style={{ marginTop: 16 }}>
                    <Alert variant={classResult.class.includes('P1') || classResult.class === 'malware' || classResult.class === 'phishing' || classResult.class === 'ddos' ? 'err' : classResult.class === 'normal' || classResult.class === 'benign' || classResult.class === 'legit' ? 'ok' : 'warn'}>
                      <div>
                        <strong>Результат классификации: {selectedTask.classLabels?.[classResult.class] ?? classResult.class}</strong>
                        <div style={{ marginTop: 6, fontSize: 12, color: 'inherit', opacity: 0.8 }}>
                          Путь: {classResult.path.join(' → ')}
                        </div>
                      </div>
                    </Alert>
                  </div>
                )}
              </Section>
            </>
          )}
        </>
      )}
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
  fontSize: 12,
}
