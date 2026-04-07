-- ================================================================
-- PODBAY — Adiciona coluna descricao ao catalogo
-- Execute no MySQL: source c:/podbay/scripts/add_descricao.sql
-- ================================================================

USE podbay_db;
SET NAMES utf8mb4;

ALTER TABLE catalogo ADD COLUMN descricao VARCHAR(120) NULL AFTER sabor;

-- ========================
-- IGNITE V155
-- ========================
UPDATE catalogo SET descricao = 'Uva com refrescancia de gelo' WHERE marca = 'IGNITE' AND sabor = 'Grape Ice' AND tamanho = 'V155';
UPDATE catalogo SET descricao = 'Abacaxi tropical com gelo intenso' WHERE marca = 'IGNITE' AND sabor = 'Pineapple Ice' AND tamanho = 'V155';
UPDATE catalogo SET descricao = 'Mix tropical de kiwi, maracuja e goiaba' WHERE marca = 'IGNITE' AND sabor = 'Kiwi Passion Fruit Guava' AND tamanho = 'V155';
UPDATE catalogo SET descricao = 'Acai com toque tropical e suave' WHERE marca = 'IGNITE' AND sabor = 'Tropical Açaí' AND tamanho = 'V155';
UPDATE catalogo SET descricao = 'Melancia suculenta com sensacao gelada' WHERE marca = 'IGNITE' AND sabor = 'Watermelon Ice' AND tamanho = 'V155';
UPDATE catalogo SET descricao = 'Morango e melancia com final gelado' WHERE marca = 'IGNITE' AND sabor = 'Stramberry Watermelon Ice' AND tamanho = 'V155';
UPDATE catalogo SET descricao = 'Menta pura com refrescancia intensa' WHERE marca = 'IGNITE' AND sabor = 'Ice Mint' AND tamanho = 'V155';
UPDATE catalogo SET descricao = 'Morango maduro com toque de gelo' WHERE marca = 'IGNITE' AND sabor = 'Strawberry Ice' AND tamanho = 'V155';

-- ========================
-- IGNITE V300 ULTRA SLIM
-- ========================
UPDATE catalogo SET descricao = 'Melao suave com menta fresca' WHERE marca = 'IGNITE' AND sabor = 'Minty Melon' AND tamanho = 'V300 ULTRA SLIM';
UPDATE catalogo SET descricao = 'Abacaxi tropical com gelo intenso' WHERE marca = 'IGNITE' AND sabor = 'Pineapple Ice' AND tamanho = 'V300 ULTRA SLIM';

-- ========================
-- IGNITE V400 ICE
-- ========================
UPDATE catalogo SET descricao = 'Morango e melancia em equilibrio perfeito' WHERE marca = 'IGNITE' AND sabor = 'Strawberry Watermelon' AND tamanho = 'V400 ICE';
UPDATE catalogo SET descricao = 'Uva delicada com floral de cerejeira' WHERE marca = 'IGNITE' AND sabor = 'Sakura Grape' AND tamanho = 'V400 ICE';
UPDATE catalogo SET descricao = 'Uva rica e encorpada' WHERE marca = 'IGNITE' AND sabor = 'Grape Mix' AND tamanho = 'V400 ICE';
UPDATE catalogo SET descricao = 'Melancia pura e suculenta' WHERE marca = 'IGNITE' AND sabor = 'Watermelon' AND tamanho = 'V400 ICE';
UPDATE catalogo SET descricao = 'Menta classica e refrescante' WHERE marca = 'IGNITE' AND sabor = 'Mint' AND tamanho = 'V400 ICE';

-- ========================
-- IGNITE V400 MIX
-- ========================
UPDATE catalogo SET descricao = 'Maracuja azedo com kiwi e abacaxi — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Passion Fruit Sour Kiwi / Pineapple';
UPDATE catalogo SET descricao = 'Menta gelada e pessego com uva — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Ice Mint / Peach Grape';
UPDATE catalogo SET descricao = 'Melancia e uva, ambas geladas — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Watermelon Ice / Grape Ice';
UPDATE catalogo SET descricao = 'Uva refrescante e pessego gelado — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Grape Pop / Peach Ice';
UPDATE catalogo SET descricao = 'Abacaxi, manga gelada e morango — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Pineapple Mango Ice / Strawberry';
UPDATE catalogo SET descricao = 'Cereja e melancia com gelo — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Cherry Ice / Watermelon Ice';
UPDATE catalogo SET descricao = 'Pessego, melancia e manga gelada — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Peach Watermelon Ice / Mango Ice';
UPDATE catalogo SET descricao = 'Morango, melancia e maca gelada — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Stramberry Watermelon Ice / Apple';
UPDATE catalogo SET descricao = 'Banana e morango, ambos gelados — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Banana Ice / Strawberry Ice';
UPDATE catalogo SET descricao = 'Mirtilo gelado e framboesa com amora — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Blueberry Ice / Raspberry Blackberry';
UPDATE catalogo SET descricao = 'Uva gelada e morango fresco — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Grape Ice / Strawberry';
UPDATE catalogo SET descricao = 'Acai gelado e melancia com uva — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Açaí Ice / Watermelon Grape Ice';
UPDATE catalogo SET descricao = 'Aloe vera com uva e morango com melancia — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Aloe Grape / Strawberry Watermelon';
UPDATE catalogo SET descricao = 'Morango e laranja, ambos gelados — dois pods' WHERE marca = 'IGNITE' AND sabor = 'Strawberry Ice / Orange Ice';

-- ========================
-- IGNITE V400 SWEET
-- ========================
UPDATE catalogo SET descricao = 'Uva adocicada com toque gelado' WHERE marca = 'IGNITE' AND sabor = 'Grape Ice' AND tamanho = 'V400 SWEET';
UPDATE catalogo SET descricao = 'Melancia doce com final gelado' WHERE marca = 'IGNITE' AND sabor = 'Watermelon Ice' AND tamanho = 'V400 SWEET';
UPDATE catalogo SET descricao = 'Tres camadas de manga madura e suculenta' WHERE marca = 'IGNITE' AND sabor = 'Triple Mango';
UPDATE catalogo SET descricao = 'Abacaxi doce com refrescancia de gelo' WHERE marca = 'IGNITE' AND sabor = 'Pineapple Ice' AND tamanho = 'V400 SWEET';
UPDATE catalogo SET descricao = 'Pessego com mix de frutas vermelhas geladas' WHERE marca = 'IGNITE' AND sabor = 'Peach Berry Ice';

-- ========================
-- ELF 15K
-- ========================
UPDATE catalogo SET descricao = 'Morango cremoso sabor sorvete' WHERE marca = 'ELF' AND sabor = 'Strawberry Ice Cream';
UPDATE catalogo SET descricao = 'Uva tipo chiclete com toque suave' WHERE marca = 'ELF' AND sabor = 'Buballo Grape';
UPDATE catalogo SET descricao = 'Morango e melancia sem gelo' WHERE marca = 'ELF' AND sabor = 'Strawberry Watermelon' AND tamanho = '15K';
UPDATE catalogo SET descricao = 'Maca verde azeda e gelada' WHERE marca = 'ELF' AND sabor = 'Sour Apple Ice';
UPDATE catalogo SET descricao = 'Abacaxi tropical com gelo' WHERE marca = 'ELF' AND sabor = 'Pineapple Ice' AND tamanho = '15K';
UPDATE catalogo SET descricao = 'Framboesa azul intensa e gelada' WHERE marca = 'ELF' AND sabor = 'Blue Razz Ice' AND tamanho = '15K';
UPDATE catalogo SET descricao = 'Picole tropical estilo havaiano' WHERE marca = 'ELF' AND sabor = 'Hawaiian Popsicle';

-- ========================
-- ELFBAR 30K
-- ========================
UPDATE catalogo SET descricao = 'Menta suave com frescor tropical' WHERE marca = 'ELFBAR' AND sabor = 'Miami Mint';
UPDATE catalogo SET descricao = 'Hortela pura e refrescante' WHERE marca = 'ELFBAR' AND sabor = 'Spearmint';
UPDATE catalogo SET descricao = 'Mirtilo com framboesa azeda' WHERE marca = 'ELFBAR' AND sabor = 'Blueberry Sour Raspberry';
UPDATE catalogo SET descricao = 'Maca verde acida com gelo' WHERE marca = 'ELFBAR' AND sabor = 'Green Apple Ice' AND tamanho = '30K';
UPDATE catalogo SET descricao = 'Fruta do dragao com morango e banana' WHERE marca = 'ELFBAR' AND sabor = 'Dragon Strawnana';
UPDATE catalogo SET descricao = 'Acai com banana e gelo suave' WHERE marca = 'ELFBAR' AND sabor = 'Açaí Banana Ice';
UPDATE catalogo SET descricao = 'Morango e melancia gelados' WHERE marca = 'ELFBAR' AND sabor = 'Strawberry Watermelon Ice' AND tamanho = '30K';
UPDATE catalogo SET descricao = 'Melancia refrescante com gelo' WHERE marca = 'ELFBAR' AND sabor = 'Watermelon Ice' AND tamanho = '30K';
UPDATE catalogo SET descricao = 'Morango fresco com toque gelado' WHERE marca = 'ELFBAR' AND sabor = 'Strawberry Ice' AND tamanho = '30K';
UPDATE catalogo SET descricao = 'Morango, melancia e pessego em trio' WHERE marca = 'ELFBAR' AND sabor = 'Strawmelon Peach';

-- ========================
-- ELFBAR 33K
-- ========================
UPDATE catalogo SET descricao = 'Uva encorpada e gelada' WHERE marca = 'ELFBAR' AND sabor = 'Grape Ice' AND tamanho = '33K';

-- ========================
-- ELFBAR 40K ICE KING
-- ========================
UPDATE catalogo SET descricao = 'Morango e melancia com gelo intenso' WHERE marca = 'ELFBAR' AND sabor = 'Strawberry Watermelon Ice' AND tamanho = '40K ICE KING';
UPDATE catalogo SET descricao = 'Frescor tropical de verao' WHERE marca = 'ELFBAR' AND sabor = 'Summer Splash';
UPDATE catalogo SET descricao = 'Morango e coco com toque exotico' WHERE marca = 'ELFBAR' AND sabor = 'Tigers Blood';
UPDATE catalogo SET descricao = 'Framboesa azul intensa e gelada' WHERE marca = 'ELFBAR' AND sabor = 'Blue Razz Ice' AND tamanho = '40K ICE KING';
UPDATE catalogo SET descricao = 'Cereja e morango em combinacao doce' WHERE marca = 'ELFBAR' AND sabor = 'Cherry Strazz';
UPDATE catalogo SET descricao = 'Morango classico com final gelado' WHERE marca = 'ELFBAR' AND sabor = 'Strawberry Ice' AND tamanho = '40K ICE KING';
UPDATE catalogo SET descricao = 'Frutas tropicais com frescor costeiro' WHERE marca = 'ELFBAR' AND sabor = 'Baja Splash';
UPDATE catalogo SET descricao = 'Morango azedo com fruta do dragao' WHERE marca = 'ELFBAR' AND sabor = 'Sour Strawberry Dragon Fruit';
UPDATE catalogo SET descricao = 'Melancia suculenta com gelo' WHERE marca = 'ELFBAR' AND sabor = 'Watermelon Ice' AND tamanho = '40K ICE KING';
UPDATE catalogo SET descricao = 'Mix de frutas silvestres intensas' WHERE marca = 'ELFBAR' AND sabor = 'Scary Berry';
UPDATE catalogo SET descricao = 'Maca verde acida com gelo' WHERE marca = 'ELFBAR' AND sabor = 'Green Apple Ice' AND tamanho = '40K ICE KING';
UPDATE catalogo SET descricao = 'Bala azeda com sabor marcante' WHERE marca = 'ELFBAR' AND sabor = 'Sour Lush Gummy';

-- ========================
-- BLACK SHEEP 40K
-- ========================
UPDATE catalogo SET descricao = 'Menta fresca e manga com laranja — dois pods' WHERE marca = 'BLACK SHEEP' AND sabor = 'Fresh Mint / Mango Orange';
UPDATE catalogo SET descricao = 'Uva com mentol classico — dois pods' WHERE marca = 'BLACK SHEEP' AND sabor = 'Grape / Menthol';
UPDATE catalogo SET descricao = 'Uva e sabor energetico — dois pods' WHERE marca = 'BLACK SHEEP' AND sabor = 'Grape / Energy Drink';
UPDATE catalogo SET descricao = 'Maracuja e melancia com morango — dois pods' WHERE marca = 'BLACK SHEEP' AND sabor = 'Passion Fruit / Watermelon Strawberry';
UPDATE catalogo SET descricao = 'Uva com manga e menta fresca — dois pods' WHERE marca = 'BLACK SHEEP' AND sabor = 'Grape Mango / Fresh Mint';

-- ========================
-- BLACK SHEEP 40K ICE
-- ========================
UPDATE catalogo SET descricao = 'Kiwi, uva, carambola e acai com banana — dois pods' WHERE marca = 'BLACK SHEEP' AND sabor = 'Kiwi Grape Starfruit / Açaí Strawnana';
UPDATE catalogo SET descricao = 'Acai com morango e acai com uva gelados — dois pods' WHERE marca = 'BLACK SHEEP' AND sabor = 'Açaí Strawberry / Açaí Grape';
UPDATE catalogo SET descricao = 'Uva dupla com intensidade maxima — dois pods' WHERE marca = 'BLACK SHEEP' AND sabor = 'Grape / Grape';

-- ========================
-- OXBAR 30K
-- ========================
UPDATE catalogo SET descricao = 'Uva roxa intensa e encorpada' WHERE marca = 'OXBAR' AND sabor = 'Grand Purple';
UPDATE catalogo SET descricao = 'Uva suave com toque tropical' WHERE marca = 'OXBAR' AND sabor = 'Paradise Grape';
UPDATE catalogo SET descricao = 'Blend exclusivo e refrescante da Oxbar' WHERE marca = 'OXBAR' AND sabor = 'Ox Lover';
UPDATE catalogo SET descricao = 'Framboesa com melancia' WHERE marca = 'OXBAR' AND sabor = 'Raspberry Watermelon';
UPDATE catalogo SET descricao = 'Morango com sabor de refrigerante' WHERE marca = 'OXBAR' AND sabor = 'Fanta Strawberry';
UPDATE catalogo SET descricao = 'Morango e melancia equilibrados' WHERE marca = 'OXBAR' AND sabor = 'Strawberry Watermelon' AND tamanho = '30K';
UPDATE catalogo SET descricao = 'Frutas vermelhas mistas com gelo' WHERE marca = 'OXBAR' AND sabor = 'Red Ice';

-- ========================
-- OXBAR 50K
-- ========================
UPDATE catalogo SET descricao = 'Abacaxi tropical e gelado' WHERE marca = 'OXBAR' AND sabor = 'Pineapple Ice' AND tamanho = '50K';
UPDATE catalogo SET descricao = 'Uva intensa com refrescancia de gelo' WHERE marca = 'OXBAR' AND sabor = 'Grape Ice' AND tamanho = '50K';
UPDATE catalogo SET descricao = 'Morango e uva sem gelo' WHERE marca = 'OXBAR' AND sabor = 'Strawberry Grape';
UPDATE catalogo SET descricao = 'Melancia suculenta com gelo' WHERE marca = 'OXBAR' AND sabor = 'Watermelon Ice' AND tamanho = '50K';
UPDATE catalogo SET descricao = 'Abacaxi, kiwi e fruta do dragao' WHERE marca = 'OXBAR' AND sabor = 'Pineapple Kiwi Dragonfruit';
UPDATE catalogo SET descricao = 'Menta intensa com gelo puro' WHERE marca = 'OXBAR' AND sabor = 'Icy Mint';
UPDATE catalogo SET descricao = 'Morango e kiwi em equilibrio' WHERE marca = 'OXBAR' AND sabor = 'Strawberry Kiwi';

-- ========================
-- LOST MARY 20K
-- ========================
UPDATE catalogo SET descricao = 'Limao com toranja citrica e fresca' WHERE marca = 'LOST MARY' AND sabor = 'Lime Grapefruit';
UPDATE catalogo SET descricao = 'Manga tropical com toque unico' WHERE marca = 'LOST MARY' AND sabor = 'Mango Twist';
UPDATE catalogo SET descricao = 'Menta pura com sensacao gelada' WHERE marca = 'LOST MARY' AND sabor = 'Ice Mint';

-- ========================
-- LOST MIXER 30K
-- ========================
UPDATE catalogo SET descricao = 'Manga tropical e morango gelado — dois pods' WHERE marca = 'LOST MIXER' AND sabor = 'Mango / Strawberry Ice';
UPDATE catalogo SET descricao = 'Aloe vera com uva e maca azeda — dois pods' WHERE marca = 'LOST MIXER' AND sabor = 'Aloe Grape / Sour Apple';
UPDATE catalogo SET descricao = 'Mirtilo e framboesa frescos — dois pods' WHERE marca = 'LOST MIXER' AND sabor = 'Blueberry / Raspberry';
UPDATE catalogo SET descricao = 'Framboesa e abacaxi tropical — dois pods' WHERE marca = 'LOST MIXER' AND sabor = 'Raspberry / Pineapple';
UPDATE catalogo SET descricao = 'Laranja e morango em par classico — dois pods' WHERE marca = 'LOST MIXER' AND sabor = 'Orange / Strawberry';
UPDATE catalogo SET descricao = 'Maca e uva, combinacao classica — dois pods' WHERE marca = 'LOST MIXER' AND sabor = 'Apple / Grape';
UPDATE catalogo SET descricao = 'Melancia doce e melancia gelada — dois pods' WHERE marca = 'LOST MIXER' AND sabor = 'Sweet Watermelon / Watermelon Ice';

SELECT CONCAT('Descricoes atualizadas: ', COUNT(*), ' produtos') AS resultado FROM catalogo WHERE descricao IS NOT NULL;
