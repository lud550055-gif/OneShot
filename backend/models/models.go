package models

// ─── Fuzzy Sets ───────────────────────────────────────────────────────────────

type MFType string

const (
	MFTriangular  MFType = "triangular"
	MFTrapezoidal MFType = "trapezoidal"
	MFGaussian    MFType = "gaussian"
	MFZType       MFType = "z"
	MFSType       MFType = "s"
)

type MembershipFunction struct {
	Type   MFType    `json:"type"`
	Params []float64 `json:"params"`
	Name   string    `json:"name"`
}

type FuzzySet struct {
	Name   string             `json:"name"`
	MF     MembershipFunction `json:"mf"`
	Domain [2]float64         `json:"domain"`
}

type MFPoint struct {
	X  float64 `json:"x"`
	Mu float64 `json:"mu"`
}

type ComputeMFRequest struct {
	MF     MembershipFunction `json:"mf"`
	XMin   float64            `json:"xMin"`
	XMax   float64            `json:"xMax"`
	Steps  int                `json:"steps"`
}

type ComputeMFResponse struct {
	Points []MFPoint `json:"points"`
}

type OperationRequest struct {
	SetA      []MFPoint `json:"setA"`
	SetB      []MFPoint `json:"setB"`
	Operation string    `json:"operation"` // not, and_min, and_prod, and_bounded, or_max, or_sum, or_bounded, con, dil
	Lambda    float64   `json:"lambda,omitempty"` // for Sugeno NOT
}

type OperationResponse struct {
	Result []MFPoint `json:"result"`
	Label  string    `json:"label"`
}

type CompositionRequest struct {
	R1     [][]float64 `json:"r1"`
	R2     [][]float64 `json:"r2"`
	Method string      `json:"method"` // max_min or max_prod
}

type CompositionResponse struct {
	Result [][]float64 `json:"result"`
}

// ─── Fuzzy Inference ─────────────────────────────────────────────────────────

type LinguisticTerm struct {
	Name string             `json:"name"`
	MF   MembershipFunction `json:"mf"`
}

type LinguisticVariable struct {
	Name   string           `json:"name"`
	Domain [2]float64       `json:"domain"`
	Terms  []LinguisticTerm `json:"terms"`
}

type Rule struct {
	Antecedents []Antecedent `json:"antecedents"`
	Connector   string       `json:"connector"` // "and" or "or"
	Consequent  Consequent   `json:"consequent"`
}

type Antecedent struct {
	Variable string `json:"variable"`
	Term     string `json:"term"`
}

type Consequent struct {
	Variable string `json:"variable"`
	Term     string `json:"term"`
}

type InferenceRequest struct {
	Algorithm    string                        `json:"algorithm"` // mamdani, larsen, sugeno
	InputVars    map[string]LinguisticVariable `json:"inputVars"`
	OutputVar    LinguisticVariable            `json:"outputVar"`
	Rules        []Rule                        `json:"rules"`
	InputValues  map[string]float64            `json:"inputValues"`
	Defuzz       string                        `json:"defuzz"` // cog, mom, som, lom
	SugenoCoeffs [][]float64                   `json:"sugenoCoeffs,omitempty"` // [a0, a1, a2...] per rule
}

type RuleActivation struct {
	RuleIndex   int       `json:"ruleIndex"`
	Alpha       float64   `json:"alpha"`
	OutputCurve []MFPoint `json:"outputCurve"`
}

type InferenceResponse struct {
	FuzzifiedInputs map[string]map[string]float64 `json:"fuzzifiedInputs"`
	Activations     []RuleActivation              `json:"activations"`
	AccumulatedMF   []MFPoint                     `json:"accumulatedMF"`
	CrispOutput     float64                       `json:"crispOutput"`
	OutputTerm      string                        `json:"outputTerm"`
	Steps           []StepInfo                    `json:"steps"`
}

type StepInfo struct {
	Step        string `json:"step"`
	Description string `json:"description"`
}

// ─── Decision Tree ────────────────────────────────────────────────────────────

type Sample struct {
	Features map[string]string `json:"features"`
	Class    string            `json:"class"`
}

type TreeNode struct {
	Feature     string               `json:"feature,omitempty"`
	IsLeaf      bool                 `json:"isLeaf"`
	Class       string               `json:"class,omitempty"`
	SampleCount int                  `json:"sampleCount"`
	Entropy     float64              `json:"entropy"`
	Gain        float64              `json:"gain,omitempty"`
	Children    map[string]*TreeNode `json:"children,omitempty"`
}

type BuildTreeRequest struct {
	Data     []Sample `json:"data"`
	Features []string `json:"features"`
}

type BuildTreeResponse struct {
	Tree        *TreeNode      `json:"tree"`
	Steps       []EntropyStep  `json:"steps"`
	Rules       []string       `json:"rules"`
}

type EntropyStep struct {
	Node        string             `json:"node"`
	Feature     string             `json:"feature"`
	Entropy     float64            `json:"entropy"`
	GainPerAttr map[string]float64 `json:"gainPerAttr"`
	Selected    string             `json:"selected"`
}

type ClassifyRequest struct {
	Tree    *TreeNode         `json:"tree"`
	Sample  map[string]string `json:"sample"`
}

type ClassifyResponse struct {
	Class string   `json:"class"`
	Path  []string `json:"path"`
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

type Task struct {
	ID          string      `json:"id"`
	Module      string      `json:"module"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Domain      string      `json:"domain"`
	Config      interface{} `json:"config"`
}

// ─── History ──────────────────────────────────────────────────────────────────

type HistoryRecord struct {
	ID         int         `json:"id"`
	Module     string      `json:"module"`
	TaskID     string      `json:"taskId"`
	InputData  interface{} `json:"inputData"`
	OutputData interface{} `json:"outputData"`
	CreatedAt  string      `json:"createdAt"`
}
