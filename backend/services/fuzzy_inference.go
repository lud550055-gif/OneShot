package services

import (
	"fmt"
	"math"

	"github.com/oneshot/dsss/models"
)

const inferenceSteps = 300

// findTerm looks up a term by name in a linguistic variable
func findTerm(lv models.LinguisticVariable, termName string) *models.LinguisticTerm {
	for i := range lv.Terms {
		if lv.Terms[i].Name == termName {
			return &lv.Terms[i]
		}
	}
	return nil
}

// computeAntecedent computes alpha (degree of rule firing) for one rule
func computeAntecedent(rule models.Rule, inputVars map[string]models.LinguisticVariable, inputValues map[string]float64) float64 {
	if len(rule.Antecedents) == 0 {
		return 0
	}

	memberships := make([]float64, 0, len(rule.Antecedents))
	for _, ant := range rule.Antecedents {
		lv, ok := inputVars[ant.Variable]
		if !ok {
			continue
		}
		term := findTerm(lv, ant.Term)
		if term == nil {
			continue
		}
		x := inputValues[ant.Variable]
		mu := ComputeMF(term.MF, x)
		memberships = append(memberships, mu)
	}

	if len(memberships) == 0 {
		return 0
	}

	connector := rule.Connector
	if connector == "" {
		connector = "and"
	}

	alpha := memberships[0]
	for _, mu := range memberships[1:] {
		if connector == "and" {
			alpha = math.Min(alpha, mu)
		} else {
			alpha = math.Max(alpha, mu)
		}
	}
	return alpha
}

// RunMamdani implements the Mamdani fuzzy inference algorithm
func RunMamdani(req models.InferenceRequest) models.InferenceResponse {
	resp := models.InferenceResponse{
		FuzzifiedInputs: make(map[string]map[string]float64),
		Steps:           []models.StepInfo{},
	}

	// Step 1: Fuzzification
	for varName, lv := range req.InputVars {
		resp.FuzzifiedInputs[varName] = make(map[string]float64)
		x := req.InputValues[varName]
		for _, term := range lv.Terms {
			mu := ComputeMF(term.MF, x)
			resp.FuzzifiedInputs[varName][term.Name] = math.Round(mu*1000) / 1000
		}
	}
	resp.Steps = append(resp.Steps, models.StepInfo{
		Step:        "Фаззификация",
		Description: fmt.Sprintf("Вычислены степени принадлежности для всех входных переменных"),
	})

	// Step 2 & 3: Aggregation + Activation
	outDomain := req.OutputVar.Domain
	yMin, yMax := outDomain[0], outDomain[1]

	activations := make([]models.RuleActivation, 0, len(req.Rules))
	accumulatedMF := make([]models.MFPoint, inferenceSteps)

	// Initialize accumulation to zero
	for i := 0; i < inferenceSteps; i++ {
		y := yMin + (yMax-yMin)*float64(i)/float64(inferenceSteps-1)
		accumulatedMF[i] = models.MFPoint{X: y, Mu: 0}
	}

	for rIdx, rule := range req.Rules {
		// Aggregation: compute alpha
		alpha := computeAntecedent(rule, req.InputVars, req.InputValues)

		term := findTerm(req.OutputVar, rule.Consequent.Term)
		outputCurve := make([]models.MFPoint, inferenceSteps)

		for i := 0; i < inferenceSteps; i++ {
			y := yMin + (yMax-yMin)*float64(i)/float64(inferenceSteps-1)
			var muActivated float64
			if term != nil {
				muC := ComputeMF(term.MF, y)
				// min-activation (Mamdani): cut at alpha
				muActivated = math.Min(alpha, muC)
			}
			outputCurve[i] = models.MFPoint{X: y, Mu: muActivated}

			// Accumulation: max
			if muActivated > accumulatedMF[i].Mu {
				accumulatedMF[i].Mu = muActivated
			}
		}

		activations = append(activations, models.RuleActivation{
			RuleIndex:   rIdx,
			Alpha:       math.Round(alpha*1000) / 1000,
			OutputCurve: outputCurve,
		})
	}

	resp.Activations = activations
	resp.AccumulatedMF = accumulatedMF
	resp.Steps = append(resp.Steps,
		models.StepInfo{Step: "Агрегирование", Description: "Вычислены уровни отсечения α для каждого правила"},
		models.StepInfo{Step: "Активизация (min)", Description: "ФП выхода усечены по уровню α"},
		models.StepInfo{Step: "Аккумуляция (max)", Description: "Результирующая ФП получена операцией MAX"},
	)

	// Step 5: Defuzzification
	crispOutput, term := defuzzify(accumulatedMF, yMin, yMax, req.Defuzz)
	resp.CrispOutput = math.Round(crispOutput*1000) / 1000
	resp.OutputTerm = findClosestTerm(req.OutputVar, crispOutput)
	resp.Steps = append(resp.Steps, models.StepInfo{
		Step:        "Дефаззификация (" + req.Defuzz + ")",
		Description: fmt.Sprintf("Чёткое значение выхода: %.3f, ближайший терм: %s", crispOutput, term),
	})

	return resp
}

// RunLarsen is like Mamdani but uses prod-activation instead of min
func RunLarsen(req models.InferenceRequest) models.InferenceResponse {
	resp := models.InferenceResponse{
		FuzzifiedInputs: make(map[string]map[string]float64),
		Steps:           []models.StepInfo{},
	}

	for varName, lv := range req.InputVars {
		resp.FuzzifiedInputs[varName] = make(map[string]float64)
		x := req.InputValues[varName]
		for _, term := range lv.Terms {
			mu := ComputeMF(term.MF, x)
			resp.FuzzifiedInputs[varName][term.Name] = math.Round(mu*1000) / 1000
		}
	}
	resp.Steps = append(resp.Steps, models.StepInfo{
		Step:        "Фаззификация",
		Description: "Вычислены степени принадлежности входных переменных",
	})

	outDomain := req.OutputVar.Domain
	yMin, yMax := outDomain[0], outDomain[1]

	activations := make([]models.RuleActivation, 0, len(req.Rules))
	accumulatedMF := make([]models.MFPoint, inferenceSteps)
	for i := 0; i < inferenceSteps; i++ {
		y := yMin + (yMax-yMin)*float64(i)/float64(inferenceSteps-1)
		accumulatedMF[i] = models.MFPoint{X: y, Mu: 0}
	}

	for rIdx, rule := range req.Rules {
		alpha := computeAntecedent(rule, req.InputVars, req.InputValues)
		term := findTerm(req.OutputVar, rule.Consequent.Term)
		outputCurve := make([]models.MFPoint, inferenceSteps)

		for i := 0; i < inferenceSteps; i++ {
			y := yMin + (yMax-yMin)*float64(i)/float64(inferenceSteps-1)
			var muActivated float64
			if term != nil {
				muC := ComputeMF(term.MF, y)
				// prod-activation (Larsen): scale by alpha
				muActivated = alpha * muC
			}
			outputCurve[i] = models.MFPoint{X: y, Mu: muActivated}

			if muActivated > accumulatedMF[i].Mu {
				accumulatedMF[i].Mu = muActivated
			}
		}

		activations = append(activations, models.RuleActivation{
			RuleIndex:   rIdx,
			Alpha:       math.Round(alpha*1000) / 1000,
			OutputCurve: outputCurve,
		})
	}

	resp.Activations = activations
	resp.AccumulatedMF = accumulatedMF
	resp.Steps = append(resp.Steps,
		models.StepInfo{Step: "Агрегирование", Description: "Вычислены уровни отсечения α"},
		models.StepInfo{Step: "Активизация (prod)", Description: "ФП выхода масштабированы множением на α"},
		models.StepInfo{Step: "Аккумуляция (max)", Description: "Результирующая ФП = MAX по всем правилам"},
	)

	crispOutput, term := defuzzify(accumulatedMF, yMin, yMax, req.Defuzz)
	resp.CrispOutput = math.Round(crispOutput*1000) / 1000
	resp.OutputTerm = findClosestTerm(req.OutputVar, crispOutput)
	resp.Steps = append(resp.Steps, models.StepInfo{
		Step:        "Дефаззификация (" + req.Defuzz + ")",
		Description: fmt.Sprintf("Чёткое значение выхода: %.3f, ближайший терм: %s", crispOutput, term),
	})

	return resp
}

// RunSugeno implements the Takagi-Sugeno fuzzy inference
// Each rule's consequent is a linear function: y_i = a0 + a1*x1 + a2*x2 + ...
// sugenoCoeffs[ruleIdx] = [a0, a1, a2, ...]
func RunSugeno(req models.InferenceRequest) models.InferenceResponse {
	resp := models.InferenceResponse{
		FuzzifiedInputs: make(map[string]map[string]float64),
		Steps:           []models.StepInfo{},
	}

	for varName, lv := range req.InputVars {
		resp.FuzzifiedInputs[varName] = make(map[string]float64)
		x := req.InputValues[varName]
		for _, term := range lv.Terms {
			mu := ComputeMF(term.MF, x)
			resp.FuzzifiedInputs[varName][term.Name] = math.Round(mu*1000) / 1000
		}
	}
	resp.Steps = append(resp.Steps, models.StepInfo{Step: "Фаззификация", Description: "Вычислены μ для всех термов"})

	// Ordered input variable names for consistent coefficient indexing
	var inputOrder []string
	for k := range req.InputVars {
		inputOrder = append(inputOrder, k)
	}

	alphas := make([]float64, len(req.Rules))
	yValues := make([]float64, len(req.Rules))

	sumAlpha := 0.0
	sumAlphaY := 0.0

	activations := make([]models.RuleActivation, 0, len(req.Rules))

	for rIdx, rule := range req.Rules {
		alpha := computeAntecedent(rule, req.InputVars, req.InputValues)
		alphas[rIdx] = alpha

		// Compute consequent function value
		var yi float64
		coeffs := []float64{0}
		if rIdx < len(req.SugenoCoeffs) {
			coeffs = req.SugenoCoeffs[rIdx]
		}
		if len(coeffs) > 0 {
			yi = coeffs[0]
		}
		for ci, varName := range inputOrder {
			if ci+1 < len(coeffs) {
				yi += coeffs[ci+1] * req.InputValues[varName]
			}
		}
		yValues[rIdx] = yi

		sumAlpha += alpha
		sumAlphaY += alpha * yi

		activations = append(activations, models.RuleActivation{
			RuleIndex: rIdx,
			Alpha:     math.Round(alpha*1000) / 1000,
		})
	}

	resp.Activations = activations
	resp.Steps = append(resp.Steps,
		models.StepInfo{Step: "Агрегирование", Description: "Вычислены α для каждого правила"},
		models.StepInfo{Step: "Активизация", Description: "Вычислены значения линейных функций y_i для каждого правила"},
	)

	var crispOutput float64
	if sumAlpha > 0 {
		crispOutput = sumAlphaY / sumAlpha
	}

	resp.CrispOutput = math.Round(crispOutput*1000) / 1000
	resp.OutputTerm = findClosestTerm(req.OutputVar, crispOutput)
	resp.Steps = append(resp.Steps, models.StepInfo{
		Step:        "Дефаззификация (взвешенное среднее)",
		Description: fmt.Sprintf("y* = Σ(α_i * y_i) / Σ(α_i) = %.3f", crispOutput),
	})

	return resp
}

// defuzzify converts accumulated MF to crisp value using selected method
func defuzzify(mf []models.MFPoint, yMin, yMax float64, method string) (float64, string) {
	if len(mf) == 0 {
		return (yMin + yMax) / 2, ""
	}

	switch method {
	case "mom": // Mean of Maximums
		maxMu := 0.0
		for _, p := range mf {
			if p.Mu > maxMu {
				maxMu = p.Mu
			}
		}
		sumX, count := 0.0, 0.0
		for _, p := range mf {
			if math.Abs(p.Mu-maxMu) < 1e-9 {
				sumX += p.X
				count++
			}
		}
		if count == 0 {
			return (yMin + yMax) / 2, "mom"
		}
		return sumX / count, "mom"

	case "som": // Smallest of Maximums
		maxMu := 0.0
		for _, p := range mf {
			if p.Mu > maxMu {
				maxMu = p.Mu
			}
		}
		for _, p := range mf {
			if math.Abs(p.Mu-maxMu) < 1e-9 {
				return p.X, "som"
			}
		}

	case "lom": // Largest of Maximums
		maxMu := 0.0
		for _, p := range mf {
			if p.Mu > maxMu {
				maxMu = p.Mu
			}
		}
		for i := len(mf) - 1; i >= 0; i-- {
			if math.Abs(mf[i].Mu-maxMu) < 1e-9 {
				return mf[i].X, "lom"
			}
		}

	default: // "cog" - Center of Gravity
		sumWY, sumW := 0.0, 0.0
		for _, p := range mf {
			sumWY += p.X * p.Mu
			sumW += p.Mu
		}
		if sumW == 0 {
			return (yMin + yMax) / 2, "cog"
		}
		return sumWY / sumW, "cog"
	}
	return (yMin + yMax) / 2, method
}

// findClosestTerm returns the name of the output term whose peak is closest to y
func findClosestTerm(outputVar models.LinguisticVariable, y float64) string {
	bestName := ""
	bestDist := math.MaxFloat64

	outDomain := outputVar.Domain
	yMin, yMax := outDomain[0], outDomain[1]
	steps := 50

	for _, term := range outputVar.Terms {
		// Find peak of this term's MF
		peakMu, peakX := 0.0, yMin
		for i := 0; i <= steps; i++ {
			x := yMin + (yMax-yMin)*float64(i)/float64(steps)
			mu := ComputeMF(term.MF, x)
			if mu > peakMu {
				peakMu = mu
				peakX = x
			}
		}
		dist := math.Abs(y - peakX)
		if dist < bestDist {
			bestDist = dist
			bestName = term.Name
		}
	}
	return bestName
}
