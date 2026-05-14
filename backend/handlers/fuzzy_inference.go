package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/oneshot/dsss/data"
	"github.com/oneshot/dsss/database"
	"github.com/oneshot/dsss/models"
	"github.com/oneshot/dsss/services"
)

// GetInferenceTasks returns all predefined fuzzy inference IS tasks
func GetInferenceTasks(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"tasks": data.InferenceTasks})
}

// RunInference dispatches to the correct algorithm
func RunInference(c *gin.Context) {
	var req models.InferenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Defuzz == "" {
		req.Defuzz = "cog"
	}

	var resp models.InferenceResponse
	switch req.Algorithm {
	case "larsen":
		resp = services.RunLarsen(req)
	case "sugeno":
		resp = services.RunSugeno(req)
	default: // mamdani
		resp = services.RunMamdani(req)
	}

	database.SaveHistory("fuzzy_inference", req.Algorithm, req.InputValues, resp.CrispOutput)
	c.JSON(http.StatusOK, resp)
}

// SolveInferenceTask solves a complete predefined task with given input values
func SolveInferenceTask(c *gin.Context) {
	taskID := c.Param("id")
	var body struct {
		InputValues map[string]float64 `json:"inputValues"`
		Defuzz      string             `json:"defuzz"`
		Algorithm   string             `json:"algorithm"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find task config
	var taskConfig map[string]interface{}
	for _, t := range data.InferenceTasks {
		if t["id"] == taskID {
			taskConfig = t
			break
		}
	}
	if taskConfig == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}

	// The task has its config pre-built — return it with the task
	database.SaveHistory("fuzzy_inference", taskID, body, taskConfig)
	c.JSON(http.StatusOK, gin.H{"task": taskConfig})
}
