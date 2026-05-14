import React, { useState, useEffect } from 'react'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Section, Alert, Btn, Select, StepList, Spinner } from '../ui'
import { getInferenceTasks, runInference } from '../../api/client'
import type { InferenceTask, InferenceResponse } from '../../types'

const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

const DEFUZZ_OPTIONS = [
  { value: 'cog', label: 'COG вЂ” Р¦РµРЅС‚СЂ С‚СЏР¶РµСЃС‚Рё' },
  { value: 'mom', label: 'MOM вЂ” РЎСЂРµРґРЅРµРµ РјР°РєСЃРёРјСѓРјРѕРІ' },
  { value: 'som', label: 'SOM вЂ” РџРµСЂРІС‹Р№ РјР°РєСЃРёРјСѓРј' },
  { value: 'lom', label: 'LOM вЂ” РџРѕСЃР»РµРґРЅРёР№ РјР°РєСЃРёРјСѓРј' },
]

const ALG_LABELS: Record<string, string> = {
  mamdani: 'РњР°РјРґР°РЅРё (min-Р°РєС‚РёРІР°С†РёСЏ)',
  larsen:  'Р›Р°СЂСЃРµРЅ (prod-Р°РєС‚РёРІР°С†РёСЏ)',
  sugeno:  'РўР°РєР°РіРё-РЎСѓРіРµРЅРѕ (Р»РёРЅРµР№РЅС‹Р№ РІС‹С…РѕРґ)',
}

export default function FuzzyInference() {
  const [tasks, setTasks] = useState<InferenceTask[]>([])
  const [selectedTask, setSelectedTask] = useState<InferenceTask | null>(null)
  const [inputValues, setInputValues] = useState<Record<string, number>>({})
  const [defuzz, setDefuzz] = useState('cog')
  const [algorithm, setAlgorithm] = useState<'mamdani' | 'larsen' | 'sugeno'>('mamdani')
  const [result, setResult] = useState<InferenceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)

  useEffect(() => {
    getInferenceTasks().then(res => {
      setTasks(res.data.tasks)
      if (res.data.tasks.length > 0) {
        selectTask(res.data.tasks[0])
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const selectTask = (task: InferenceTask) => {
    setSelectedTask(task)
    setAlgorithm(task.algorithm)
    setInputValues({ ...task.config.defaultInputs })
    setResult(null)
  }

  const handleRun = async () => {
    if (!selectedTask) return
    setComputing(true)
    try {
      const req = {
        algorithm,
        inputVars: selectedTask.config.inputVars as Record<string, unknown>,
        outputVar: selectedTask.config.outputVar as unknown,
        rules: selectedTask.config.rules as unknown[],
        inputValues,
        defuzz,
        sugenoCoeffs: selectedTask.config.sugenoCoeffs,
      }
      const res = await runInference(req)
      setResult(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setComputing(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      {/* Method description */}
      <div style={{
        background: 'var(--surface2)',
        borderLeft: '3px solid var(--accent2)',
        padding: '12px 16px',
        borderRadius: '0 6px 6px 0',
        fontSize: 13,
        color: 'var(--text2)',
        lineHeight: 1.6,
        marginBottom: 20,
      }}>
        <strong style={{ color: 'var(--text)' }}>РќРµС‡С‘С‚РєРёР№ Р»РѕРіРёС‡РµСЃРєРёР№ РІС‹РІРѕРґ</strong> вЂ” СЃРёСЃС‚РµРјР° РќР›Р’
        РїСЂРµРѕР±СЂР°Р·СѓРµС‚ С‡С‘С‚РєРёРµ РІС…РѕРґРЅС‹Рµ Р·РЅР°С‡РµРЅРёСЏ РІ С‡С‘С‚РєРёР№ РІС‹С…РѕРґ С‡РµСЂРµР· Р±Р°Р·Сѓ РЅРµС‡С‘С‚РєРёС… РїСЂР°РІРёР» РІРёРґР° В«Р•РЎР›РвЂ“РўРћВ».
        Р­С‚Р°РїС‹: <em>Р¤Р°Р·Р·РёС„РёРєР°С†РёСЏ в†’ РђРіСЂРµРіРёСЂРѕРІР°РЅРёРµ в†’ РђРєС‚РёРІРёР·Р°С†РёСЏ в†’ РђРєРєСѓРјСѓР»СЏС†РёСЏ в†’ Р”РµС„Р°Р·Р·РёС„РёРєР°С†РёСЏ</em>.
        Р РµР°Р»РёР·РѕРІР°РЅС‹ Р°Р»РіРѕСЂРёС‚РјС‹ <strong style={{ color: 'var(--text)' }}>РњР°РјРґР°РЅРё</strong>,{' '}
        <strong style={{ color: 'var(--text)' }}>Р›Р°СЂСЃРµРЅР°</strong> Рё{' '}
        <strong style={{ color: 'var(--text)' }}>РўР°РєР°РіРё-РЎСѓРіРµРЅРѕ</strong>.
      </div>

      {/* Task selector */}
      <Section title="01 / Р’С‹Р±РѕСЂ Р·Р°РґР°С‡Рё РР‘">
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {tasks.map(t => (
            <button
              key={t.id}
              onClick={() => selectTask(t)}
              style={{
                background: selectedTask?.id === t.id ? 'rgba(124,58,237,0.12)' : 'var(--surface2)',
                border: `1px solid ${selectedTask?.id === t.id ? 'var(--accent2)' : 'var(--border)'}`,
                borderRadius: 8,
                padding: '12px 16px',
                color: selectedTask?.id === t.id ? 'var(--accent2)' : 'var(--text2)',
                cursor: 'pointer',
                textAlign: 'left',
                maxWidth: 260,
                transition: 'all .2s',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{t.domain}</div>
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--accent2)',
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 3,
                padding: '1px 6px',
              }}>{ALG_LABELS[t.algorithm]}</span>
            </button>
          ))}
        </div>
        {selectedTask && (
          <Alert variant="info" style={{ marginTop: 16, marginBottom: 0 }}>
            {selectedTask.description}
          </Alert>
        )}
      </Section>

      {selectedTask && (
        <>
          {/* Algorithm & defuzz selector */}
          <Section title="02 / РќР°СЃС‚СЂРѕР№РєР° Р°Р»РіРѕСЂРёС‚РјР°">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <Select
                label="РђР»РіРѕСЂРёС‚Рј РІС‹РІРѕРґР°"
                value={algorithm}
                onChange={e => setAlgorithm(e.target.value as 'mamdani' | 'larsen' | 'sugeno')}
                options={[
                  { value: 'mamdani', label: 'РњР°РјРґР°РЅРё (min-Р°РєС‚РёРІР°С†РёСЏ)' },
                  { value: 'larsen', label: 'Р›Р°СЂСЃРµРЅ (prod-Р°РєС‚РёРІР°С†РёСЏ)' },
                  { value: 'sugeno', label: 'РўР°РєР°РіРё-РЎСѓРіРµРЅРѕ' },
                ]}
                style={{ minWidth: 240 }}
              />
              {algorithm !== 'sugeno' && (
                <Select
                  label="РњРµС‚РѕРґ РґРµС„Р°Р·Р·РёС„РёРєР°С†РёРё"
                  value={defuzz}
                  onChange={e => setDefuzz(e.target.value)}
                  options={DEFUZZ_OPTIONS}
                  style={{ minWidth: 240 }}
                />
              )}
            </div>

            {/* Input sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {Object.entries(selectedTask.config.inputVars).map(([varKey, lv]) => {
                const [min, max] = lv.domain
                const val = inputValues[varKey] ?? min
                return (
                  <div key={varKey}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <label style={{ fontSize: 13, color: 'var(--text)' }}>{lv.name}</label>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)' }}>
                        {val.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={(max - min) / 100}
                      value={val}
                      onChange={e => setInputValues(prev => ({ ...prev, [varKey]: Number(e.target.value) }))}
                      style={{ width: '100%', accentColor: 'var(--accent2)' }}
                    />
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      {lv.terms.map(term => (
                        <span key={term.name} style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 10,
                          color: 'var(--text3)',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 3,
                          padding: '1px 6px',
                        }}>{term.name}</span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: 20 }}>
              <Btn
                onClick={handleRun}
                disabled={computing}
                style={{ background: computing ? 'var(--border)' : undefined }}
              >
                {computing ? 'вЏі Р’С‹С‡РёСЃР»РµРЅРёРµ...' : 'в–¶ Р—Р°РїСѓСЃС‚РёС‚СЊ РІС‹РІРѕРґ'}
              </Btn>
            </div>
          </Section>

          {/* Rules display */}
          <Section title="03 / Р‘Р°Р·Р° РЅРµС‡С‘С‚РєРёС… РїСЂР°РІРёР»">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {selectedTask.config.rules.map((rule, i) => {
                const alpha = result?.activations[i]?.alpha
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 14px',
                    background: 'var(--surface2)',
                    border: `1px solid ${alpha && alpha > 0.1 ? 'var(--accent3)' : 'var(--border)'}`,
                    borderRadius: 6,
                    fontSize: 13,
                    transition: 'border-color .3s',
                  }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', minWidth: 24 }}>
                      Рџ{i + 1}
                    </span>
                    <span style={{ flex: 1, color: 'var(--text2)' }}>
                      <strong style={{ color: 'var(--accent)' }}>Р•РЎР›Р</strong>{' '}
                      {rule.antecedents.map((a, ai) => (
                        <span key={ai}>
                          {ai > 0 && <strong style={{ color: 'var(--warn)' }}> {rule.connector.toUpperCase()} </strong>}
                          ({a.variable} = <em style={{ color: 'var(--text)' }}>{a.term}</em>)
                        </span>
                      ))}
                      {' '}<strong style={{ color: 'var(--accent2)' }}>РўРћ</strong>{' '}
                      {rule.consequent.variable} = <em style={{ color: 'var(--text)' }}>{rule.consequent.term}</em>
                    </span>
                    {alpha !== undefined && (
                      <span style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 12,
                        color: alpha > 0.1 ? 'var(--accent3)' : 'var(--text3)',
                        minWidth: 60,
                        textAlign: 'right',
                      }}>
                        О± = {alpha.toFixed(3)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </Section>

          {/* Result */}
          {result && (
            <>
              <Section title="04 / Р¤Р°Р·Р·РёС„РёРєР°С†РёСЏ РІС…РѕРґРЅС‹С… Р·РЅР°С‡РµРЅРёР№">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {Object.entries(result.fuzzifiedInputs).map(([varKey, terms]) => {
                    const lv = selectedTask.config.inputVars[varKey]
                    return (
                      <div key={varKey} style={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: 16,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
                          {lv?.name ?? varKey} = {inputValues[varKey]?.toFixed(2)}
                        </div>
                        {Object.entries(terms).map(([termName, mu], i) => (
                          <div key={termName} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 100 }}>{termName}</span>
                            <div style={{ flex: 1, height: 14, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{
                                width: `${mu * 100}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`,
                                borderRadius: 3,
                                transition: 'width .4s',
                              }} />
                            </div>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: COLORS[i % COLORS.length], minWidth: 42 }}>
                              {mu.toFixed(3)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </Section>

              {result.accumulatedMF?.length > 0 && (
                <Section title="05 / Р РµР·СѓР»СЊС‚РёСЂСѓСЋС‰Р°СЏ С„СѓРЅРєС†РёСЏ РїСЂРёРЅР°РґР»РµР¶РЅРѕСЃС‚Рё (Р°РєРєСѓРјСѓР»СЏС†РёСЏ)">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                      data={result.accumulatedMF.map(p => ({ y: Math.round(p.x * 100) / 100, Ој: Math.round(p.mu * 1000) / 1000 }))}
                      margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="y" stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} label={{ value: selectedTask.config.outputVar.name, position: 'insideBottom', offset: -2, fill: 'var(--text2)', fontSize: 11 }} />
                      <YAxis domain={[0, 1]} stroke="var(--text3)" tick={{ fill: 'var(--text3)', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
                      <Area type="monotone" dataKey="Ој" stroke="var(--accent2)" fill="rgba(124,58,237,0.15)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Section>
              )}

              <Section title="06 / Р РµР·СѓР»СЊС‚Р°С‚ РґРµС„Р°Р·Р·РёС„РёРєР°С†РёРё">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12,
                  marginBottom: 20,
                }}>
                  <div style={{
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid var(--accent3)',
                    borderRadius: 8,
                    padding: 20,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 8 }}>
                      Р§РЃРўРљРћР• Р—РќРђР§Р•РќРР•
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 32, color: 'var(--accent3)', fontWeight: 600 }}>
                      {result.crispOutput.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                      {selectedTask.config.outputVar.name}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(0,212,255,0.06)',
                    border: '1px solid var(--accent)',
                    borderRadius: 8,
                    padding: 20,
                    textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1, marginBottom: 8 }}>
                      Р‘Р›РР–РђР™РЁРР™ РўР•Р Рњ
                    </div>
                    <div style={{ fontSize: 20, color: 'var(--accent)', fontWeight: 600, wordBreak: 'break-word' }}>
                      {result.outputTerm}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Р»РёРЅРіРІРёСЃС‚РёС‡РµСЃРєР°СЏ РѕС†РµРЅРєР°</div>
                  </div>
                </div>

                <StepList steps={result.steps} />
              </Section>
            </>
          )}
        </>
      )}
    </div>
  )
}
