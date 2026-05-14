package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	name := getEnv("DB_NAME", "dsss")
	user := getEnv("DB_USER", "dsss")
	pass := getEnv("DB_PASSWORD", "dsss_secret")

	dsn := fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s sslmode=disable",
		host, port, name, user, pass)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Printf("Warning: DB connection failed: %v — running without persistence", err)
		return
	}

	if err := db.Ping(); err != nil {
		log.Printf("Warning: DB ping failed: %v — running without persistence", err)
		return
	}

	DB = db
	log.Println("PostgreSQL connected")
}

func SaveHistory(module, taskID string, input, output interface{}) {
	if DB == nil {
		return
	}
	inJSON, _ := json.Marshal(input)
	outJSON, _ := json.Marshal(output)
	_, err := DB.Exec(
		`INSERT INTO calculation_history (module, task_id, input_data, output_data)
		 VALUES ($1, $2, $3::jsonb, $4::jsonb)`,
		module, taskID, string(inJSON), string(outJSON),
	)
	if err != nil {
		log.Printf("History save error: %v", err)
	}
}

func GetHistory(limit int) ([]map[string]interface{}, error) {
	if DB == nil {
		return []map[string]interface{}{}, nil
	}
	rows, err := DB.Query(
		`SELECT id, module, task_id, input_data::text, output_data::text, created_at::text
		 FROM calculation_history ORDER BY created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []map[string]interface{}
	for rows.Next() {
		var id int
		var module, taskID, inputData, outputData, createdAt string
		if err := rows.Scan(&id, &module, &taskID, &inputData, &outputData, &createdAt); err != nil {
			continue
		}
		records = append(records, map[string]interface{}{
			"id":         id,
			"module":     module,
			"taskId":     taskID,
			"inputData":  inputData,
			"outputData": outputData,
			"createdAt":  createdAt,
		})
	}
	return records, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
