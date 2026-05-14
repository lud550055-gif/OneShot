package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/oneshot/dsss/data"
	"github.com/oneshot/dsss/database"
	"github.com/oneshot/dsss/models"
	"github.com/oneshot/dsss/services"
)

// GetDecisionTreeTasks returns all predefined decision tree IS tasks
func GetDecisionTreeTasks(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"tasks": data.DecisionTreeTasks})
}

// BuildTree builds an ID3 decision tree from provided training data
func BuildTree(c *gin.Context) {
	var req models.BuildTreeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if len(req.Data) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "data is empty"})
		return
	}

	resp := services.BuildDecisionTree(req)
	database.SaveHistory("decision_tree", "custom", req, resp.Tree)
	c.JSON(http.StatusOK, resp)
}

// ClassifySample classifies a new sample using an existing tree
func ClassifySample(c *gin.Context) {
	var req models.ClassifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Tree == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tree is nil"})
		return
	}

	resp := services.ClassifySample(req.Tree, req.Sample)
	c.JSON(http.StatusOK, resp)
}

// SolveDecisionTreeTask builds a tree for a predefined IS security task
func SolveDecisionTreeTask(c *gin.Context) {
	taskID := c.Param("id")

	var task map[string]interface{}
	for _, t := range data.DecisionTreeTasks {
		if t["id"] == taskID {
			task = t
			break
		}
	}
	if task == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
		return
	}

	// Convert task data to BuildTreeRequest
	rawData, ok := task["data"].([]map[string]interface{})
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid task data format"})
		return
	}

	samples := make([]models.Sample, len(rawData))
	for i, d := range rawData {
		feats := make(map[string]string)
		if f, ok := d["features"].(map[string]string); ok {
			feats = f
		}
		cls := ""
		if cl, ok := d["class"].(string); ok {
			cls = cl
		}
		samples[i] = models.Sample{Features: feats, Class: cls}
	}

	features, _ := task["features"].([]string)

	req := models.BuildTreeRequest{Data: samples, Features: features}
	resp := services.BuildDecisionTree(req)

	database.SaveHistory("decision_tree", taskID, task["features"], resp.Tree)
	c.JSON(http.StatusOK, gin.H{
		"task":  task,
		"tree":  resp.Tree,
		"steps": resp.Steps,
		"rules": resp.Rules,
	})
}

// ComputeEntropy calculates Shannon entropy for a given class distribution
func ComputeEntropy(c *gin.Context) {
	var body struct {
		Data []models.Sample `json:"data"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	h := services.Entropy(body.Data)
	gini := services.GiniIndex(body.Data)

	c.JSON(http.StatusOK, gin.H{
		"entropy":   h,
		"giniIndex": gini,
	})
}
