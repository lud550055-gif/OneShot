// ─── Fuzzy Sets ───────────────────────────────────────────────────────────────

export type MFType = 'triangular' | 'trapezoidal' | 'gaussian' | 'z' | 's'

export interface MembershipFunction {
  type: MFType
  params: number[]
  name: string
}

export interface MFPoint {
  x: number
  mu: number
}

export interface FuzzySetConfig {
  name: string
  mf: MembershipFunction
  domain: [number, number]
}

export interface FuzzySetsTask {
  id: string
  name: string
  description: string
  domain: string
  sets?: FuzzySetConfig[]
  xLabel?: string
  xMin?: number
  xMax?: number
  xPoint?: number
  operations?: { op: string; label: string }[]
  r1?: number[][]
  r2?: number[][]
  r1Labels?: string[]
  r1Cols?: string[]
  r2Cols?: string[]
}

// ─── Fuzzy Inference ─────────────────────────────────────────────────────────

export interface LinguisticTerm {
  name: string
  mf: MembershipFunction
}

export interface LinguisticVariable {
  name: string
  domain: [number, number]
  terms: LinguisticTerm[]
}

export interface Rule {
  antecedents: { variable: string; term: string }[]
  connector: 'and' | 'or'
  consequent: { variable: string; term: string }
}

export interface InferenceTask {
  id: string
  name: string
  description: string
  domain: string
  algorithm: 'mamdani' | 'larsen' | 'sugeno'
  config: {
    inputVars: Record<string, LinguisticVariable>
    outputVar: LinguisticVariable
    rules: Rule[]
    defaultInputs: Record<string, number>
    sugenoCoeffs?: number[][]
  }
}

export interface RuleActivation {
  ruleIndex: number
  alpha: number
  outputCurve?: MFPoint[]
}

export interface InferenceResponse {
  fuzzifiedInputs: Record<string, Record<string, number>>
  activations: RuleActivation[]
  accumulatedMF: MFPoint[]
  crispOutput: number
  outputTerm: string
  steps: { step: string; description: string }[]
}

// ─── Decision Tree ────────────────────────────────────────────────────────────

export interface Sample {
  features: Record<string, string>
  class: string
}

export interface TreeNode {
  feature?: string
  isLeaf: boolean
  class?: string
  sampleCount: number
  entropy: number
  gain?: number
  children?: Record<string, TreeNode>
}

export interface EntropyStep {
  node: string
  feature: string
  entropy: number
  gainPerAttr: Record<string, number>
  selected: string
}

export interface BuildTreeResponse {
  tree: TreeNode
  steps: EntropyStep[]
  rules: string[]
}

export interface DecisionTreeTask {
  id: string
  name: string
  description: string
  domain: string
  features: string[]
  classLabels: Record<string, string>
  data: { features: Record<string, string>; class: string }[]
  testSamples: { features: Record<string, string>; expected: string }[]
}

// ─── Architecture ─────────────────────────────────────────────────────────────

export interface ArchLayer {
  id: string
  name: string
  color: string
  tech: string
  components: string[]
  description: string
}

export interface ArchResponse {
  title: string
  description: string
  layers: ArchLayer[]
  dataFlow: { from: string; to: string; description: string }[]
  decisionProcess: { step: number; title: string; description: string }[]
  modules: { id: string; name: string; standard: string; tasks: number; description: string }[]
}
