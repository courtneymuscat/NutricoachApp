-- Run this in your Supabase SQL editor

-- Exercise library (shared across all users)
CREATE TABLE exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL, -- chest, back, legs, shoulders, arms, core, cardio
  equipment text NOT NULL DEFAULT 'bodyweight', -- barbell, dumbbell, machine, bodyweight, cable, other
  muscles text,
  instructions text,
  video_url text,
  is_custom boolean DEFAULT false,
  created_by uuid REFERENCES auth.users(id)
);

-- Workout sessions
CREATE TABLE workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Workout',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  notes text
);

-- Exercises within a workout (ordered)
CREATE TABLE workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id),
  order_index integer NOT NULL DEFAULT 0
);

-- Individual sets
CREATE TABLE exercise_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number integer NOT NULL DEFAULT 1,
  weight_lbs numeric,
  reps integer,
  duration_seconds integer,
  calories integer,
  completed boolean DEFAULT false,
  notes text
);

-- RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own workouts" ON workouts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own workout exercises" ON workout_exercises FOR ALL USING (
  workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid())
);

CREATE POLICY "Users manage own exercise sets" ON exercise_sets FOR ALL USING (
  workout_exercise_id IN (
    SELECT we.id FROM workout_exercises we
    JOIN workouts w ON we.workout_id = w.id
    WHERE w.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can read exercises" ON exercises FOR SELECT USING (true);

CREATE POLICY "Users can create custom exercises" ON exercises FOR INSERT
  WITH CHECK (is_custom = true AND auth.uid() = created_by);

-- Seed common exercises
INSERT INTO exercises (name, category, equipment, muscles) VALUES
  -- Chest
  ('Bench Press', 'chest', 'barbell', 'Pectorals, Triceps, Anterior Deltoid'),
  ('Incline Bench Press', 'chest', 'barbell', 'Upper Pectorals, Triceps'),
  ('Dumbbell Fly', 'chest', 'dumbbell', 'Pectorals'),
  ('Push-Up', 'chest', 'bodyweight', 'Pectorals, Triceps, Core'),
  ('Cable Crossover', 'chest', 'cable', 'Pectorals'),
  -- Back
  ('Deadlift', 'back', 'barbell', 'Hamstrings, Glutes, Erectors, Lats'),
  ('Pull-Up', 'back', 'bodyweight', 'Lats, Biceps, Rhomboids'),
  ('Bent Over Row', 'back', 'barbell', 'Lats, Rhomboids, Rear Deltoid'),
  ('Lat Pulldown', 'back', 'cable', 'Lats, Biceps'),
  ('Seated Cable Row', 'back', 'cable', 'Rhomboids, Lats, Biceps'),
  ('Single Arm Dumbbell Row', 'back', 'dumbbell', 'Lats, Rhomboids'),
  -- Legs
  ('Squat', 'legs', 'barbell', 'Quads, Glutes, Hamstrings'),
  ('Romanian Deadlift', 'legs', 'barbell', 'Hamstrings, Glutes'),
  ('Leg Press', 'legs', 'machine', 'Quads, Glutes'),
  ('Leg Curl', 'legs', 'machine', 'Hamstrings'),
  ('Leg Extension', 'legs', 'machine', 'Quads'),
  ('Bulgarian Split Squat', 'legs', 'dumbbell', 'Quads, Glutes'),
  ('Hip Thrust', 'legs', 'barbell', 'Glutes'),
  ('Calf Raise', 'legs', 'machine', 'Calves'),
  ('Walking Lunge', 'legs', 'dumbbell', 'Quads, Glutes, Hamstrings'),
  -- Shoulders
  ('Overhead Press', 'shoulders', 'barbell', 'Deltoids, Triceps'),
  ('Dumbbell Shoulder Press', 'shoulders', 'dumbbell', 'Deltoids, Triceps'),
  ('Lateral Raise', 'shoulders', 'dumbbell', 'Lateral Deltoid'),
  ('Front Raise', 'shoulders', 'dumbbell', 'Anterior Deltoid'),
  ('Face Pull', 'shoulders', 'cable', 'Rear Deltoid, Rotator Cuff'),
  ('Rear Delt Fly', 'shoulders', 'dumbbell', 'Rear Deltoid'),
  -- Arms
  ('Barbell Curl', 'arms', 'barbell', 'Biceps'),
  ('Dumbbell Curl', 'arms', 'dumbbell', 'Biceps'),
  ('Hammer Curl', 'arms', 'dumbbell', 'Biceps, Brachialis'),
  ('Tricep Pushdown', 'arms', 'cable', 'Triceps'),
  ('Skull Crusher', 'arms', 'barbell', 'Triceps'),
  ('Overhead Tricep Extension', 'arms', 'dumbbell', 'Triceps'),
  ('Preacher Curl', 'arms', 'barbell', 'Biceps'),
  -- Core
  ('Plank', 'core', 'bodyweight', 'Core, Transverse Abdominis'),
  ('Crunch', 'core', 'bodyweight', 'Rectus Abdominis'),
  ('Russian Twist', 'core', 'bodyweight', 'Obliques'),
  ('Hanging Leg Raise', 'core', 'bodyweight', 'Lower Abs, Hip Flexors'),
  ('Cable Crunch', 'core', 'cable', 'Rectus Abdominis'),
  ('Dead Bug', 'core', 'bodyweight', 'Core, Transverse Abdominis'),
  -- Cardio
  ('Treadmill', 'cardio', 'machine', 'Cardiovascular'),
  ('Cycling', 'cardio', 'machine', 'Cardiovascular, Quads'),
  ('Rowing Machine', 'cardio', 'machine', 'Cardiovascular, Back, Arms'),
  ('Jump Rope', 'cardio', 'other', 'Cardiovascular, Calves'),
  ('Stair Climber', 'cardio', 'machine', 'Cardiovascular, Glutes, Quads'),
  ('Elliptical', 'cardio', 'machine', 'Cardiovascular');
