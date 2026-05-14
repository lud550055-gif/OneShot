package data


// ─── Fuzzy Sets Tasks (ИБ) ────────────────────────────────────────────────────

var FuzzySetsTasks = []map[string]interface{}{
	{
		"id":          "fs-threat-level",
		"name":        "Уровень сетевой угрозы",
		"description": "Классификация сетевой атаки по интенсивности трафика (пакетов/сек). Нечёткие термы: малый, средний, высокий.",
		"domain":      "Информационная безопасность — обнаружение атак",
		"sets": []map[string]interface{}{
			{
				"name": "Малый трафик",
				"mf": map[string]interface{}{
					"type":   "z",
					"params": []float64{50, 200},
					"name":   "Малый",
				},
				"domain": []float64{0, 1000},
			},
			{
				"name": "Средний трафик",
				"mf": map[string]interface{}{
					"type":   "triangular",
					"params": []float64{100, 400, 700},
					"name":   "Средний",
				},
				"domain": []float64{0, 1000},
			},
			{
				"name": "Высокий трафик (угроза)",
				"mf": map[string]interface{}{
					"type":   "s",
					"params": []float64{500, 900},
					"name":   "Высокий",
				},
				"domain": []float64{0, 1000},
			},
		},
		"xLabel": "Интенсивность трафика (пакетов/сек)",
		"xMin":   0.0,
		"xMax":   1000.0,
		"xPoint": 600.0,
		"operations": []map[string]interface{}{
			{"op": "not", "label": "НЕ (Высокий трафик) = Нормальный трафик"},
			{"op": "and_min", "label": "И-min(Средний, Высокий) = Пограничная зона"},
			{"op": "or_max", "label": "ИЛИ-max(Малый, Средний) = Допустимый трафик"},
		},
	},
	{
		"id":          "fs-vuln-severity",
		"name":        "Критичность уязвимости (Fuzzy CVSS)",
		"description": "Оценка критичности уязвимости по CVSS-подобной шкале [0..10]. Термы: низкая, средняя, высокая, критическая.",
		"domain":      "Информационная безопасность — управление уязвимостями",
		"sets": []map[string]interface{}{
			{
				"name": "Низкая критичность",
				"mf":   map[string]interface{}{"type": "trapezoidal", "params": []float64{0, 0, 2, 4}, "name": "Низкая"},
				"domain": []float64{0, 10},
			},
			{
				"name": "Средняя критичность",
				"mf":   map[string]interface{}{"type": "triangular", "params": []float64{3, 5, 7}, "name": "Средняя"},
				"domain": []float64{0, 10},
			},
			{
				"name": "Высокая критичность",
				"mf":   map[string]interface{}{"type": "triangular", "params": []float64{6, 7.5, 9}, "name": "Высокая"},
				"domain": []float64{0, 10},
			},
			{
				"name": "Критическая",
				"mf":   map[string]interface{}{"type": "trapezoidal", "params": []float64{8.5, 9.5, 10, 10}, "name": "Критическая"},
				"domain": []float64{0, 10},
			},
		},
		"xLabel": "Оценка CVSS",
		"xMin":   0.0,
		"xMax":   10.0,
		"xPoint": 7.2,
		"operations": []map[string]interface{}{
			{"op": "not", "label": "НЕ (Критическая) = Допустимая"},
			{"op": "and_min", "label": "И-min(Высокая, Критическая) = Очень критическая"},
			{"op": "or_max", "label": "ИЛИ-max(Низкая, Средняя) = Управляемая"},
		},
	},
	{
		"id":          "fs-password-strength",
		"name":        "Надёжность пароля",
		"description": "Оценка надёжности пароля по его длине (символов). Применяется концентрация (CON) для «очень надёжный» и растяжение (DIL) для «довольно надёжный».",
		"domain":      "Информационная безопасность — аутентификация",
		"sets": []map[string]interface{}{
			{
				"name": "Слабый пароль",
				"mf":   map[string]interface{}{"type": "z", "params": []float64{4, 8}, "name": "Слабый"},
				"domain": []float64{0, 32},
			},
			{
				"name": "Приемлемый пароль",
				"mf":   map[string]interface{}{"type": "triangular", "params": []float64{6, 12, 18}, "name": "Приемлемый"},
				"domain": []float64{0, 32},
			},
			{
				"name": "Надёжный пароль",
				"mf":   map[string]interface{}{"type": "s", "params": []float64{16, 28}, "name": "Надёжный"},
				"domain": []float64{0, 32},
			},
		},
		"xLabel": "Длина пароля (символов)",
		"xMin":   0.0,
		"xMax":   32.0,
		"xPoint": 14.0,
		"operations": []map[string]interface{}{
			{"op": "con", "label": "CON(Надёжный) = «Очень надёжный»"},
			{"op": "dil", "label": "DIL(Надёжный) = «Довольно надёжный»"},
			{"op": "not", "label": "НЕ(Слабый) = Нормальный"},
		},
	},
	{
		"id":          "fs-compromise",
		"name":        "Степень компрометации системы",
		"description": "Оценка компрометации системы по количеству аномальных событий. Два отношения: признаки→тип атаки, тип атаки→ущерб. Вычисляется max-min композиция.",
		"domain":      "Информационная безопасность — реагирование на инциденты",
		"r1": [][]float64{
			{0.9, 0.1, 0.3, 0.2},
			{0.7, 0.8, 0.5, 0.9},
			{0.3, 0.9, 0.8, 0.6},
		},
		"r2": [][]float64{
			{0.8, 0.2},
			{0.3, 0.9},
			{0.5, 0.7},
			{0.2, 1.0},
		},
		"r1Labels": []string{"Много аномалий", "Подозр. порты", "Утечка данных"},
		"r1Cols":   []string{"Разведка", "Латеральное движение", "Эскалация привилегий", "Утечка"},
		"r2Cols":   []string{"Минимальный ущерб", "Критический ущерб"},
		"xLabel":   "Событий/час",
		"xMin":     0.0,
		"xMax":     100.0,
	},
}

// ─── Fuzzy Inference Tasks (ИБ) ───────────────────────────────────────────────

var InferenceTasks = []map[string]interface{}{
	{
		"id":          "inf-ids",
		"name":        "Система обнаружения вторжений (IDS)",
		"description": "Мамдани: ЕСЛИ (частота_пакетов = высокая) И (entropy_заголовков = низкая) ТО (уровень_угрозы = критический). Входы: частота пакетов [0..1000 пак/с], энтропия заголовков [0..8 бит].",
		"domain":      "Информационная безопасность — мониторинг сети",
		"algorithm":   "mamdani",
		"config": map[string]interface{}{
			"inputVars": map[string]interface{}{
				"packet_rate": map[string]interface{}{
					"name":   "Частота пакетов (пак/с)",
					"domain": []float64{0, 1000},
					"terms": []map[string]interface{}{
						{"name": "низкая", "mf": map[string]interface{}{"type": "z", "params": []float64{100, 350}, "name": "низкая"}},
						{"name": "средняя", "mf": map[string]interface{}{"type": "triangular", "params": []float64{200, 500, 800}, "name": "средняя"}},
						{"name": "высокая", "mf": map[string]interface{}{"type": "s", "params": []float64{600, 900}, "name": "высокая"}},
					},
				},
				"header_entropy": map[string]interface{}{
					"name":   "Энтропия заголовков (бит)",
					"domain": []float64{0, 8},
					"terms": []map[string]interface{}{
						{"name": "низкая", "mf": map[string]interface{}{"type": "z", "params": []float64{1, 3}, "name": "низкая"}},
						{"name": "средняя", "mf": map[string]interface{}{"type": "triangular", "params": []float64{2, 4, 6}, "name": "средняя"}},
						{"name": "высокая", "mf": map[string]interface{}{"type": "s", "params": []float64{5, 7.5}, "name": "высокая"}},
					},
				},
			},
			"outputVar": map[string]interface{}{
				"name":   "Уровень угрозы",
				"domain": []float64{0, 100},
				"terms": []map[string]interface{}{
					{"name": "низкий", "mf": map[string]interface{}{"type": "trapezoidal", "params": []float64{0, 0, 15, 35}, "name": "низкий"}},
					{"name": "средний", "mf": map[string]interface{}{"type": "triangular", "params": []float64{25, 50, 75}, "name": "средний"}},
					{"name": "высокий", "mf": map[string]interface{}{"type": "triangular", "params": []float64{65, 80, 92}, "name": "высокий"}},
					{"name": "критический", "mf": map[string]interface{}{"type": "trapezoidal", "params": []float64{85, 95, 100, 100}, "name": "критический"}},
				},
			},
			"rules": []map[string]interface{}{
				{"antecedents": []map[string]string{{"variable": "packet_rate", "term": "низкая"}, {"variable": "header_entropy", "term": "высокая"}}, "connector": "and", "consequent": map[string]string{"variable": "threat_level", "term": "низкий"}},
				{"antecedents": []map[string]string{{"variable": "packet_rate", "term": "средняя"}}, "connector": "and", "consequent": map[string]string{"variable": "threat_level", "term": "средний"}},
				{"antecedents": []map[string]string{{"variable": "packet_rate", "term": "высокая"}, {"variable": "header_entropy", "term": "низкая"}}, "connector": "and", "consequent": map[string]string{"variable": "threat_level", "term": "критический"}},
				{"antecedents": []map[string]string{{"variable": "packet_rate", "term": "высокая"}, {"variable": "header_entropy", "term": "средняя"}}, "connector": "and", "consequent": map[string]string{"variable": "threat_level", "term": "высокий"}},
			},
			"defaultInputs": map[string]float64{"packet_rate": 750, "header_entropy": 1.5},
		},
	},
	{
		"id":          "inf-access-risk",
		"name":        "Оценка риска несанкционированного доступа",
		"description": "Ларсен: ЕСЛИ (уровень_доступа = привилегированный) И (чувствительность = высокая) ТО (риск = критический). Входы: уровень доступа [0..10], чувствительность ресурса [0..10].",
		"domain":      "Информационная безопасность — управление доступом",
		"algorithm":   "larsen",
		"config": map[string]interface{}{
			"inputVars": map[string]interface{}{
				"access_level": map[string]interface{}{
					"name":   "Уровень доступа пользователя",
					"domain": []float64{0, 10},
					"terms": []map[string]interface{}{
						{"name": "гостевой", "mf": map[string]interface{}{"type": "z", "params": []float64{1, 3}, "name": "гостевой"}},
						{"name": "обычный", "mf": map[string]interface{}{"type": "triangular", "params": []float64{2, 5, 8}, "name": "обычный"}},
						{"name": "привилегированный", "mf": map[string]interface{}{"type": "s", "params": []float64{7, 10}, "name": "привилегированный"}},
					},
				},
				"sensitivity": map[string]interface{}{
					"name":   "Чувствительность ресурса",
					"domain": []float64{0, 10},
					"terms": []map[string]interface{}{
						{"name": "публичный", "mf": map[string]interface{}{"type": "z", "params": []float64{1, 4}, "name": "публичный"}},
						{"name": "внутренний", "mf": map[string]interface{}{"type": "triangular", "params": []float64{3, 5, 7}, "name": "внутренний"}},
						{"name": "конфиденциальный", "mf": map[string]interface{}{"type": "triangular", "params": []float64{6, 8, 10}, "name": "конфиденциальный"}},
						{"name": "секретный", "mf": map[string]interface{}{"type": "s", "params": []float64{8.5, 10}, "name": "секретный"}},
					},
				},
			},
			"outputVar": map[string]interface{}{
				"name":   "Риск доступа (%)",
				"domain": []float64{0, 100},
				"terms": []map[string]interface{}{
					{"name": "минимальный", "mf": map[string]interface{}{"type": "trapezoidal", "params": []float64{0, 0, 15, 30}, "name": "минимальный"}},
					{"name": "умеренный", "mf": map[string]interface{}{"type": "triangular", "params": []float64{20, 40, 60}, "name": "умеренный"}},
					{"name": "высокий", "mf": map[string]interface{}{"type": "triangular", "params": []float64{55, 70, 85}, "name": "высокий"}},
					{"name": "критический", "mf": map[string]interface{}{"type": "trapezoidal", "params": []float64{80, 92, 100, 100}, "name": "критический"}},
				},
			},
			"rules": []map[string]interface{}{
				{"antecedents": []map[string]string{{"variable": "access_level", "term": "гостевой"}, {"variable": "sensitivity", "term": "публичный"}}, "connector": "and", "consequent": map[string]string{"variable": "risk", "term": "минимальный"}},
				{"antecedents": []map[string]string{{"variable": "access_level", "term": "обычный"}, {"variable": "sensitivity", "term": "внутренний"}}, "connector": "and", "consequent": map[string]string{"variable": "risk", "term": "умеренный"}},
				{"antecedents": []map[string]string{{"variable": "access_level", "term": "привилегированный"}, {"variable": "sensitivity", "term": "конфиденциальный"}}, "connector": "and", "consequent": map[string]string{"variable": "risk", "term": "высокий"}},
				{"antecedents": []map[string]string{{"variable": "access_level", "term": "привилегированный"}, {"variable": "sensitivity", "term": "секретный"}}, "connector": "and", "consequent": map[string]string{"variable": "risk", "term": "критический"}},
				{"antecedents": []map[string]string{{"variable": "access_level", "term": "гостевой"}, {"variable": "sensitivity", "term": "конфиденциальный"}}, "connector": "and", "consequent": map[string]string{"variable": "risk", "term": "умеренный"}},
			},
			"defaultInputs": map[string]float64{"access_level": 8.5, "sensitivity": 9.0},
		},
	},
	{
		"id":          "inf-incident",
		"name":        "Классификация инцидента ИБ",
		"description": "Сугено: оценка приоритета реагирования по масштабу инцидента и скорости распространения. Выход — приоритет [0..10] как взвешенное среднее линейных функций.",
		"domain":      "Информационная безопасность — управление инцидентами",
		"algorithm":   "sugeno",
		"config": map[string]interface{}{
			"inputVars": map[string]interface{}{
				"scope": map[string]interface{}{
					"name":   "Масштаб инцидента (хостов)",
					"domain": []float64{0, 100},
					"terms": []map[string]interface{}{
						{"name": "локальный", "mf": map[string]interface{}{"type": "z", "params": []float64{5, 20}, "name": "локальный"}},
						{"name": "сетевой", "mf": map[string]interface{}{"type": "triangular", "params": []float64{10, 40, 70}, "name": "сетевой"}},
						{"name": "массовый", "mf": map[string]interface{}{"type": "s", "params": []float64{55, 90}, "name": "массовый"}},
					},
				},
				"spread_rate": map[string]interface{}{
					"name":   "Скорость распространения (хостов/мин)",
					"domain": []float64{0, 50},
					"terms": []map[string]interface{}{
						{"name": "медленная", "mf": map[string]interface{}{"type": "z", "params": []float64{2, 10}, "name": "медленная"}},
						{"name": "средняя", "mf": map[string]interface{}{"type": "triangular", "params": []float64{5, 20, 35}, "name": "средняя"}},
						{"name": "быстрая", "mf": map[string]interface{}{"type": "s", "params": []float64{25, 45}, "name": "быстрая"}},
					},
				},
			},
			"outputVar": map[string]interface{}{
				"name":   "Приоритет реагирования",
				"domain": []float64{0, 10},
				"terms": []map[string]interface{}{
					{"name": "P4-низкий", "mf": map[string]interface{}{"type": "triangular", "params": []float64{0, 2, 4}, "name": "P4-низкий"}},
					{"name": "P3-средний", "mf": map[string]interface{}{"type": "triangular", "params": []float64{3, 5, 7}, "name": "P3-средний"}},
					{"name": "P2-высокий", "mf": map[string]interface{}{"type": "triangular", "params": []float64{6, 7.5, 9}, "name": "P2-высокий"}},
					{"name": "P1-критический", "mf": map[string]interface{}{"type": "trapezoidal", "params": []float64{8, 9.5, 10, 10}, "name": "P1-критический"}},
				},
			},
			"rules": []map[string]interface{}{
				{"antecedents": []map[string]string{{"variable": "scope", "term": "локальный"}, {"variable": "spread_rate", "term": "медленная"}}, "connector": "and", "consequent": map[string]string{"variable": "priority", "term": "P4-низкий"}},
				{"antecedents": []map[string]string{{"variable": "scope", "term": "сетевой"}, {"variable": "spread_rate", "term": "средняя"}}, "connector": "and", "consequent": map[string]string{"variable": "priority", "term": "P3-средний"}},
				{"antecedents": []map[string]string{{"variable": "scope", "term": "массовый"}, {"variable": "spread_rate", "term": "средняя"}}, "connector": "and", "consequent": map[string]string{"variable": "priority", "term": "P2-высокий"}},
				{"antecedents": []map[string]string{{"variable": "scope", "term": "массовый"}, {"variable": "spread_rate", "term": "быстрая"}}, "connector": "and", "consequent": map[string]string{"variable": "priority", "term": "P1-критический"}},
				{"antecedents": []map[string]string{{"variable": "scope", "term": "локальный"}, {"variable": "spread_rate", "term": "быстрая"}}, "connector": "and", "consequent": map[string]string{"variable": "priority", "term": "P3-средний"}},
			},
			"sugenoCoeffs": [][]float64{
				{1.0, 0.02, 0.05},
				{3.0, 0.03, 0.08},
				{6.0, 0.04, 0.10},
				{8.5, 0.05, 0.15},
				{4.5, 0.03, 0.12},
			},
			"defaultInputs": map[string]float64{"scope": 60, "spread_rate": 30},
		},
	},
	{
		"id":          "inf-firewall",
		"name":        "Управление брандмауэром",
		"description": "Мамдани: автоматическое управление брандмауэром. Входы: объём трафика [0..1000 Мбит/с] и частота ошибок TCP [0..100%]. Выход: корректирующее действие [-50..50].",
		"domain":      "Информационная безопасность — защита сети",
		"algorithm":   "mamdani",
		"config": map[string]interface{}{
			"inputVars": map[string]interface{}{
				"traffic_volume": map[string]interface{}{
					"name":   "Объём трафика (Мбит/с)",
					"domain": []float64{0, 1000},
					"terms": []map[string]interface{}{
						{"name": "низкий", "mf": map[string]interface{}{"type": "z", "params": []float64{100, 300}, "name": "низкий"}},
						{"name": "нормальный", "mf": map[string]interface{}{"type": "triangular", "params": []float64{200, 500, 800}, "name": "нормальный"}},
						{"name": "высокий", "mf": map[string]interface{}{"type": "s", "params": []float64{600, 900}, "name": "высокий"}},
					},
				},
				"error_rate": map[string]interface{}{
					"name":   "Частота ошибок TCP (%)",
					"domain": []float64{0, 100},
					"terms": []map[string]interface{}{
						{"name": "малая", "mf": map[string]interface{}{"type": "z", "params": []float64{5, 20}, "name": "малая"}},
						{"name": "умеренная", "mf": map[string]interface{}{"type": "triangular", "params": []float64{10, 35, 60}, "name": "умеренная"}},
						{"name": "большая", "mf": map[string]interface{}{"type": "s", "params": []float64{45, 80}, "name": "большая"}},
					},
				},
			},
			"outputVar": map[string]interface{}{
				"name":   "Действие брандмауэра",
				"domain": []float64{-50, 50},
				"terms": []map[string]interface{}{
					{"name": "заблокировать", "mf": map[string]interface{}{"type": "trapezoidal", "params": []float64{-50, -50, -30, -10}, "name": "заблокировать"}},
					{"name": "ограничить", "mf": map[string]interface{}{"type": "triangular", "params": []float64{-25, -5, 15}, "name": "ограничить"}},
					{"name": "мониторинг", "mf": map[string]interface{}{"type": "triangular", "params": []float64{-5, 0, 10}, "name": "мониторинг"}},
					{"name": "пропустить", "mf": map[string]interface{}{"type": "trapezoidal", "params": []float64{10, 30, 50, 50}, "name": "пропустить"}},
				},
			},
			"rules": []map[string]interface{}{
				{"antecedents": []map[string]string{{"variable": "traffic_volume", "term": "низкий"}, {"variable": "error_rate", "term": "малая"}}, "connector": "and", "consequent": map[string]string{"variable": "action", "term": "пропустить"}},
				{"antecedents": []map[string]string{{"variable": "traffic_volume", "term": "нормальный"}, {"variable": "error_rate", "term": "малая"}}, "connector": "and", "consequent": map[string]string{"variable": "action", "term": "пропустить"}},
				{"antecedents": []map[string]string{{"variable": "traffic_volume", "term": "нормальный"}, {"variable": "error_rate", "term": "умеренная"}}, "connector": "and", "consequent": map[string]string{"variable": "action", "term": "мониторинг"}},
				{"antecedents": []map[string]string{{"variable": "traffic_volume", "term": "высокий"}, {"variable": "error_rate", "term": "умеренная"}}, "connector": "and", "consequent": map[string]string{"variable": "action", "term": "ограничить"}},
				{"antecedents": []map[string]string{{"variable": "traffic_volume", "term": "высокий"}, {"variable": "error_rate", "term": "большая"}}, "connector": "and", "consequent": map[string]string{"variable": "action", "term": "заблокировать"}},
				{"antecedents": []map[string]string{{"variable": "traffic_volume", "term": "низкий"}, {"variable": "error_rate", "term": "большая"}}, "connector": "and", "consequent": map[string]string{"variable": "action", "term": "ограничить"}},
			},
			"defaultInputs": map[string]float64{"traffic_volume": 800, "error_rate": 65},
		},
	},
}

// ─── Decision Tree Tasks (ИБ) ─────────────────────────────────────────────────

var DecisionTreeTasks = []map[string]interface{}{
	{
		"id":          "dt-malware",
		"name":        "Классификация вредоносного ПО",
		"description": "ID3-дерево классифицирует ПО как benign/malware на основе статических признаков: количество API-вызовов, энтропия секций PE, наличие упаковщика, инъекция процессов.",
		"domain":      "Информационная безопасность — анализ вредоносного ПО",
		"features":    []string{"api_calls", "section_entropy", "has_packer", "process_injection"},
		"classLabels": map[string]string{
			"malware": "Вредоносное ПО",
			"benign":  "Безопасное ПО",
		},
		"data": []map[string]interface{}{
			{"features": map[string]string{"api_calls": "высокое", "section_entropy": "высокая", "has_packer": "да", "process_injection": "да"}, "class": "malware"},
			{"features": map[string]string{"api_calls": "низкое", "section_entropy": "низкая", "has_packer": "нет", "process_injection": "нет"}, "class": "benign"},
			{"features": map[string]string{"api_calls": "среднее", "section_entropy": "высокая", "has_packer": "да", "process_injection": "нет"}, "class": "malware"},
			{"features": map[string]string{"api_calls": "высокое", "section_entropy": "низкая", "has_packer": "нет", "process_injection": "да"}, "class": "malware"},
			{"features": map[string]string{"api_calls": "низкое", "section_entropy": "средняя", "has_packer": "нет", "process_injection": "нет"}, "class": "benign"},
			{"features": map[string]string{"api_calls": "среднее", "section_entropy": "низкая", "has_packer": "нет", "process_injection": "нет"}, "class": "benign"},
			{"features": map[string]string{"api_calls": "высокое", "section_entropy": "высокая", "has_packer": "да", "process_injection": "да"}, "class": "malware"},
			{"features": map[string]string{"api_calls": "низкое", "section_entropy": "низкая", "has_packer": "нет", "process_injection": "нет"}, "class": "benign"},
			{"features": map[string]string{"api_calls": "среднее", "section_entropy": "средняя", "has_packer": "да", "process_injection": "нет"}, "class": "malware"},
			{"features": map[string]string{"api_calls": "высокое", "section_entropy": "средняя", "has_packer": "нет", "process_injection": "нет"}, "class": "benign"},
		},
		"testSamples": []map[string]interface{}{
			{"features": map[string]string{"api_calls": "высокое", "section_entropy": "высокая", "has_packer": "да", "process_injection": "нет"}, "expected": "malware"},
			{"features": map[string]string{"api_calls": "низкое", "section_entropy": "высокая", "has_packer": "нет", "process_injection": "нет"}, "expected": "benign"},
		},
	},
	{
		"id":          "dt-phishing",
		"name":        "Обнаружение фишинговых URL",
		"description": "ID3-дерево классифицирует URL как phishing/legit по признакам: длина URL, наличие IP вместо домена, возраст домена, количество перенаправлений.",
		"domain":      "Информационная безопасность — обнаружение фишинга",
		"features":    []string{"url_length", "has_ip", "domain_age", "redirects"},
		"classLabels": map[string]string{
			"phishing": "Фишинговый URL",
			"legit":    "Легитимный URL",
		},
		"data": []map[string]interface{}{
			{"features": map[string]string{"url_length": "длинный", "has_ip": "да", "domain_age": "новый", "redirects": "много"}, "class": "phishing"},
			{"features": map[string]string{"url_length": "короткий", "has_ip": "нет", "domain_age": "старый", "redirects": "нет"}, "class": "legit"},
			{"features": map[string]string{"url_length": "длинный", "has_ip": "нет", "domain_age": "новый", "redirects": "несколько"}, "class": "phishing"},
			{"features": map[string]string{"url_length": "средний", "has_ip": "нет", "domain_age": "средний", "redirects": "нет"}, "class": "legit"},
			{"features": map[string]string{"url_length": "короткий", "has_ip": "да", "domain_age": "новый", "redirects": "много"}, "class": "phishing"},
			{"features": map[string]string{"url_length": "средний", "has_ip": "нет", "domain_age": "старый", "redirects": "нет"}, "class": "legit"},
			{"features": map[string]string{"url_length": "длинный", "has_ip": "да", "domain_age": "новый", "redirects": "много"}, "class": "phishing"},
			{"features": map[string]string{"url_length": "средний", "has_ip": "нет", "domain_age": "старый", "redirects": "нет"}, "class": "legit"},
			{"features": map[string]string{"url_length": "короткий", "has_ip": "нет", "domain_age": "новый", "redirects": "несколько"}, "class": "phishing"},
			{"features": map[string]string{"url_length": "длинный", "has_ip": "нет", "domain_age": "старый", "redirects": "нет"}, "class": "legit"},
		},
		"testSamples": []map[string]interface{}{
			{"features": map[string]string{"url_length": "длинный", "has_ip": "да", "domain_age": "новый", "redirects": "несколько"}, "expected": "phishing"},
			{"features": map[string]string{"url_length": "короткий", "has_ip": "нет", "domain_age": "средний", "redirects": "нет"}, "expected": "legit"},
		},
	},
	{
		"id":          "dt-anomaly",
		"name":        "Классификация сетевых аномалий",
		"description": "ID3-дерево классифицирует сетевой трафик как: normal / anomaly / ddos по признакам: объём пакетов, TCP-ошибки, разнообразие портов, интервал между пакетами.",
		"domain":      "Информационная безопасность — обнаружение аномалий в сети",
		"features":    []string{"packet_volume", "tcp_errors", "port_diversity", "packet_interval"},
		"classLabels": map[string]string{
			"normal":  "Нормальный трафик",
			"anomaly": "Аномальный трафик",
			"ddos":    "DDoS-атака",
		},
		"data": []map[string]interface{}{
			{"features": map[string]string{"packet_volume": "высокий", "tcp_errors": "много", "port_diversity": "высокое", "packet_interval": "короткий"}, "class": "ddos"},
			{"features": map[string]string{"packet_volume": "низкий", "tcp_errors": "мало", "port_diversity": "низкое", "packet_interval": "длинный"}, "class": "normal"},
			{"features": map[string]string{"packet_volume": "средний", "tcp_errors": "много", "port_diversity": "среднее", "packet_interval": "средний"}, "class": "anomaly"},
			{"features": map[string]string{"packet_volume": "высокий", "tcp_errors": "мало", "port_diversity": "высокое", "packet_interval": "короткий"}, "class": "ddos"},
			{"features": map[string]string{"packet_volume": "низкий", "tcp_errors": "мало", "port_diversity": "низкое", "packet_interval": "длинный"}, "class": "normal"},
			{"features": map[string]string{"packet_volume": "средний", "tcp_errors": "мало", "port_diversity": "среднее", "packet_interval": "средний"}, "class": "normal"},
			{"features": map[string]string{"packet_volume": "высокий", "tcp_errors": "много", "port_diversity": "высокое", "packet_interval": "короткий"}, "class": "ddos"},
			{"features": map[string]string{"packet_volume": "низкий", "tcp_errors": "много", "port_diversity": "низкое", "packet_interval": "длинный"}, "class": "anomaly"},
			{"features": map[string]string{"packet_volume": "средний", "tcp_errors": "много", "port_diversity": "высокое", "packet_interval": "короткий"}, "class": "anomaly"},
			{"features": map[string]string{"packet_volume": "низкий", "tcp_errors": "мало", "port_diversity": "высокое", "packet_interval": "длинный"}, "class": "normal"},
		},
		"testSamples": []map[string]interface{}{
			{"features": map[string]string{"packet_volume": "высокий", "tcp_errors": "много", "port_diversity": "высокое", "packet_interval": "короткий"}, "expected": "ddos"},
			{"features": map[string]string{"packet_volume": "низкий", "tcp_errors": "мало", "port_diversity": "низкое", "packet_interval": "длинный"}, "expected": "normal"},
		},
	},
	{
		"id":          "dt-incident-priority",
		"name":        "Приоритизация инцидентов ИБ",
		"description": "ID3-дерево определяет приоритет инцидента (P1-critical/P2-high/P3-medium/P4-low) по типу источника, виду атаки, чувствительности затронутых активов и времени суток.",
		"domain":      "Информационная безопасность — управление инцидентами (SIEM)",
		"features":    []string{"source_type", "attack_type", "asset_sensitivity", "time_of_day"},
		"classLabels": map[string]string{
			"P1-critical": "P1 — Критический",
			"P2-high":     "P2 — Высокий",
			"P3-medium":   "P3 — Средний",
			"P4-low":      "P4 — Низкий",
		},
		"data": []map[string]interface{}{
			{"features": map[string]string{"source_type": "внешний", "attack_type": "целевая", "asset_sensitivity": "критическая", "time_of_day": "ночь"}, "class": "P1-critical"},
			{"features": map[string]string{"source_type": "внутренний", "attack_type": "случайная", "asset_sensitivity": "низкая", "time_of_day": "день"}, "class": "P4-low"},
			{"features": map[string]string{"source_type": "внешний", "attack_type": "автоматизированная", "asset_sensitivity": "средняя", "time_of_day": "день"}, "class": "P3-medium"},
			{"features": map[string]string{"source_type": "внутренний", "attack_type": "целевая", "asset_sensitivity": "критическая", "time_of_day": "ночь"}, "class": "P2-high"},
			{"features": map[string]string{"source_type": "внешний", "attack_type": "целевая", "asset_sensitivity": "высокая", "time_of_day": "день"}, "class": "P2-high"},
			{"features": map[string]string{"source_type": "внутренний", "attack_type": "случайная", "asset_sensitivity": "средняя", "time_of_day": "день"}, "class": "P4-low"},
			{"features": map[string]string{"source_type": "внешний", "attack_type": "автоматизированная", "asset_sensitivity": "критическая", "time_of_day": "ночь"}, "class": "P1-critical"},
			{"features": map[string]string{"source_type": "внутренний", "attack_type": "автоматизированная", "asset_sensitivity": "высокая", "time_of_day": "день"}, "class": "P3-medium"},
			{"features": map[string]string{"source_type": "внешний", "attack_type": "случайная", "asset_sensitivity": "низкая", "time_of_day": "ночь"}, "class": "P4-low"},
			{"features": map[string]string{"source_type": "внешний", "attack_type": "целевая", "asset_sensitivity": "критическая", "time_of_day": "день"}, "class": "P1-critical"},
		},
		"testSamples": []map[string]interface{}{
			{"features": map[string]string{"source_type": "внешний", "attack_type": "целевая", "asset_sensitivity": "критическая", "time_of_day": "ночь"}, "expected": "P1-critical"},
			{"features": map[string]string{"source_type": "внутренний", "attack_type": "случайная", "asset_sensitivity": "низкая", "time_of_day": "день"}, "expected": "P4-low"},
		},
	},
}
