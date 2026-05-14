package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/oneshot/dsss/database"
)

// GetArchitecture returns the DSSS logical architecture description
func GetArchitecture(c *gin.Context) {
	arch := map[string]interface{}{
		"title":       "Логическая архитектура учебной СППР",
		"description": "Архитектура системы поддержки принятия решений (СППР) в области информационной безопасности, построенная на концепции DWH + OLAP + Data Mining.",
		"layers": []map[string]interface{}{
			{
				"id":    "eis",
				"name":  "EIS — Интерфейс ЛПР",
				"color": "#00d4ff",
				"tech":  "React 18 + TypeScript + Vite",
				"components": []string{
					"Модуль нечётких множеств",
					"Модуль нечёткого логического вывода",
					"Модуль деревьев решений",
					"Визуализация архитектуры СППР",
					"Интерактивные графики (Recharts)",
					"Пошаговые объяснения алгоритмов",
				},
				"description": "Интерфейс лица, принимающего решения (ЛПР). Предоставляет интерактивный доступ к аналитическим модулям, визуализацию результатов и пошаговые объяснения алгоритмов.",
			},
			{
				"id":    "nginx",
				"name":  "Прокси-слой (Nginx)",
				"color": "#10b981",
				"tech":  "Nginx Alpine",
				"components": []string{
					"Маршрутизация запросов (/ → frontend, /api → backend)",
					"Балансировка нагрузки",
					"SSL-терминация (в production)",
					"Статическое кэширование",
				},
				"description": "Обратный прокси-сервер, маршрутизирующий запросы между frontend и backend. Обеспечивает единую точку входа для всех компонентов системы.",
			},
			{
				"id":    "olap",
				"name":  "OLAP-слой / Data Mining (Backend API)",
				"color": "#7c3aed",
				"tech":  "Go 1.22 + Gin Framework",
				"components": []string{
					"Нечёткие множества: ФП (треугольная, трапец., гаусс., Z, S)",
					"Операции: T-нормы (min, prod, bounded, drastic), S-нормы",
					"Лингвистические модификаторы: CON (очень), DIL (довольно)",
					"Нечёткий вывод: Мамдани, Ларсен, Такаги-Сугено",
					"Дефаззификация: COG, MOM, SOM, LOM",
					"Деревья решений: ID3 + Entropy + Gini + Information Gain",
					"Композиция нечётких отношений: max-min, max-prod",
					"REST API (JSON)",
				},
				"description": "Вычислительное ядро СППР. Реализует алгоритмы Data Mining: нечёткую логику (Mamdani/Larsen/Sugeno) и деревья решений (ID3). Соответствует уровню OLAP+DM в классической архитектуре СППР.",
			},
			{
				"id":    "dwh",
				"name":  "Слой данных (DWH)",
				"color": "#f59e0b",
				"tech":  "PostgreSQL 16",
				"components": []string{
					"Хранилище предопределённых задач ИБ",
					"История вычислений (calculation_history)",
					"JSONB для гибкого хранения входных/выходных данных",
					"Индексы для быстрого поиска",
				},
				"description": "Хранилище данных (Data Warehouse). Обеспечивает персистентность: хранит задачи ИБ и историю вычислений. Данные хранятся в JSONB для максимальной гибкости структуры.",
			},
			{
				"id":    "infra",
				"name":  "Инфраструктурный слой",
				"color": "#64748b",
				"tech":  "Docker + Docker Compose",
				"components": []string{
					"Контейнеризация всех сервисов",
					"Изолированные сети",
					"Health checks",
					"Volume для PostgreSQL данных",
					"Автоматический запуск зависимостей",
				},
				"description": "Инфраструктура как код. Docker Compose оркестрирует 4 сервиса: postgres, backend, frontend, nginx. Обеспечивает воспроизводимость среды и простоту развёртывания.",
			},
		},
		"dataFlow": []map[string]interface{}{
			{
				"from":        "eis",
				"to":          "nginx",
				"description": "HTTP-запросы пользователя",
			},
			{
				"from":        "nginx",
				"to":          "olap",
				"description": "REST API запросы /api/*",
			},
			{
				"from":        "olap",
				"to":          "dwh",
				"description": "SQL-запросы, сохранение истории",
			},
			{
				"from":        "olap",
				"to":          "nginx",
				"description": "JSON-ответы с результатами вычислений",
			},
			{
				"from":        "nginx",
				"to":          "eis",
				"description": "Данные для визуализации",
			},
		},
		"decisionProcess": []map[string]interface{}{
			{"step": 1, "title": "Постановка задачи", "description": "ЛПР выбирает метод (нечёткие мн-ва / НЛВ / дерево) и задачу из области ИБ"},
			{"step": 2, "title": "Ввод данных", "description": "Задаются входные параметры, функции принадлежности, база правил или обучающая выборка"},
			{"step": 3, "title": "Вычисление (OLAP/DM)", "description": "Backend выполняет алгоритм и возвращает пошаговый результат"},
			{"step": 4, "title": "Визуализация", "description": "Frontend строит графики ФП, дерево решений, шаги алгоритма"},
			{"step": 5, "title": "Интерпретация", "description": "ЛПР анализирует результат: уровень угрозы, приоритет инцидента, класс объекта"},
			{"step": 6, "title": "Принятие решения", "description": "На основе вывода ЛПР принимает управленческое решение в области ИБ"},
		},
		"modules": []map[string]interface{}{
			{
				"id":          "fuzzy_sets",
				"name":        "Нечёткие множества",
				"standard":    "Практическая работа №1",
				"tasks":       4,
				"description": "Реализация операций над нечёткими множествами и построение нечётких отношений",
			},
			{
				"id":          "fuzzy_inference",
				"name":        "Нечёткий логический вывод",
				"standard":    "Практическая работа №2",
				"tasks":       4,
				"description": "Алгоритмы Мамдани, Ларсена, Такаги-Сугено для нечёткого вывода",
			},
			{
				"id":          "decision_tree",
				"name":        "Деревья решений",
				"standard":    "Презентация «Деревья решений»",
				"tasks":       4,
				"description": "Построение дерева ID3 с вычислением энтропии и информационного прироста",
			},
			{
				"id":          "architecture",
				"name":        "Архитектура СППР",
				"standard":    "Лекция 2",
				"tasks":       0,
				"description": "Логическая архитектура учебной СППР на основе концепции DWH+OLAP+DM+EIS",
			},
		},
	}

	c.JSON(http.StatusOK, arch)
}

// GetHistory returns recent calculation history
func GetHistory(c *gin.Context) {
	records, err := database.GetHistory(50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"history": records})
}
