package services

import (
	"fmt"
	"math"
	"sort"

	"github.com/oneshot/dsss/models"
)

// ─── Entropy ──────────────────────────────────────────────────────────────────

// Entropy calculates Shannon entropy H(S) = -Σ(p_i * log2(p_i))
func Entropy(data []models.Sample) float64 {
	if len(data) == 0 {
		return 0
	}
	classCounts := make(map[string]int)
	for _, s := range data {
		classCounts[s.Class]++
	}
	total := float64(len(data))
	h := 0.0
	for _, count := range classCounts {
		if count == 0 {
			continue
		}
		p := float64(count) / total
		h -= p * math.Log2(p)
	}
	return h
}

// GiniIndex calculates Gini impurity = 1 - Σ(p_i²)
func GiniIndex(data []models.Sample) float64 {
	if len(data) == 0 {
		return 0
	}
	classCounts := make(map[string]int)
	for _, s := range data {
		classCounts[s.Class]++
	}
	total := float64(len(data))
	gini := 1.0
	for _, count := range classCounts {
		p := float64(count) / total
		gini -= p * p
	}
	return gini
}

// InformationGain calculates Gain(S,A) = H(S) - Σ(|S_v|/|S| * H(S_v))
func InformationGain(data []models.Sample, feature string) float64 {
	parentEntropy := Entropy(data)
	total := float64(len(data))

	groups := splitByFeature(data, feature)
	weightedEntropy := 0.0
	for _, group := range groups {
		weight := float64(len(group)) / total
		weightedEntropy += weight * Entropy(group)
	}
	return parentEntropy - weightedEntropy
}

func splitByFeature(data []models.Sample, feature string) map[string][]models.Sample {
	groups := make(map[string][]models.Sample)
	for _, s := range data {
		val := s.Features[feature]
		groups[val] = append(groups[val], s)
	}
	return groups
}

func majorityClass(data []models.Sample) string {
	counts := make(map[string]int)
	for _, s := range data {
		counts[s.Class]++
	}
	best, bestCount := "", 0
	for cls, cnt := range counts {
		if cnt > bestCount {
			bestCount = cnt
			best = cls
		}
	}
	return best
}

func allSameClass(data []models.Sample) bool {
	if len(data) == 0 {
		return true
	}
	cls := data[0].Class
	for _, s := range data {
		if s.Class != cls {
			return false
		}
	}
	return true
}

// ─── ID3 Tree Builder ─────────────────────────────────────────────────────────

type TreeBuilder struct {
	Steps []models.EntropyStep
}

func (tb *TreeBuilder) Build(data []models.Sample, features []string, depth int) *models.TreeNode {
	node := &models.TreeNode{
		SampleCount: len(data),
		Entropy:     math.Round(Entropy(data)*10000) / 10000,
	}

	// Leaf conditions
	if len(data) == 0 {
		node.IsLeaf = true
		node.Class = "unknown"
		return node
	}
	if allSameClass(data) {
		node.IsLeaf = true
		node.Class = data[0].Class
		return node
	}
	if len(features) == 0 || depth > 10 {
		node.IsLeaf = true
		node.Class = majorityClass(data)
		return node
	}

	// Find best feature by information gain
	gainMap := make(map[string]float64)
	bestFeature := ""
	bestGain := -1.0

	for _, f := range features {
		gain := InformationGain(data, f)
		gainMap[f] = math.Round(gain*10000) / 10000
		if gain > bestGain {
			bestGain = gain
			bestFeature = f
		}
	}

	tb.Steps = append(tb.Steps, models.EntropyStep{
		Node:        fmt.Sprintf("Depth %d (n=%d)", depth, len(data)),
		Feature:     bestFeature,
		Entropy:     node.Entropy,
		GainPerAttr: gainMap,
		Selected:    bestFeature,
	})

	// If no information gain, create a leaf
	if bestGain <= 0 {
		node.IsLeaf = true
		node.Class = majorityClass(data)
		return node
	}

	node.Feature = bestFeature
	node.Gain = math.Round(bestGain*10000) / 10000

	// Remove best feature from remaining features
	remaining := make([]string, 0, len(features)-1)
	for _, f := range features {
		if f != bestFeature {
			remaining = append(remaining, f)
		}
	}

	// Split and recurse
	groups := splitByFeature(data, bestFeature)
	node.Children = make(map[string]*models.TreeNode)

	// Sort keys for deterministic output
	vals := make([]string, 0, len(groups))
	for v := range groups {
		vals = append(vals, v)
	}
	sort.Strings(vals)

	for _, val := range vals {
		group := groups[val]
		if len(group) == 0 {
			// Create leaf with majority class from parent
			child := &models.TreeNode{
				IsLeaf:      true,
				Class:       majorityClass(data),
				SampleCount: 0,
				Entropy:     0,
			}
			node.Children[val] = child
		} else {
			node.Children[val] = tb.Build(group, remaining, depth+1)
		}
	}

	return node
}

// ExtractRules converts a decision tree to IF-THEN rules
func ExtractRules(node *models.TreeNode, path []string) []string {
	if node == nil {
		return nil
	}
	if node.IsLeaf {
		if len(path) == 0 {
			return []string{fmt.Sprintf("ТОГДА класс = %s", node.Class)}
		}
		condition := ""
		for i, p := range path {
			if i > 0 {
				condition += " И "
			}
			condition += p
		}
		return []string{fmt.Sprintf("ЕСЛИ %s — ТОГДА класс = «%s»", condition, node.Class)}
	}

	var rules []string
	vals := make([]string, 0, len(node.Children))
	for v := range node.Children {
		vals = append(vals, v)
	}
	sort.Strings(vals)

	for _, val := range vals {
		child := node.Children[val]
		newPath := append(append([]string{}, path...), fmt.Sprintf("%s = %s", node.Feature, val))
		rules = append(rules, ExtractRules(child, newPath)...)
	}
	return rules
}

// BuildDecisionTree is the main entry point
func BuildDecisionTree(req models.BuildTreeRequest) models.BuildTreeResponse {
	tb := &TreeBuilder{}
	tree := tb.Build(req.Data, req.Features, 0)
	rules := ExtractRules(tree, nil)
	return models.BuildTreeResponse{
		Tree:  tree,
		Steps: tb.Steps,
		Rules: rules,
	}
}

// ClassifySample traverses the tree to classify a new sample
func ClassifySample(tree *models.TreeNode, sample map[string]string) models.ClassifyResponse {
	path := []string{}
	node := tree

	for node != nil && !node.IsLeaf {
		featureVal, ok := sample[node.Feature]
		if !ok {
			break
		}
		path = append(path, fmt.Sprintf("%s = %s", node.Feature, featureVal))
		child, exists := node.Children[featureVal]
		if !exists {
			break
		}
		node = child
	}

	cls := "unknown"
	if node != nil && node.IsLeaf {
		cls = node.Class
	}

	return models.ClassifyResponse{
		Class: cls,
		Path:  path,
	}
}
