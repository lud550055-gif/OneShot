import axios from 'axios'
import type {
  MembershipFunction, MFPoint, InferenceTask, BuildTreeResponse,
  DecisionTreeTask, ArchResponse, InferenceResponse, FuzzySetsTask
} from '../types'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Fuzzy Sets ───────────────────────────────────────────────────────────────

export const getFuzzySetsTasks = () =>
  api.get<{ tasks: FuzzySetsTask[] }>('/fuzzy-sets/tasks')

export const computeMembership = (mf: MembershipFunction, xMin: number, xMax: number, steps = 200) =>
  api.post<{ points: MFPoint[] }>('/fuzzy-sets/membership', { mf, xMin, xMax, steps })

export const performOperation = (
  setA: MFPoint[], setB: MFPoint[], operation: string, lambda = 0
) =>
  api.post<{ result: MFPoint[]; label: string }>('/fuzzy-sets/operations', {
    setA, setB, operation, lambda,
  })

export const computeComposition = (r1: number[][], r2: number[][], method: string) =>
  api.post<{ result: number[][] }>('/fuzzy-sets/composition', { r1, r2, method })

export const computeProperties = (points: MFPoint[]) =>
  api.post('/fuzzy-sets/properties', points)

// ─── Fuzzy Inference ─────────────────────────────────────────────────────────

export const getInferenceTasks = () =>
  api.get<{ tasks: InferenceTask[] }>('/inference/tasks')

export const runInference = (req: {
  algorithm: string
  inputVars: Record<string, unknown>
  outputVar: unknown
  rules: unknown[]
  inputValues: Record<string, number>
  defuzz: string
  sugenoCoeffs?: number[][]
}) =>
  api.post<InferenceResponse>('/inference/run', req)

// ─── Decision Tree ────────────────────────────────────────────────────────────

export const getDecisionTreeTasks = () =>
  api.get<{ tasks: DecisionTreeTask[] }>('/decision-tree/tasks')

export const solveDecisionTreeTask = (taskId: string) =>
  api.post<{ task: DecisionTreeTask; tree: unknown; steps: unknown[]; rules: string[] }>(
    `/decision-tree/tasks/${taskId}/solve`, {}
  )

export const buildTree = (data: unknown[], features: string[]) =>
  api.post<BuildTreeResponse>('/decision-tree/build', { data, features })

export const classifySample = (tree: unknown, sample: Record<string, string>) =>
  api.post<{ class: string; path: string[] }>('/decision-tree/classify', { tree, sample })

export const computeEntropy = (data: { features: Record<string, string>; class: string }[]) =>
  api.post<{ entropy: number; giniIndex: number }>('/decision-tree/entropy', { data })

// ─── Architecture ─────────────────────────────────────────────────────────────

export const getArchitecture = () =>
  api.get<ArchResponse>('/architecture')

export default api
