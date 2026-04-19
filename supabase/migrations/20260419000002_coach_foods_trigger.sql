-- ── Function: seed default foods for any coach ───────────────────────────────
-- Called on coach account creation + can be called manually to backfill

CREATE OR REPLACE FUNCTION initialize_coach_foods(p_coach_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO coach_food_serves
    (coach_id, food_name, serve_category, secondary_categories, subcategory, serving_desc, calories_per_serve, protein_per_serve, carbs_per_serve, fat_per_serve)
  VALUES
    -- ── LEAN PROTEINS ─────────────────────────────────────────────────────────
    (p_coach_id, 'Chicken breast, raw',      'protein', '{}',       'lean_protein',  '135g',                 140, 30,  0,  2),
    (p_coach_id, 'Tuna in springwater',      'protein', '{}',       'lean_protein',  '120g',                 131, 30,  0,  1),
    (p_coach_id, 'Basa fillet, raw',         'protein', '{}',       'lean_protein',  '190g',                 150, 30,  0,  3),
    (p_coach_id, 'Pork, lean raw',           'protein', '{}',       'lean_protein',  '130g',                 143, 30,  0,  2),
    (p_coach_id, 'Egg whites',               'protein', '{}',       'lean_protein',  '300g',                 156, 33,  2,  1),
    (p_coach_id, 'Protein powder',           'protein', '{}',       'lean_protein',  '35g',                  133, 31,  2,  0),
    -- ── PROTEIN + FAT ─────────────────────────────────────────────────────────
    (p_coach_id, 'Salmon, raw',              'protein', '{"fat"}',  'lean_protein',  '150g',                 200, 30,  0,  9),
    (p_coach_id, 'Chicken thigh, raw',       'protein', '{"fat"}',  'lean_protein',  '165g',                 195, 30,  0,  8),
    (p_coach_id, 'Barramundi, raw',          'protein', '{"fat"}',  'lean_protein',  '155g',                 194, 30,  0,  8),
    (p_coach_id, 'Whole eggs',               'protein', '{"fat"}',  'lean_protein',  '2 large (100g)',       155, 13,  1, 11),
    -- ── PLANT PROTEINS ────────────────────────────────────────────────────────
    (p_coach_id, 'Tempeh',                   'protein', '{"fat"}',  'plant_protein', '100g',                 193, 19,  9, 11),
    (p_coach_id, 'Tofu, firm',               'protein', '{"fat"}',  'plant_protein', '250g',                 206, 21,  6, 12),
    (p_coach_id, 'Brown lentils, cooked',    'protein', '{"carb"}', 'plant_protein', '170g cooked',          197, 20, 22,  1),
    (p_coach_id, 'Edamame beans',            'protein', '{"carb"}', 'plant_protein', '150g',                 200, 16, 18,  6),
    (p_coach_id, 'Chickpeas, canned',        'protein', '{"carb"}', 'plant_protein', '140g drained',         204, 11, 31,  5),
    -- ── CARBS — GRAINS ────────────────────────────────────────────────────────
    (p_coach_id, 'Jasmine rice, raw',        'carb',    '{}',       'grain',         '25g raw (65g cooked)',  91,  2, 20,  0),
    (p_coach_id, 'Jasmine rice, cooked',     'carb',    '{}',       'grain',         '65g cooked',            91,  2, 20,  0),
    (p_coach_id, 'Brown rice, raw',          'carb',    '{}',       'grain',         '25g raw',               89,  2, 19,  1),
    (p_coach_id, 'Brown rice, cooked',       'carb',    '{}',       'grain',         '65g cooked',            89,  2, 19,  1),
    (p_coach_id, 'Rolled oats',              'carb',    '{}',       'grain',         '30g',                  114,  4, 17,  3),
    (p_coach_id, 'Pasta, raw',               'carb',    '{}',       'grain',         '30g raw (70g cooked)', 110,  4, 22,  1),
    (p_coach_id, 'Pasta, cooked',            'carb',    '{}',       'grain',         '70g cooked',           110,  4, 22,  1),
    -- ── CARBS — BREAD ─────────────────────────────────────────────────────────
    (p_coach_id, 'Sourdough bread',          'carb',    '{}',       'bread',         '45g (1–2 slices)',     112,  4, 20,  1),
    (p_coach_id, 'Wholegrain bread',         'carb',    '{}',       'bread',         '40g (1–2 slices)',     100,  4, 18,  2),
    -- ── CARBS — STARCHY VEG ───────────────────────────────────────────────────
    (p_coach_id, 'Sweet potato, raw',        'carb',    '{}',       'starchy_veg',   '150g raw',             105,  3, 21,  0),
    (p_coach_id, 'White potato, raw',        'carb',    '{}',       'starchy_veg',   '180g raw',             119,  4, 20,  0),
    (p_coach_id, 'Butternut pumpkin, raw',   'carb',    '{}',       'starchy_veg',   '300g raw',             123,  6, 21,  2),
    -- ── CARBS — CEREALS ───────────────────────────────────────────────────────
    (p_coach_id, 'Weetbix',                  'carb',    '{}',       'cereal',        '2 biscuits (30g)',     118,  4, 22,  0),
    (p_coach_id, 'Muesli / granola',         'carb',    '{"fat"}',  'cereal',        '25g',                  112,  2, 16,  4),
    -- ── FATS — SEEDS ──────────────────────────────────────────────────────────
    (p_coach_id, 'Sunflower seeds',          'fat',     '{}',       'seed',          '20g',                  118,  5,  0, 10),
    (p_coach_id, 'Pumpkin seeds (pepitas)',   'fat',     '{}',       'seed',          '20g',                  108,  6,  0,  9),
    (p_coach_id, 'Linseed / flaxseed',       'fat',     '{}',       'seed',          '20g',                   99,  3,  0,  8),
    (p_coach_id, 'Chia seeds',               'fat',     '{}',       'seed',          '20g',                   97,  3,  1,  6),
    (p_coach_id, 'Sesame seeds',             'fat',     '{}',       'seed',          '15g',                   86,  3,  1,  7),
    (p_coach_id, 'Hemp seeds',               'fat',     '{}',       'seed',          '20g',                  110,  6,  0,  9),
    -- ── FATS — NUTS ───────────────────────────────────────────────────────────
    (p_coach_id, 'Almonds',                  'fat',     '{}',       'nut',           '20g (~16 nuts)',        114,  4,  1, 10),
    (p_coach_id, 'Walnuts',                  'fat',     '{}',       'nut',           '15g (~7 halves)',       104,  2,  0, 10),
    (p_coach_id, 'Macadamia nuts',           'fat',     '{}',       'nut',           '15g (~5 nuts)',         110,  1,  1, 11),
    (p_coach_id, 'Cashews',                  'fat',     '{}',       'nut',           '20g (~14 nuts)',        109,  3,  5,  9),
    (p_coach_id, 'Pecans',                   'fat',     '{}',       'nut',           '15g (~8 halves)',       104,  1,  1, 11),
    (p_coach_id, 'Brazil nuts',              'fat',     '{}',       'nut',           '20g (~3 nuts)',         130,  3,  1, 13),
    (p_coach_id, 'Pistachios',               'fat',     '{}',       'nut',           '25g (~45 nuts)',        142,  5,  4, 11),
    -- ── FATS — NUT BUTTERS ────────────────────────────────────────────────────
    (p_coach_id, 'Peanut butter',            'fat',     '{}',       'nut_butter',    '20g (1 tbsp)',          116,  5,  3, 10),
    (p_coach_id, 'Almond butter',            'fat',     '{}',       'nut_butter',    '20g (1 tbsp)',          119,  4,  3, 11),
    (p_coach_id, 'Cashew butter',            'fat',     '{}',       'nut_butter',    '20g (1 tbsp)',          112,  3,  5,  9),
    -- ── FATS — OILS ───────────────────────────────────────────────────────────
    (p_coach_id, 'Extra virgin olive oil',   'fat',     '{}',       'oil',           '10g (1 tbsp)',           88,  0,  0, 10),
    (p_coach_id, 'Coconut oil',              'fat',     '{}',       'oil',           '10g (1 tbsp)',           86,  0,  0, 10),
    (p_coach_id, 'Avocado oil',              'fat',     '{}',       'oil',           '10g (1 tbsp)',           88,  0,  0, 10),
    -- ── FATS — OTHER ──────────────────────────────────────────────────────────
    (p_coach_id, 'Avocado (Hass)',           'fat',     '{}',       null,            '75g (½ medium)',         95,  1,  0, 10),
    (p_coach_id, 'Pesto',                    'fat',     '{}',       null,            '30g',                    96,  3,  1,  9),
    (p_coach_id, 'Tahini',                   'fat',     '{}',       null,            '15g (1 tbsp)',            88,  3,  1,  8),
    (p_coach_id, 'Coconut milk (tin)',        'fat',     '{}',       null,            '60ml',                   91,  1,  2,  8),
    (p_coach_id, 'Dark chocolate 85%',       'fat',     '{}',       null,            '20g',                   112,  2,  4,  9),
    -- ── FATS — CHEESE ─────────────────────────────────────────────────────────
    (p_coach_id, 'Tasty cheese',             'fat',     '{}',       'cheese',        '20g (6 cubes)',           79,  5,  0,  7),
    (p_coach_id, 'Brie cheese',              'fat',     '{}',       'cheese',        '30g',                    84,  5,  0,  5),
    (p_coach_id, 'Feta cheese',              'fat',     '{}',       'cheese',        '40g',                    99,  5,  1,  8),
    (p_coach_id, 'Parmesan',                 'fat',     '{}',       'cheese',        '20g',                    85,  7,  0,  6),
    -- ── FRUIT ─────────────────────────────────────────────────────────────────
    (p_coach_id, 'Apple, red',               'fruit',   '{}',       null,            '155g',                   90,  0, 20,  0),
    (p_coach_id, 'Apple, green',             'fruit',   '{}',       null,            '185g',                   89,  1, 20,  0),
    (p_coach_id, 'Banana',                   'fruit',   '{}',       null,            '100g peeled',            94,  1, 20,  0),
    (p_coach_id, 'Pineapple',                'fruit',   '{}',       null,            '245g peeled',           104,  2, 20,  1),
    (p_coach_id, 'Mango',                    'fruit',   '{}',       null,            '150g peeled',            85,  1, 20,  0),
    (p_coach_id, 'Strawberries',             'fruit',   '{}',       null,            '500g',                  130,  4, 20,  1),
    (p_coach_id, 'Raspberries',              'fruit',   '{}',       null,            '295g',                  143,  3, 20,  1),
    (p_coach_id, 'Papaya',                   'fruit',   '{}',       null,            '220g',                   85,  1, 20,  0),
    (p_coach_id, 'Rockmelon',                'fruit',   '{}',       null,            '425g peeled',           101,  2, 20,  0),
    (p_coach_id, 'Watermelon',               'fruit',   '{}',       null,            '275g peeled',            87,  2, 20,  0),
    (p_coach_id, 'Kiwifruit',                'fruit',   '{}',       null,            '180g peeled',           105,  2, 20,  1),
    (p_coach_id, 'Grapes',                   'fruit',   '{}',       null,            '130g',                   86,  1, 20,  0),
    (p_coach_id, 'Peach',                    'fruit',   '{}',       null,            '255g',                  102,  2, 20,  0),
    (p_coach_id, 'Pear',                     'fruit',   '{}',       null,            '130g',                   86,  1, 20,  0),
    (p_coach_id, 'Orange',                   'fruit',   '{}',       null,            '245g peeled',           103,  2, 20,  0),
    (p_coach_id, 'Mandarin',                 'fruit',   '{}',       null,            '200g peeled',            93,  2, 20,  0),
    (p_coach_id, 'Blueberries',              'fruit',   '{}',       null,            '200g',                   94,  1, 20,  0),
    -- ── CONDIMENTS — FAT-BASED ────────────────────────────────────────────────
    (p_coach_id, 'Garlic aioli',             'fat',     '{}',       'condiment_fat', '25g',                    99,  0,  1, 11),
    (p_coach_id, 'Creamy mayonnaise',        'fat',     '{}',       'condiment_fat', '15g',                    98,  1,  1,  9),
    (p_coach_id, 'Ranch dressing',           'fat',     '{}',       'condiment_fat', '30ml',                  101,  2,  4,  9),
    (p_coach_id, 'Caesar dressing',          'fat',     '{}',       'condiment_fat', '27ml',                   98,  1,  2, 10),
    (p_coach_id, 'Balsamic dressing',        'fat',     '{}',       'condiment_fat', '50ml',                  103,  0,  8,  8),
    (p_coach_id, 'Kewpie mayonnaise',        'fat',     '{}',       'condiment_fat', '14g',                   100,  0,  0, 10),
    (p_coach_id, 'Japanese sesame dressing', 'fat',     '{}',       'condiment_fat', '50ml',                   97,  2, 12,  6),
    (p_coach_id, 'Tahini dressing',          'fat',     '{}',       'condiment_fat', '20g',                   117,  4,  1, 10),
    -- ── CONDIMENTS — CARB-BASED ───────────────────────────────────────────────
    (p_coach_id, 'Tomato sauce',             'carb',    '{}',       'condiment_carb','80g',                    97,  1, 21,  0),
    (p_coach_id, 'BBQ sauce',                'carb',    '{}',       'condiment_carb','60ml',                  104,  0, 24,  0),
    (p_coach_id, 'Sweet chilli sauce',       'carb',    '{}',       'condiment_carb','50ml',                  102,  0, 25,  0),
    (p_coach_id, 'Honey',                    'carb',    '{}',       'condiment_carb','25g',                    80,  0, 20,  0),
    (p_coach_id, 'Kecap manis (sweet soy)',  'carb',    '{}',       'condiment_carb','32ml',                  100,  0, 24,  0),
    (p_coach_id, 'Teriyaki sauce',           'carb',    '{}',       'condiment_carb','40ml',                   95,  1, 20,  1),
    (p_coach_id, 'Hoisin sauce',             'carb',    '{}',       'condiment_carb','30g',                    98,  2, 20,  1),
    -- ── FREE CONDIMENTS ───────────────────────────────────────────────────────
    (p_coach_id, 'Vegemite',                 'free',    '{}',       'free_condiment','3g',                      5,  1,  0,  0),
    (p_coach_id, 'Lemon juice',              'free',    '{}',       'free_condiment','10ml',                    4,  0,  0,  0),
    (p_coach_id, 'Soy sauce (light)',        'free',    '{}',       'free_condiment','15ml',                    7,  1,  1,  0),
    (p_coach_id, 'Hot sauce / Tabasco',      'free',    '{}',       'free_condiment','5ml',                     1,  0,  0,  0),
    (p_coach_id, 'White wine vinegar',       'free',    '{}',       'free_condiment','15ml',                    3,  0,  0,  0),
    (p_coach_id, 'Apple cider vinegar',      'free',    '{}',       'free_condiment','15ml',                    3,  0,  0,  0),
    (p_coach_id, 'Wholegrain mustard',       'free',    '{}',       'free_condiment','5g',                      9,  0,  1,  1),
    (p_coach_id, 'American mustard',         'free',    '{}',       'free_condiment','15g',                     9,  0,  1,  0),
    (p_coach_id, 'Chunky salsa',             'free',    '{}',       'free_condiment','20g',                     8,  0,  2,  0),
    (p_coach_id, 'Fresh herbs',              'free',    '{}',       'free_condiment','handful',                  5,  0,  1,  0),
    (p_coach_id, 'Garlic, raw',              'free',    '{}',       'free_condiment','1 clove',                  4,  0,  1,  0),
    (p_coach_id, 'Ginger, raw',              'free',    '{}',       'free_condiment','5g',                      3,  0,  1,  0),
    (p_coach_id, 'Cinnamon',                 'free',    '{}',       'free_condiment','1 tsp',                   6,  0,  2,  0),
    (p_coach_id, 'Stock / bone broth',       'free',    '{}',       'free_condiment','250ml',                  10,  1,  1,  0)
  ON CONFLICT (coach_id, food_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Trigger function ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_initialize_coach_foods()
RETURNS trigger AS $$
BEGIN
  -- Fire when a profile is created as coach/business, or upgraded to coach/business
  IF NEW.user_type IN ('coach', 'business') AND (
    TG_OP = 'INSERT' OR
    (TG_OP = 'UPDATE' AND (OLD.user_type IS NULL OR OLD.user_type NOT IN ('coach', 'business')))
  ) THEN
    PERFORM initialize_coach_foods(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_coach_profile_created ON profiles;
CREATE TRIGGER on_coach_profile_created
  AFTER INSERT OR UPDATE OF user_type ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_initialize_coach_foods();

-- ── Backfill all existing coaches ─────────────────────────────────────────────

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM profiles WHERE user_type IN ('coach', 'business') LOOP
    PERFORM initialize_coach_foods(r.id);
  END LOOP;
END $$;
