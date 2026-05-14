package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/oneshot/dsss/data"
	"github.com/oneshot/dsss/database"
	"github.com/oneshot/dsss/models"
	"github.com/oneshot/dsss/services"
)

// GetFuzzySetsTasks returns all predefined IS security tasks for fuzzy sets
func GetFuzzySetsTasks(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"tasks": data.FuzzySetsTasks})
}

// ComputeMembership calculates membership function values over a range
func ComputeMembership(c *gin.Context) {
	var req models.ComputeMFRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Steps == 0 {
		req.Steps = 200
	}
	points := services.GenerateMFPoints(req.MF, req.XMin, req.XMax, req.Steps)
	c.JSON(http.StatusOK, models.ComputeMFResponse{Points: points})
}

// PerformOperation executes a fuzzy set operation (AND, OR, NOT, CON, DIL)
func PerformOperation(c *gin.Context) {
	var req models.OperationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := services.ApplyOperation(req.SetA, req.SetB, req.Operation, req.Lambda)
	label := operationLabel(req.Operation)

	c.JSON(http.StatusOK, models.OperationResponse{Result: result, Label: label})
}

// ComputeComposition performs max-min or max-prod composition of fuzzy relations
func ComputeComposition(c *gin.Context) {
	var req models.CompositionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var result [][]float64
	switch req.Method {
	case "max_prod":
		result = services.MaxProdComposition(req.R1, req.R2)
	default:
		result = services.MaxMinComposition(req.R1, req.R2)
	}

	c.JSON(http.StatusOK, models.CompositionResponse{Result: result})
}

// ComputeProperties calculates properties of a fuzzy set (height, support, core, convexity)
func ComputeProperties(c *gin.Context) {
	var points []models.MFPoint
	if err := c.ShouldBindJSON(&points); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	props := services.ComputeProperties(points)
	c.JSON(http.StatusOK, props)
}

// SolveFuzzySetsTask solves a complete predefined task
func SolveFuzzySetsTask(c *gin.Context) {
	taskID := c.Param("id")
	var req struct {
		XPoint float64 `json:"xPoint"`
	}
	c.ShouldBindJSON(&req)

	// Find task
	var task map[string]interface{}
	for _, t := range data.FuzzySetsTasks {
		if t["id"] == taskID {
			task = t
			break
		}
	}
	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}

	database.SaveHistory("fuzzy_sets", taskID, req, task)
	c.JSON(http.StatusOK, gin.H{"task": task})
}

func operationLabel(op string) string {
	labels := map[string]string{
		"not":         "НЕ A (дополнение по Заде)",
		"not_sugeno":  "НЕ A (по Сугено)",
		"and_min":     "A И B (T-min)",
		"and_prod":    "A И B (T-prod)",
		"and_bounded": "A И B (T-bounded)",
		"and_drastic": "A И B (T-drastic)",
		"or_max":      "A ИЛИ B (S-max)",
		"or_sum":      "A ИЛИ B (S-sum)",
		"or_bounded":  "A ИЛИ B (S-bounded)",
		"or_drastic":  "A ИЛИ B (S-drastic)",
		"con":         "CON(A) — «Очень A»",
		"dil":         "DIL(A) — «Довольно A»",
	}
	if l, ok := labels[op]; ok {
		return l
	}
	return op
}
