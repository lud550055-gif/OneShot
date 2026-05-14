package services

import (
	"math"

	"github.com/oneshot/dsss/models"
)

// ─── Membership Functions ─────────────────────────────────────────────────────

func ComputeMF(mf models.MembershipFunction, x float64) float64 {
	switch mf.Type {
	case models.MFTriangular:
		// params: [a, e, c] — left foot, peak, right foot
		if len(mf.Params) < 3 {
			return 0
		}
		a, e, c := mf.Params[0], mf.Params[1], mf.Params[2]
		if x <= a || x >= c {
			return 0
		}
		if x <= e {
			if e == a {
				return 1
			}
			return (x - a) / (e - a)
		}
		if e == c {
			return 1
		}
		return (c - x) / (c - e)

	case models.MFTrapezoidal:
		// params: [a, b, c, d] — left foot, left top, right top, right foot
		if len(mf.Params) < 4 {
			return 0
		}
		a, b, c, d := mf.Params[0], mf.Params[1], mf.Params[2], mf.Params[3]
		if x <= a || x >= d {
			return 0
		}
		if x < b {
			if b == a {
				return 1
			}
			return (x - a) / (b - a)
		}
		if x <= c {
			return 1
		}
		if d == c {
			return 0
		}
		return (d - x) / (d - c)

	case models.MFGaussian:
		// params: [b, a] — center, width
		if len(mf.Params) < 2 {
			return 0
		}
		b, a := mf.Params[0], mf.Params[1]
		if a == 0 {
			return 0
		}
		return math.Exp(-math.Pow((x-b)/a, 2))

	case models.MFZType:
		// params: [a, b] — start of decrease, end of decrease
		if len(mf.Params) < 2 {
			return 0
		}
		a, b := mf.Params[0], mf.Params[1]
		if x <= a {
			return 1
		}
		if x >= b {
			return 0
		}
		mid := (a + b) / 2
		if x <= mid {
			return 1 - 2*math.Pow((x-a)/(b-a), 2)
		}
		return 2 * math.Pow((x-b)/(b-a), 2)

	case models.MFSType:
		// params: [a, b] — start of rise, end of rise
		if len(mf.Params) < 2 {
			return 0
		}
		a, b := mf.Params[0], mf.Params[1]
		if x <= a {
			return 0
		}
		if x >= b {
			return 1
		}
		mid := (a + b) / 2
		if x <= mid {
			return 2 * math.Pow((x-a)/(b-a), 2)
		}
		return 1 - 2*math.Pow((x-b)/(b-a), 2)
	}
	return 0
}

// GenerateMFPoints discretizes a membership function over [xMin, xMax]
func GenerateMFPoints(mf models.MembershipFunction, xMin, xMax float64, steps int) []models.MFPoint {
	if steps < 2 {
		steps = 200
	}
	points := make([]models.MFPoint, steps)
	for i := 0; i < steps; i++ {
		x := xMin + (xMax-xMin)*float64(i)/float64(steps-1)
		points[i] = models.MFPoint{X: x, Mu: ComputeMF(mf, x)}
	}
	return points
}

// ─── T-norms (AND operations) ─────────────────────────────────────────────────

func TMin(a, b float64) float64 { return math.Min(a, b) }
func TProd(a, b float64) float64 { return a * b }
func TMaxBounded(a, b float64) float64 { return math.Max(0, a+b-1) }
func TDrastic(a, b float64) float64 {
	if a == 1 {
		return b
	}
	if b == 1 {
		return a
	}
	return 0
}

// ─── S-norms (OR operations) ─────────────────────────────────────────────────

func SMax(a, b float64) float64 { return math.Max(a, b) }
func SAlgebraicSum(a, b float64) float64 { return a + b - a*b }
func SBoundedSum(a, b float64) float64 { return math.Min(1, a+b) }
func SDrastic(a, b float64) float64 {
	if a == 0 {
		return b
	}
	if b == 0 {
		return a
	}
	return 1
}

// ─── Linguistic modifiers ─────────────────────────────────────────────────────

func CON(mu float64) float64 { return mu * mu }
func DIL(mu float64) float64 { return math.Sqrt(mu) }

// ─── NOT operations ──────────────────────────────────────────────────────────

func NotZade(mu float64) float64 { return 1 - mu }
func NotSugeno(mu, lambda float64) float64 {
	return (1 - mu) / (1 + lambda*mu)
}

// ─── Pointwise operations ─────────────────────────────────────────────────────

func ApplyOperation(setA, setB []models.MFPoint, op string, lambda float64) []models.MFPoint {
	n := len(setA)
	result := make([]models.MFPoint, n)

	for i := 0; i < n; i++ {
		x := setA[i].X
		a := setA[i].Mu
		b := 0.0
		if i < len(setB) {
			b = setB[i].Mu
		}

		var mu float64
		switch op {
		case "not":
			mu = NotZade(a)
		case "not_sugeno":
			mu = NotSugeno(a, lambda)
		case "and_min":
			mu = TMin(a, b)
		case "and_prod":
			mu = TProd(a, b)
		case "and_bounded":
			mu = TMaxBounded(a, b)
		case "and_drastic":
			mu = TDrastic(a, b)
		case "or_max":
			mu = SMax(a, b)
		case "or_sum":
			mu = SAlgebraicSum(a, b)
		case "or_bounded":
			mu = SBoundedSum(a, b)
		case "or_drastic":
			mu = SDrastic(a, b)
		case "con":
			mu = CON(a)
		case "dil":
			mu = DIL(a)
		default:
			mu = a
		}
		result[i] = models.MFPoint{X: x, Mu: mu}
	}
	return result
}

// ─── Fuzzy relation composition ───────────────────────────────────────────────

// MaxMinComposition: μ(x,z) = max_y( min(μR1(x,y), μR2(y,z)) )
func MaxMinComposition(R1, R2 [][]float64) [][]float64 {
	m := len(R1)
	if m == 0 {
		return nil
	}
	k := len(R2)
	if k == 0 {
		return nil
	}
	p := len(R2[0])

	result := make([][]float64, m)
	for i := range result {
		result[i] = make([]float64, p)
		for j := 0; j < p; j++ {
			maxVal := 0.0
			for l := 0; l < k; l++ {
				val := math.Min(R1[i][l], R2[l][j])
				if val > maxVal {
					maxVal = val
				}
			}
			result[i][j] = maxVal
		}
	}
	return result
}

// MaxProdComposition: μ(x,z) = max_y( μR1(x,y) * μR2(y,z) )
func MaxProdComposition(R1, R2 [][]float64) [][]float64 {
	m := len(R1)
	if m == 0 {
		return nil
	}
	k := len(R2)
	if k == 0 {
		return nil
	}
	p := len(R2[0])

	result := make([][]float64, m)
	for i := range result {
		result[i] = make([]float64, p)
		for j := 0; j < p; j++ {
			maxVal := 0.0
			for l := 0; l < k; l++ {
				val := R1[i][l] * R2[l][j]
				if val > maxVal {
					maxVal = val
				}
			}
			result[i][j] = maxVal
		}
	}
	return result
}

// AlphaCut returns indices/values where μ(x) >= alpha
func AlphaCut(points []models.MFPoint, alpha float64, strict bool) []models.MFPoint {
	var result []models.MFPoint
	for _, p := range points {
		if strict && p.Mu > alpha {
			result = append(result, p)
		} else if !strict && p.Mu >= alpha {
			result = append(result, p)
		}
	}
	return result
}

// Properties of a fuzzy set
type FuzzySetProperties struct {
	Height      float64  `json:"height"`
	Support     []float64 `json:"support"` // [min_x, max_x] where μ > 0
	Core        []float64 `json:"core"`    // [min_x, max_x] where μ = 1
	IsNormal    bool     `json:"isNormal"`
	IsConvex    bool     `json:"isConvex"`
}

func ComputeProperties(points []models.MFPoint) FuzzySetProperties {
	props := FuzzySetProperties{IsConvex: true}
	supportMin, supportMax := math.MaxFloat64, -math.MaxFloat64
	coreMin, coreMax := math.MaxFloat64, -math.MaxFloat64
	hasCore := false

	for _, p := range points {
		if p.Mu > props.Height {
			props.Height = p.Mu
		}
		if p.Mu > 0 {
			if p.X < supportMin {
				supportMin = p.X
			}
			if p.X > supportMax {
				supportMax = p.X
			}
		}
		if math.Abs(p.Mu-1.0) < 1e-9 {
			hasCore = true
			if p.X < coreMin {
				coreMin = p.X
			}
			if p.X > coreMax {
				coreMax = p.X
			}
		}
	}

	props.IsNormal = props.Height >= 1.0-1e-9

	if supportMax >= supportMin {
		props.Support = []float64{supportMin, supportMax}
	}
	if hasCore {
		props.Core = []float64{coreMin, coreMax}
	}

	// Convexity check: for all x1 <= x2 <= x3, μ(x2) >= min(μ(x1), μ(x3))
	for i := 1; i < len(points)-1; i++ {
		if points[i].Mu < math.Min(points[i-1].Mu, points[i+1].Mu)-1e-9 {
			props.IsConvex = false
			break
		}
	}

	return props
}
