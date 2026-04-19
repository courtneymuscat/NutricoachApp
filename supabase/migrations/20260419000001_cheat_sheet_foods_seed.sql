-- Add subcategory to coach_food_serves (separates condiments from regular fats/carbs)
ALTER TABLE coach_food_serves ADD COLUMN IF NOT EXISTS subcategory text;

-- Pre-populate with serve-exchange foods for Courtney's coaching
DO $$
DECLARE coach uuid;
BEGIN
  SELECT id INTO coach FROM profiles WHERE email = 'courtneymuscat@icloud.com' LIMIT 1;
  IF coach IS NULL THEN RAISE EXCEPTION 'Coach not found for courtneymuscat@icloud.com'; END IF;

  INSERT INTO coach_food_serves
    (coach_id, food_name, serve_category, secondary_categories, subcategory, serving_desc, calories_per_serve, protein_per_serve, carbs_per_serve, fat_per_serve)
  VALUES
    -- ── LEAN PROTEINS ─────────────────────────────────────────────────────────────
    (coach, 'Chicken breast, raw',      'protein', '{}',       'lean_protein',  '135g',                140, 30,  0,  2),
    (coach, 'Tuna in springwater',      'protein', '{}',       'lean_protein',  '120g',                131, 30,  0,  1),
    (coach, 'Basa fillet, raw',         'protein', '{}',       'lean_protein',  '190g',                150, 30,  0,  3),
    (coach, 'Pork, lean raw',           'protein', '{}',       'lean_protein',  '130g',                143, 30,  0,  2),
    (coach, 'Egg whites',               'protein', '{}',       'lean_protein',  '300g',                156, 33,  2,  1),
    (coach, 'Protein powder',           'protein', '{}',       'lean_protein',  '35g',                 133, 31,  2,  0),
    -- ── PROTEIN + FAT (secondary fat serve) ───────────────────────────────────────
    (coach, 'Salmon, raw',              'protein', '{"fat"}',  'lean_protein',  '150g',                200, 30,  0,  9),
    (coach, 'Chicken thigh, raw',       'protein', '{"fat"}',  'lean_protein',  '165g',                195, 30,  0,  8),
    (coach, 'Barramundi, raw',          'protein', '{"fat"}',  'lean_protein',  '155g',                194, 30,  0,  8),
    (coach, 'Whole eggs',               'protein', '{"fat"}',  'lean_protein',  '2 large (100g)',      155, 13,  1, 11),
    -- ── PLANT PROTEINS ────────────────────────────────────────────────────────────
    (coach, 'Tempeh',                   'protein', '{"fat"}',  'plant_protein', '100g',                193, 19,  9, 11),
    (coach, 'Tofu, firm',               'protein', '{"fat"}',  'plant_protein', '250g',                206, 21,  6, 12),
    (coach, 'Brown lentils, cooked',    'protein', '{"carb"}', 'plant_protein', '170g cooked',         197, 20, 22,  1),
    (coach, 'Edamame beans',            'protein', '{"carb"}', 'plant_protein', '150g',                200, 16, 18,  6),
    (coach, 'Chickpeas, canned',        'protein', '{"carb"}', 'plant_protein', '140g drained',        204, 11, 31,  5),
    -- ── CARBS — GRAINS ────────────────────────────────────────────────────────────
    (coach, 'Jasmine rice, raw',        'carb',    '{}',       'grain',         '25g raw (65g cooked)', 91,  2, 20,  0),
    (coach, 'Jasmine rice, cooked',     'carb',    '{}',       'grain',         '65g cooked',           91,  2, 20,  0),
    (coach, 'Brown rice, raw',          'carb',    '{}',       'grain',         '25g raw',              89,  2, 19,  1),
    (coach, 'Brown rice, cooked',       'carb',    '{}',       'grain',         '65g cooked',           89,  2, 19,  1),
    (coach, 'Rolled oats',              'carb',    '{}',       'grain',         '30g',                 114,  4, 17,  3),
    (coach, 'Pasta, raw',               'carb',    '{}',       'grain',         '30g raw (70g cooked)',110,  4, 22,  1),
    (coach, 'Pasta, cooked',            'carb',    '{}',       'grain',         '70g cooked',          110,  4, 22,  1),
    -- ── CARBS — BREAD ─────────────────────────────────────────────────────────────
    (coach, 'Sourdough bread',          'carb',    '{}',       'bread',         '45g (1–2 slices)',    112,  4, 20,  1),
    (coach, 'Wholegrain bread',         'carb',    '{}',       'bread',         '40g (1–2 slices)',    100,  4, 18,  2),
    -- ── CARBS — STARCHY VEG ───────────────────────────────────────────────────────
    (coach, 'Sweet potato, raw',        'carb',    '{}',       'starchy_veg',   '150g raw',            105,  3, 21,  0),
    (coach, 'White potato, raw',        'carb',    '{}',       'starchy_veg',   '180g raw',            119,  4, 20,  0),
    (coach, 'Butternut pumpkin, raw',   'carb',    '{}',       'starchy_veg',   '300g raw',            123,  6, 21,  2),
    -- ── CARBS — CEREALS ───────────────────────────────────────────────────────────
    (coach, 'Weetbix',                  'carb',    '{}',       'cereal',        '2 biscuits (30g)',    118,  4, 22,  0),
    (coach, 'Muesli / granola',         'carb',    '{"fat"}',  'cereal',        '25g',                 112,  2, 16,  4),
    -- ── FATS — SEEDS ──────────────────────────────────────────────────────────────
    (coach, 'Sunflower seeds',          'fat',     '{}',       'seed',          '20g',                 118,  5,  0, 10),
    (coach, 'Pumpkin seeds (pepitas)',   'fat',     '{}',       'seed',          '20g',                 108,  6,  0,  9),
    (coach, 'Linseed / flaxseed',       'fat',     '{}',       'seed',          '20g',                  99,  3,  0,  8),
    (coach, 'Chia seeds',               'fat',     '{}',       'seed',          '20g',                  97,  3,  1,  6),
    (coach, 'Sesame seeds',             'fat',     '{}',       'seed',          '15g',                  86,  3,  1,  7),
    (coach, 'Hemp seeds',               'fat',     '{}',       'seed',          '20g',                 110,  6,  0,  9),
    -- ── FATS — NUTS ───────────────────────────────────────────────────────────────
    (coach, 'Almonds',                  'fat',     '{}',       'nut',           '20g (~16 nuts)',       114,  4,  1, 10),
    (coach, 'Walnuts',                  'fat',     '{}',       'nut',           '15g (~7 halves)',      104,  2,  0, 10),
    (coach, 'Macadamia nuts',           'fat',     '{}',       'nut',           '15g (~5 nuts)',        110,  1,  1, 11),
    (coach, 'Cashews',                  'fat',     '{}',       'nut',           '20g (~14 nuts)',       109,  3,  5,  9),
    (coach, 'Pecans',                   'fat',     '{}',       'nut',           '15g (~8 halves)',      104,  1,  1, 11),
    (coach, 'Brazil nuts',              'fat',     '{}',       'nut',           '20g (~3 nuts)',        130,  3,  1, 13),
    (coach, 'Pistachios',               'fat',     '{}',       'nut',           '25g (~45 nuts)',       142,  5,  4, 11),
    -- ── FATS — NUT BUTTERS ────────────────────────────────────────────────────────
    (coach, 'Peanut butter',            'fat',     '{}',       'nut_butter',    '20g (1 tbsp)',         116,  5,  3, 10),
    (coach, 'Almond butter',            'fat',     '{}',       'nut_butter',    '20g (1 tbsp)',         119,  4,  3, 11),
    (coach, 'Cashew butter',            'fat',     '{}',       'nut_butter',    '20g (1 tbsp)',         112,  3,  5,  9),
    -- ── FATS — OILS ───────────────────────────────────────────────────────────────
    (coach, 'Extra virgin olive oil',   'fat',     '{}',       'oil',           '10g (1 tbsp)',          88,  0,  0, 10),
    (coach, 'Coconut oil',              'fat',     '{}',       'oil',           '10g (1 tbsp)',          86,  0,  0, 10),
    (coach, 'Avocado oil',              'fat',     '{}',       'oil',           '10g (1 tbsp)',          88,  0,  0, 10),
    -- ── FATS — AVOCADO / OTHER ────────────────────────────────────────────────────
    (coach, 'Avocado (Hass)',           'fat',     '{}',       null,            '75g (½ medium)',        95,  1,  0, 10),
    (coach, 'Pesto',                    'fat',     '{}',       null,            '30g',                   96,  3,  1,  9),
    (coach, 'Tahini',                   'fat',     '{}',       null,            '15g (1 tbsp)',           88,  3,  1,  8),
    (coach, 'Coconut milk (tin)',        'fat',     '{}',       null,            '60ml',                  91,  1,  2,  8),
    (coach, 'Dark chocolate 85%',       'fat',     '{}',       null,            '20g',                  112,  2,  4,  9),
    -- ── FATS — CHEESE ─────────────────────────────────────────────────────────────
    (coach, 'Tasty cheese',             'fat',     '{}',       'cheese',        '20g (6 cubes)',          79,  5,  0,  7),
    (coach, 'Brie cheese',              'fat',     '{}',       'cheese',        '30g',                   84,  5,  0,  5),
    (coach, 'Feta cheese',              'fat',     '{}',       'cheese',        '40g',                   99,  5,  1,  8),
    (coach, 'Parmesan',                 'fat',     '{}',       'cheese',        '20g',                   85,  7,  0,  6),
    -- ── FRUIT ─────────────────────────────────────────────────────────────────────
    (coach, 'Apple, red',               'fruit',   '{}',       null,            '155g',                  90,  0, 20,  0),
    (coach, 'Apple, green',             'fruit',   '{}',       null,            '185g',                  89,  1, 20,  0),
    (coach, 'Banana',                   'fruit',   '{}',       null,            '100g peeled',           94,  1, 20,  0),
    (coach, 'Pineapple',                'fruit',   '{}',       null,            '245g peeled',          104,  2, 20,  1),
    (coach, 'Mango',                    'fruit',   '{}',       null,            '150g peeled',           85,  1, 20,  0),
    (coach, 'Strawberries',             'fruit',   '{}',       null,            '500g',                 130,  4, 20,  1),
    (coach, 'Raspberries',              'fruit',   '{}',       null,            '295g',                 143,  3, 20,  1),
    (coach, 'Papaya',                   'fruit',   '{}',       null,            '220g',                  85,  1, 20,  0),
    (coach, 'Rockmelon',                'fruit',   '{}',       null,            '425g peeled',          101,  2, 20,  0),
    (coach, 'Watermelon',               'fruit',   '{}',       null,            '275g peeled',           87,  2, 20,  0),
    (coach, 'Kiwifruit',                'fruit',   '{}',       null,            '180g peeled',          105,  2, 20,  1),
    (coach, 'Grapes',                   'fruit',   '{}',       null,            '130g',                  86,  1, 20,  0),
    (coach, 'Peach',                    'fruit',   '{}',       null,            '255g',                 102,  2, 20,  0),
    (coach, 'Pear',                     'fruit',   '{}',       null,            '130g',                  86,  1, 20,  0),
    (coach, 'Orange',                   'fruit',   '{}',       null,            '245g peeled',          103,  2, 20,  0),
    (coach, 'Mandarin',                 'fruit',   '{}',       null,            '200g peeled',           93,  2, 20,  0),
    (coach, 'Blueberries',              'fruit',   '{}',       null,            '200g',                  94,  1, 20,  0),
    -- ── CONDIMENTS — FAT-BASED (counts as 1 fat serve) ───────────────────────────
    (coach, 'Garlic aioli',             'fat',     '{}',       'condiment_fat', '25g',                   99,  0,  1, 11),
    (coach, 'Creamy mayonnaise',        'fat',     '{}',       'condiment_fat', '15g',                   98,  1,  1,  9),
    (coach, 'Ranch dressing',           'fat',     '{}',       'condiment_fat', '30ml',                 101,  2,  4,  9),
    (coach, 'Caesar dressing',          'fat',     '{}',       'condiment_fat', '27ml',                  98,  1,  2, 10),
    (coach, 'Balsamic dressing',        'fat',     '{}',       'condiment_fat', '50ml',                 103,  0,  8,  8),
    (coach, 'Kewpie mayonnaise',        'fat',     '{}',       'condiment_fat', '14g',                  100,  0,  0, 10),
    (coach, 'Japanese sesame dressing', 'fat',     '{}',       'condiment_fat', '50ml',                  97,  2, 12,  6),
    (coach, 'Tahini dressing',          'fat',     '{}',       'condiment_fat', '20g',                  117,  4,  1, 10),
    -- ── CONDIMENTS — CARB-BASED (counts as 1 carb serve) ─────────────────────────
    (coach, 'Tomato sauce',             'carb',    '{}',       'condiment_carb','80g',                   97,  1, 21,  0),
    (coach, 'BBQ sauce',                'carb',    '{}',       'condiment_carb','60ml',                 104,  0, 24,  0),
    (coach, 'Sweet chilli sauce',       'carb',    '{}',       'condiment_carb','50ml',                 102,  0, 25,  0),
    (coach, 'Honey',                    'carb',    '{}',       'condiment_carb','25g',                   80,  0, 20,  0),
    (coach, 'Kecap manis (sweet soy)',  'carb',    '{}',       'condiment_carb','32ml',                 100,  0, 24,  0),
    (coach, 'Teriyaki sauce',           'carb',    '{}',       'condiment_carb','40ml',                  95,  1, 20,  1),
    (coach, 'Hoisin sauce',             'carb',    '{}',       'condiment_carb','30g',                   98,  2, 20,  1),
    -- ── FREE CONDIMENTS (no serve count) ──────────────────────────────────────────
    (coach, 'Vegemite',                 'free',    '{}',       'free_condiment','3g',                     5,  1,  0,  0),
    (coach, 'Lemon juice',              'free',    '{}',       'free_condiment','10ml',                   4,  0,  0,  0),
    (coach, 'Soy sauce (light)',        'free',    '{}',       'free_condiment','15ml',                   7,  1,  1,  0),
    (coach, 'Hot sauce / Tabasco',      'free',    '{}',       'free_condiment','5ml',                    1,  0,  0,  0),
    (coach, 'White wine vinegar',       'free',    '{}',       'free_condiment','15ml',                   3,  0,  0,  0),
    (coach, 'Apple cider vinegar',      'free',    '{}',       'free_condiment','15ml',                   3,  0,  0,  0),
    (coach, 'Wholegrain mustard',       'free',    '{}',       'free_condiment','5g',                     9,  0,  1,  1),
    (coach, 'American mustard',         'free',    '{}',       'free_condiment','15g',                    9,  0,  1,  0),
    (coach, 'Chunky salsa',             'free',    '{}',       'free_condiment','20g',                    8,  0,  2,  0),
    (coach, 'Fresh herbs',              'free',    '{}',       'free_condiment','handful',                5,  0,  1,  0),
    (coach, 'Garlic, raw',              'free',    '{}',       'free_condiment','1 clove',                4,  0,  1,  0),
    (coach, 'Ginger, raw',              'free',    '{}',       'free_condiment','5g',                     3,  0,  1,  0),
    (coach, 'Cinnamon',                 'free',    '{}',       'free_condiment','1 tsp',                  6,  0,  2,  0),
    (coach, 'Stock / bone broth',       'free',    '{}',       'free_condiment','250ml',                 10,  1,  1,  0)
  ON CONFLICT (coach_id, food_name) DO UPDATE SET
    serve_category       = EXCLUDED.serve_category,
    secondary_categories = EXCLUDED.secondary_categories,
    subcategory          = EXCLUDED.subcategory,
    serving_desc         = EXCLUDED.serving_desc,
    calories_per_serve   = EXCLUDED.calories_per_serve,
    protein_per_serve    = EXCLUDED.protein_per_serve,
    carbs_per_serve      = EXCLUDED.carbs_per_serve,
    fat_per_serve        = EXCLUDED.fat_per_serve;

END $$;
