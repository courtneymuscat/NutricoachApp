-- Add serving_sizes to food tables so foods can store named household measures
-- e.g. [{"label": "1 cup", "grams": 90}, {"label": "1 tbsp", "grams": 10}]
ALTER TABLE food_database ADD COLUMN IF NOT EXISTS serving_sizes jsonb DEFAULT '[]';
ALTER TABLE foods ADD COLUMN IF NOT EXISTS serving_sizes jsonb DEFAULT '[]';

-- Record what serving size the user actually entered (display only — macros already stored)
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS serving_description text;
