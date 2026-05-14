CREATE TABLE IF NOT EXISTS calculation_history (
    id          SERIAL PRIMARY KEY,
    module      VARCHAR(50) NOT NULL,
    task_id     VARCHAR(100),
    input_data  JSONB NOT NULL DEFAULT '{}',
    output_data JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_module ON calculation_history(module);
CREATE INDEX IF NOT EXISTS idx_history_created ON calculation_history(created_at DESC);
