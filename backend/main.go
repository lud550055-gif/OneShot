package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/oneshot/dsss/database"
	"github.com/oneshot/dsss/handlers"
)

func main() {
	database.Connect()

	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: false,
	}))

	api := r.Group("/api/v1")
	{
		// Fuzzy Sets
		fs := api.Group("/fuzzy-sets")
		{
			fs.GET("/tasks", handlers.GetFuzzySetsTasks)
			fs.POST("/tasks/:id/solve", handlers.SolveFuzzySetsTask)
			fs.POST("/membership", handlers.ComputeMembership)
			fs.POST("/operations", handlers.PerformOperation)
			fs.POST("/composition", handlers.ComputeComposition)
			fs.POST("/properties", handlers.ComputeProperties)
		}

		// Fuzzy Inference
		inf := api.Group("/inference")
		{
			inf.GET("/tasks", handlers.GetInferenceTasks)
			inf.POST("/tasks/:id/solve", handlers.SolveInferenceTask)
			inf.POST("/run", handlers.RunInference)
		}

		// Decision Tree
		dt := api.Group("/decision-tree")
		{
			dt.GET("/tasks", handlers.GetDecisionTreeTasks)
			dt.POST("/tasks/:id/solve", handlers.SolveDecisionTreeTask)
			dt.POST("/build", handlers.BuildTree)
			dt.POST("/classify", handlers.ClassifySample)
			dt.POST("/entropy", handlers.ComputeEntropy)
		}

		// Architecture & History
		api.GET("/architecture", handlers.GetArchitecture)
		api.GET("/history", handlers.GetHistory)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("DSSS Backend starting on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
