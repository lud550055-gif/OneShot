# СППР — Интеллектуальные методы информационной безопасности

Учебная система поддержки принятия решений (СППР) в области информационной безопасности. Реализует нечёткие множества, нечёткий логический вывод и деревья решений в интерактивном веб-интерфейсе.

---

## Содержание

- [Что реализовано](#что-реализовано)
- [Архитектура](#архитектура)
- [Быстрый старт](#быстрый-старт)
- [Запуск на Windows](#запуск-на-windows)
- [Запуск на Ubuntu / Linux](#запуск-на-ubuntu--linux)
- [Разработка без Docker](#разработка-без-docker)
- [Структура проекта](#структура-проекта)
- [API](#api)
- [База данных](#база-данных)
- [Устранение проблем](#устранение-проблем)

---

## Что реализовано

### Практическая работа №1 — Нечёткие множества

| Функционал | Описание |
|---|---|
| Функции принадлежности | Треугольная, трапециевидная, гауссова, Z-функция, S-функция |
| T-нормы (операция И) | T-min (Заде), T-prod (алгебраическое), T-bounded, T-drastic |
| S-нормы (операция ИЛИ) | S-max (Заде), S-sum (алгебраическое), S-bounded, S-drastic |
| Дополнение (НЕ) | По Заде и по Сугено (λ=1) |
| Лингвистические модификаторы | CON(A) — «очень», DIL(A) — «довольно» |
| Состав нечётких отношений | Max-min и max-prod композиция матриц |
| Задачи ИБ | Уровень угрозы, критичность уязвимости, риск доступа, аномалии сети |

### Практическая работа №2 — Нечёткий логический вывод

| Алгоритм | Активация | Особенности |
|---|---|---|
| Мамдани | min | COG / MOM / SOM / LOM дефаззификация |
| Ларсен | prod | COG / MOM / SOM / LOM дефаззификация |
| Такаги-Сугено | prod | Линейный выход, взвешенное среднее |

Задачи ИБ: обнаружение вторжений (IDS), оценка риска доступа, классификация инцидентов.

### Лекция — Деревья решений

- Алгоритм ID3: энтропия Шеннона, информационный прирост (Gain), индекс Джини
- Интерактивная SVG-визуализация дерева
- Извлечение правил IF-THEN из построенного дерева
- Классификация нового объекта с отображением пути решения
- Задачи ИБ: обнаружение малвари, фишинга, DDoS-атак

### Лекция 2 — Архитектура СППР

Интерактивная визуализация четырёхуровневой архитектуры: **DWH → OLAP → Data Mining → EIS**.

---

## Архитектура

```
Браузер
   │
   ▼
Nginx (порт 80) ─── /api/* ──► Go/Gin Backend (порт 8080) ─── PostgreSQL (порт 5432)
   │                                    │
   └──── / ──────► React Frontend (порт 3000)
```

| Слой | Технологии | Роль |
|---|---|---|
| EIS | React 18, TypeScript, Vite, Recharts | Интерфейс пользователя |
| OLAP | Go 1.22, Gin | REST API, алгоритмы |
| DWH | PostgreSQL 16 | История вычислений |
| Инфраструктура | Docker Compose, Nginx | Оркестрация и проксирование |

---

## Быстрый старт

```bash
git clone <url-репозитория>
cd <папка-проекта>
docker compose up --build
```

Открыть в браузере: **http://localhost**

Первый запуск занимает 3–5 минут (скачиваются образы, компилируется Go, собирается React).

---

## Запуск на Windows

### 1. Установить Docker Desktop

Скачать и установить: https://www.docker.com/products/docker-desktop/

После установки убедиться, что Docker Desktop запущен (иконка в трее).

### 2. Клонировать и запустить

Открыть PowerShell или CMD:

```powershell
git clone <url-репозитория>
cd <папка-проекта>
docker compose up --build
```

### 3. Открыть приложение

Перейти по адресу: http://localhost

### Остановка

```powershell
# Остановить контейнеры
docker compose down

# Остановить и удалить данные БД (чистый старт)
docker compose down -v
```

### Обновление

```powershell
git pull
docker compose up --build
```

---

## Запуск на Ubuntu / Linux

### 1. Установить Docker и Docker Compose

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin

# Добавить текущего пользователя в группу docker (чтобы не писать sudo)
sudo usermod -aG docker $USER

# Применить изменения группы (или перелогиниться)
newgrp docker
```

### 2. Клонировать и запустить

```bash
git clone <url-репозитория>
cd <папка-проекта>
docker compose up --build
```

### 3. Открыть приложение

Перейти по адресу: http://localhost

### Остановка

```bash
# Остановить контейнеры
docker compose down

# Остановить и удалить данные БД
docker compose down -v
```

### Обновление

```bash
git pull
docker compose up --build
```

---

## Разработка без Docker

Если нужно запустить фронтенд или бэкенд отдельно для разработки.

### Требования

| Инструмент | Версия |
|---|---|
| Node.js | 18+ |
| Go | 1.22+ |
| PostgreSQL | 16 (или через Docker: `docker compose up postgres`) |

### Бэкенд

```bash
cd backend

# Задать переменные окружения
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=dsss
export DB_USER=dsss
export DB_PASSWORD=dsss_secret

# Запустить
go run main.go
# Бэкенд доступен на http://localhost:8080
```

На Windows (PowerShell):

```powershell
cd backend
$env:DB_HOST="localhost"; $env:DB_PORT="5432"; $env:DB_NAME="dsss"
$env:DB_USER="dsss"; $env:DB_PASSWORD="dsss_secret"
go run main.go
```

### Фронтенд

```bash
cd frontend
npm install
npm run dev
# Фронтенд доступен на http://localhost:5173
```

Vite автоматически проксирует `/api/*` → `http://localhost:8080` (настройка в `vite.config.ts`).

---

## Структура проекта

```
OneShot/
├── docker-compose.yml          # Оркестрация 4 сервисов
├── .gitignore
│
├── nginx/
│   └── nginx.conf              # Reverse proxy: / → frontend, /api → backend
│
├── database/
│   └── init.sql                # Схема БД (таблица calculation_history)
│
├── backend/                    # Go 1.22 + Gin
│   ├── Dockerfile              # Multi-stage: golang:1.22-alpine → alpine:3.19
│   ├── go.mod
│   ├── main.go                 # Точка входа, маршруты
│   ├── models/
│   │   └── models.go           # Типы данных (MF, Rule, InferenceRequest, ...)
│   ├── handlers/
│   │   ├── fuzzy_sets.go       # GET /api/v1/fuzzy-sets/*, POST /membership, /operations, ...
│   │   ├── fuzzy_inference.go  # GET /api/v1/inference/tasks, POST /run
│   │   ├── decision_tree.go    # GET /api/v1/decision-tree/tasks, POST /build, /classify
│   │   └── architecture.go     # GET /api/v1/architecture
│   ├── services/
│   │   ├── fuzzy_sets.go       # Алгоритмы: MF, T/S-нормы, модификаторы, композиция
│   │   ├── fuzzy_inference.go  # Мамдани, Ларсен, Такаги-Сугено, дефаззификация
│   │   └── decision_tree.go    # ID3: энтропия, Gain, Gini, построение дерева
│   ├── data/
│   │   └── tasks.go            # Встроенные задачи ИБ (нечёткие множества, вывод, деревья)
│   └── database/
│       └── db.go               # Подключение к PostgreSQL, сохранение истории
│
└── frontend/                   # React 18 + TypeScript + Vite
    ├── Dockerfile              # Multi-stage: node:20-alpine → nginx:alpine
    ├── nginx.conf              # Раздача статики, try_files для SPA
    ├── vite.config.ts          # Dev-proxy + unicode-escape плагин
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx             # Таб-навигация между модулями
        ├── index.css           # CSS-переменные (тёмная тема)
        ├── api/
        │   └── client.ts       # Axios-клиент, все API-вызовы
        ├── types/
        │   └── index.ts        # TypeScript типы (MFPoint, InferenceTask, ...)
        └── components/
            ├── ui.tsx          # Переиспользуемые компоненты (Section, Btn, Alert, ...)
            ├── FuzzySets/      # Модуль ПР №1
            ├── FuzzyInference/ # Модуль ПР №2
            ├── DecisionTree/   # Модуль «Деревья решений»
            │   └── TreeViz.tsx # SVG-визуализация дерева
            └── Architecture/   # Модуль «Архитектура СППР»
```

---

## API

Базовый путь: `/api/v1`

### Нечёткие множества

| Метод | Путь | Описание |
|---|---|---|
| GET | `/fuzzy-sets/tasks` | Список задач ИБ |
| POST | `/fuzzy-sets/tasks/:id/solve` | Решить задачу целиком |
| POST | `/fuzzy-sets/membership` | Вычислить функцию принадлежности |
| POST | `/fuzzy-sets/operations` | Выполнить операцию (T/S-норма, НЕ, CON, DIL) |
| POST | `/fuzzy-sets/composition` | Max-min или max-prod композиция |
| POST | `/fuzzy-sets/properties` | Свойства нечёткого множества |

### Нечёткий вывод

| Метод | Путь | Описание |
|---|---|---|
| GET | `/inference/tasks` | Список задач ИБ |
| POST | `/inference/tasks/:id/solve` | Решить задачу с параметрами по умолчанию |
| POST | `/inference/run` | Запустить вывод (Мамдани/Ларсен/Сугено) |

Тело запроса `POST /inference/run`:
```json
{
  "algorithm": "mamdani",
  "inputVars": { "packet_rate": { "domain": [0, 1000], "terms": [...] } },
  "outputVar": { "name": "threat_level", "domain": [0, 100], "terms": [...] },
  "rules": [{ "antecedents": [...], "consequent": {...}, "connector": "and" }],
  "inputValues": { "packet_rate": 650 },
  "defuzz": "cog"
}
```

### Деревья решений

| Метод | Путь | Описание |
|---|---|---|
| GET | `/decision-tree/tasks` | Список задач ИБ |
| POST | `/decision-tree/tasks/:id/solve` | Построить дерево для задачи |
| POST | `/decision-tree/build` | Построить дерево по произвольным данным |
| POST | `/decision-tree/classify` | Классифицировать объект |
| POST | `/decision-tree/entropy` | Вычислить энтропию и индекс Джини |

### Прочее

| Метод | Путь | Описание |
|---|---|---|
| GET | `/architecture` | Описание архитектуры СППР |
| GET | `/history` | История вычислений из БД |
| GET | `/health` | Health check (статус: ok) |

---

## База данных

PostgreSQL 16. Схема инициализируется автоматически при первом запуске из `database/init.sql`.

```sql
CREATE TABLE calculation_history (
    id          SERIAL PRIMARY KEY,
    module      VARCHAR(50) NOT NULL,       -- 'fuzzy-sets' | 'inference' | 'decision-tree'
    task_id     VARCHAR(100),
    input_data  JSONB NOT NULL DEFAULT '{}',
    output_data JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Данные хранятся в Docker volume `postgres_data` и сохраняются между перезапусками.

Подключение (для внешних клиентов, например DBeaver):

```
Host:     localhost
Port:     5432
Database: dsss
User:     dsss
Password: dsss_secret
```

---

## Устранение проблем

### Docker Hub возвращает 403 при сборке

Причина: анонимные запросы к Docker Hub ограничены по количеству (rate limit).

Решение 1 — залогиниться в Docker Hub:
```bash
docker login
docker compose up --build
```

Решение 2 — собрать фронтенд локально (нужен Node.js 18+):
```bash
cd frontend
npm install
npm run build
cd ..
docker build -f frontend/Dockerfile.prebuilt frontend/ -t oneshot-frontend:latest
docker compose up
```

### Порт 80 занят

Изменить порт nginx в `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8888:80"   # вместо "80:80"
```

Затем открыть: http://localhost:8888

### Бэкенд не стартует (ждёт БД)

Нормальная ситуация: бэкенд ждёт `postgres` по healthcheck. Если зависает более 30 секунд:
```bash
docker compose logs postgres
docker compose restart backend
```

### Пересобрать только один сервис

```bash
docker compose up --build frontend   # только фронтенд
docker compose up --build backend    # только бэкенд
```

### Посмотреть логи

```bash
docker compose logs -f              # все сервисы
docker compose logs -f backend      # только бэкенд
docker compose logs -f frontend     # только фронтенд
```

### Полный сброс (удалить всё включая данные)

```bash
docker compose down -v --rmi all
docker compose up --build
```

---

## Адреса сервисов

| URL | Сервис |
|---|---|
| http://localhost | Приложение (через nginx) |
| http://localhost:3000 | Фронтенд напрямую |
| http://localhost:8080 | Бэкенд API |
| http://localhost:8080/health | Health check |
| http://localhost:5432 | PostgreSQL |
