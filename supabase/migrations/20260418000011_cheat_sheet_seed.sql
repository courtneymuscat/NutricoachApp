-- ─── Seed: Cheat Sheet Foods ─────────────────────────────────────────────────
-- Based on Courtney's serve-exchange cheat sheet
-- 1 Protein serve ≈ 30g protein | 1 Carb serve ≈ 20g carbs | 1 Fat serve ≈ 10g fat | all ~100cal

insert into cheat_sheet_foods (name, serving_desc, calories, protein_g, carbs_g, fat_g, primary_category, secondary_categories, subcategory, display_order) values

-- ─── LEAN PROTEIN (~30g protein, ~100-160cal) ────────────────────────────────
('Tuna in springwater',         '120g',        131, 30, 0, 1, 'protein', '{}',       'lean_protein',  10),
('Green prawns (raw weight)',   '145g',        132, 30, 0, 1, 'protein', '{}',       'lean_protein',  20),
('Protein powder',              '35g',         133, 31, 2, 0, 'protein', '{}',       'lean_protein',  30),
('Chicken breast (raw)',        '135g',        140, 30, 0, 2, 'protein', '{}',       'lean_protein',  40),
('Pork, lean (raw)',            '130g',        143, 30, 0, 2, 'protein', '{}',       'lean_protein',  50),
('Basa fillet (raw)',           '190g',        150, 30, 0, 3, 'protein', '{}',       'lean_protein',  60),
('Egg whites',                  '300g',        156, 33, 2, 1, 'protein', '{}',       'lean_protein',  70),

-- ─── PROTEIN + FAT (~30g protein + ~8g fat, ~190-200cal — uses 1P + 1F serve) ──
('Beef mince, 5% fat (raw)',    '145g',        187, 30, 1, 7, 'protein', '{"fat"}',  'lean_protein',  80),
('Barramundi fillet (raw)',     '155g',        194, 30, 0, 8, 'protein', '{"fat"}',  'lean_protein',  90),
('Chicken thigh (raw)',         '165g',        195, 30, 0, 8, 'protein', '{"fat"}',  'lean_protein', 100),
('Salmon fillet (raw)',         '150g',        200, 30, 0, 9, 'protein', '{"fat"}',  'lean_protein', 110),
('Whole egg',                   '2 large',     155, 13, 1,11, 'protein', '{"fat"}',  'lean_protein', 120),

-- ─── PLANT-BASED PROTEIN (~15-21g protein, ~200cal) ─────────────────────────
('Tempeh (raw)',                '100g',        193, 19, 9,11, 'protein', '{"fat"}',  'plant_protein', 10),
('Tofu, firm',                 '250g',        206, 21, 6,12, 'protein', '{"fat"}',  'plant_protein', 20),
('Chickpeas (canned)',          '140g',        204, 11,31, 5, 'protein', '{"carb"}', 'plant_protein', 30),
('Edamame beans',               '150g',        200, 16,18, 6, 'protein', '{"carb"}', 'plant_protein', 40),
('Brown lentils',               '170g',        197, 20,22, 1, 'protein', '{"carb"}', 'plant_protein', 50),

-- ─── CARBS (~20g carbs, ~100cal) ─────────────────────────────────────────────
('Jasmine rice (raw)',          '25g / 65g cooked',   91,  2,20, 0, 'carb', '{}', 'grain', 10),
('Brown rice (raw)',            '25g / 65g cooked',   89,  2,19, 1, 'carb', '{}', 'grain', 20),
('Spaghetti pasta (raw)',       '30g / 70g cooked',  110,  4,22, 1, 'carb', '{}', 'grain', 30),
('Quinoa (raw)',                '30g / 80g cooked',   93,  4,17, 2, 'carb', '{}', 'grain', 40),
('Couscous (raw)',              '30g / 80g cooked',  108,  4,23, 0, 'carb', '{}', 'grain', 50),
('Sweet potato (raw)',          '150g',               105,  3,21, 0, 'carb', '{}', 'starchy_veg', 60),
('White potato, peeled (raw)',  '180g',               119,  4,20, 0, 'carb', '{}', 'starchy_veg', 70),
('Butternut pumpkin (raw)',     '300g',               123,  6,21, 2, 'carb', '{}', 'starchy_veg', 80),
('Sourdough bread',             '45g',                112,  4,20, 1, 'carb', '{}', 'bread', 90),
('Rolled oats',                 '30g',                114,  4,17, 3, 'carb', '{}', 'grain', 100),
('Cocoa crunch cereal',         '25g',                 92,  2,17, 1, 'carb', '{}', 'cereal', 110),
('Sultana bran',                '25g',                 83,  2,16, 0, 'carb', '{}', 'cereal', 120),
('Weetbix',                     '2 biscuits',         118,  4,22, 0, 'carb', '{}', 'cereal', 130),
('Granola',                     '25g',                112,  2,16, 4, 'carb', '{"fat"}', 'cereal', 140),
('Hokkien noodles',             '90g',                104,  4,20, 1, 'carb', '{}', 'grain', 150),

-- ─── FRUIT (~20g carbs, ~100cal) ─────────────────────────────────────────────
('Apple, pink lady',            '155g',                90,  0,20,  0, 'fruit', '{}', null, 10),
('Apple, granny smith',         '185g',                89,  1,20,  0, 'fruit', '{}', null, 20),
('Orange (peeled)',             '245g',               103,  2,20,  0, 'fruit', '{}', null, 30),
('Banana (peeled)',             '100g',                94,  1,20,  0, 'fruit', '{}', null, 40),
('Pear (unpeeled)',             '130g',                86,  1,20,  0, 'fruit', '{}', null, 50),
('Pineapple (peeled)',          '245g',               104,  2,20,  1, 'fruit', '{}', null, 60),
('Strawberries',                '500g',               130,  4,20,  1, 'fruit', '{}', null, 70),
('Raspberries',                 '295g',               143,  3,20,  1, 'fruit', '{}', null, 80),
('Rockmelon (peeled)',          '425g',               101,  2,20,  0, 'fruit', '{}', null, 90),
('Watermelon (peeled)',         '275g',                87,  2,20,  0, 'fruit', '{}', null,100),
('Mango (peeled)',              '150g',                85,  1,20,  0, 'fruit', '{}', null,110),
('Kiwifruit (peeled)',          '180g',               105,  2,20,  1, 'fruit', '{}', null,120),
('Grapes',                      '130g',                86,  1,20,  0, 'fruit', '{}', null,130),
('Mandarin (peeled)',           '200g',                93,  2,20,  0, 'fruit', '{}', null,140),
('Peach (unpeeled)',            '255g',               102,  2,20,  0, 'fruit', '{}', null,150),

-- ─── FATS (~10g fat, ~100cal) ────────────────────────────────────────────────
('Extra virgin olive oil',      '10g',                 88,  0, 0, 10, 'fat', '{}', null, 10),
('Coconut milk tin',            '60ml',                91,  1, 2,  8, 'fat', '{}', null, 20),
('Macadamia nuts',              '15g',                110,  1, 1, 11, 'fat', '{}', null, 30),
('Coconut milk, reduced fat',   '140ml',               99,  1, 1, 10, 'fat', '{}', null, 40),
('Desiccated coconut',          '15g',                101,  1, 1, 10, 'fat', '{}', null, 50),
('Walnuts (raw)',                '15g',                104,  2, 0, 10, 'fat', '{}', null, 60),
('Avocado (Hass, raw)',         '75g',                 95,  1, 0, 10, 'fat', '{}', null, 70),
('Brie cheese',                 '30g',                 84,  5, 0,  5, 'fat', '{}', null, 80),
('Almonds',                     '20g',                114,  4, 1, 10, 'fat', '{}', null, 90),
('Sunflower seeds',             '20g',                118,  5, 0, 10, 'fat', '{}', null,100),
('Pumpkin seeds',               '20g',                108,  6, 0,  9, 'fat', '{}', null,110),
('Linseed / flaxseed',          '20g',                 99,  3, 0,  8, 'fat', '{}', null,120),
('Peanut butter',               '20g',                116,  5, 3, 10, 'fat', '{}', null,130),
('Tasty cheese cubes',          '20g (6 cubes)',        79,  5, 0,  7, 'fat', '{}', null,140),
('Pesto',                       '30g',                 96,  3, 1,  9, 'fat', '{}', null,150),

-- ─── CONDIMENTS (~100cal = 1 fat OR 1 carb serve) ────────────────────────────
('Garlic aioli (Praise)',        '16g',   99,  0, 1,11, 'condiment', '{}', 'condiment_fat',  10),
('Garlic aioli (Nandos)',        '30ml', 100,  0, 4, 9, 'condiment', '{}', 'condiment_fat',  20),
('Creamy mayo (Praise)',         '15g',   98,  1, 1, 9, 'condiment', '{}', 'condiment_fat',  30),
('Fat-free mayo (Praise)',       '85g',  102,  0,23, 1, 'condiment', '{}', 'condiment_carb', 40),
('Tomato sauce',                 '80g',   97,  1,21, 0, 'condiment', '{}', 'condiment_carb', 50),
('BBQ sauce (reduced)',          '60ml', 104,  0,24, 0, 'condiment', '{}', 'condiment_carb', 60),
('Ranch dressing (Praise)',      '30ml', 101,  2, 4, 9, 'condiment', '{}', 'condiment_fat',  70),
('Fat-free Caesar (Praise)',     '85ml', 101,  0,23, 1, 'condiment', '{}', 'condiment_carb', 80),
('Creamy Caesar (Paul Newman)',  '27ml',  98,  1, 2,10, 'condiment', '{}', 'condiment_fat',  90),
('Balsamic dressing (Praise)',   '50ml', 103,  0, 8, 8, 'condiment', '{}', 'condiment_fat', 100),
('Kewpie mayonnaise',           '14g',  100,  0, 0,10, 'condiment', '{}', 'condiment_fat', 110),
('Kewpie mayo 50% reduced fat', '25g',  103,  2, 3,10, 'condiment', '{}', 'condiment_fat', 120),
('Japanese ginger sesame dressing','50ml', 97, 2,12, 6, 'condiment', '{}', 'condiment_fat', 130),
('Sweet soy sauce (kecap manis)','32ml', 100,  0,24, 0, 'condiment', '{}', 'condiment_carb',140),
('Taco spice mix',               '33g',  101,  3,17, 2, 'condiment', '{}', 'condiment_carb',150),
('Smoky BBQ rub',                '33g',   99,  2,17, 2, 'condiment', '{}', 'condiment_carb',160),
('American mustard',             '90g',   99,  5,12, 5, 'condiment', '{}', 'condiment_fat', 170),

-- ─── FREE CONDIMENTS (~0-11cal) ──────────────────────────────────────────────
('Vegemite',                '3g',   5, 1, 0, 0, 'free', '{}', 'free_condiment', 10),
('Lemon juice (fresh)',     '10ml', 4, 0, 0, 0, 'free', '{}', 'free_condiment', 20),
('Cinnamon',                '1 tsp',6, 0, 2, 0, 'free', '{}', 'free_condiment', 30),
('Apple cider vinegar',     '15g', 11, 0, 3, 0, 'free', '{}', 'free_condiment', 40),
('Wholegrain mustard',      '5g',   9, 0, 1, 1, 'free', '{}', 'free_condiment', 50),
('Chunky salsa',            '20g',  8, 0, 2, 0, 'free', '{}', 'free_condiment', 60),
('Soy sauce (light)',      '15ml',  7, 1, 1, 0, 'free', '{}', 'free_condiment', 70),
('White wine vinegar',      '15ml', 3, 0, 0, 0, 'free', '{}', 'free_condiment', 80),
('Hot sauce / Tabasco',     '5ml',  1, 0, 0, 0, 'free', '{}', 'free_condiment', 90),
('Fresh herbs (mixed)',     'handful', 5, 0, 1, 0, 'free', '{}', 'free_condiment',100),
('Garlic (raw)',            '1 clove', 4, 0, 1, 0, 'free', '{}', 'free_condiment',110),
('Ginger (raw)',            '5g',   3, 0, 1, 0, 'free', '{}', 'free_condiment',120);
