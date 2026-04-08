-- =============================================================
-- PODBAY — Seed do catálogo de produtos
-- Execute dentro do MySQL após: SET NAMES utf8mb4;
-- =============================================================

USE podbay_db;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

ALTER TABLE catalogo MODIFY COLUMN emoji VARCHAR(30) NULL;

DELETE FROM catalogo;
ALTER TABLE catalogo AUTO_INCREMENT = 1;

INSERT INTO catalogo (marca, sabor, tamanho, valor, estoque, emoji, categoria) VALUES
-- IGNITE V155
('IGNITE','Grape Ice','V155',85.00,20,'🍇❄️','pods'),
('IGNITE','Pineapple Ice','V155',85.00,20,'🍍❄️','pods'),
('IGNITE','Kiwi Passion Fruit Guava','V155',85.00,20,'🥝🌺','pods'),
('IGNITE','Tropical Açaí','V155',85.00,20,'🌴🫐','pods'),
('IGNITE','Watermelon Ice','V155',85.00,20,'🍉❄️','pods'),
('IGNITE','Stramberry Watermelon Ice','V155',85.00,20,'🍓🍉❄️','pods'),
('IGNITE','Ice Mint','V155',85.00,20,'🌿❄️','pods'),
('IGNITE','Strawberry Ice','V155',85.00,20,'🍓❄️','pods'),
-- IGNITE V300 ULTRA SLIM
('IGNITE','Minty Melon','V300 ULTRA SLIM',100.00,20,'🌿🍈','pods'),
('IGNITE','Pineapple Ice','V300 ULTRA SLIM',100.00,20,'🍍❄️','pods'),
-- IGNITE V400 ICE
('IGNITE','Strawberry Watermelon','V400 ICE',100.00,20,'🍓🍉','pods'),
('IGNITE','Sakura Grape','V400 ICE',100.00,20,'🌸🍇','pods'),
('IGNITE','Grape Mix','V400 ICE',100.00,20,'🍇','pods'),
('IGNITE','Watermelon','V400 ICE',100.00,20,'🍉','pods'),
('IGNITE','Mint','V400 ICE',100.00,20,'🌿','pods'),
-- IGNITE V400 MIX
('IGNITE','Passion Fruit Sour Kiwi / Pineapple','V400 MIX',105.00,20,'🌺😝🥝🍍','pods'),
('IGNITE','Ice Mint / Peach Grape','V400 MIX',105.00,20,'🌿🍑🍇❄️','pods'),
('IGNITE','Watermelon Ice / Grape Ice','V400 MIX',105.00,20,'🍉🍇❄️','pods'),
('IGNITE','Grape Pop / Peach Ice','V400 MIX',105.00,20,'🍇🍑❄️','pods'),
('IGNITE','Pineapple Mango Ice / Strawberry','V400 MIX',105.00,20,'🍍🥭🍓❄️','pods'),
('IGNITE','Cherry Ice / Watermelon Ice','V400 MIX',105.00,20,'🍒🍉❄️','pods'),
('IGNITE','Peach Watermelon Ice / Mango Ice','V400 MIX',105.00,20,'🍑🍉🥭❄️','pods'),
('IGNITE','Stramberry Watermelon Ice / Apple','V400 MIX',105.00,20,'🍓🍉🍎❄️','pods'),
('IGNITE','Banana Ice / Strawberry Ice','V400 MIX',105.00,20,'🍌🍓❄️','pods'),
('IGNITE','Blueberry Ice / Raspberry Blackberry','V400 MIX',105.00,20,'🫐🫐❄️','pods'),
('IGNITE','Grape Ice / Strawberry','V400 MIX',105.00,20,'🍇🍓❄️','pods'),
('IGNITE','Açaí Ice / Watermelon Grape Ice','V400 MIX',105.00,20,'🫐🍉🍇❄️','pods'),
('IGNITE','Aloe Grape / Strawberry Watermelon','V400 MIX',105.00,20,'🍇🍓🍉','pods'),
('IGNITE','Strawberry Ice / Orange Ice','V400 MIX',105.00,20,'🍓🍊❄️','pods'),
-- IGNITE V400 SWEET
('IGNITE','Grape Ice','V400 SWEET',100.00,20,'🍇❄️','pods'),
('IGNITE','Watermelon Ice','V400 SWEET',100.00,20,'🍉❄️','pods'),
('IGNITE','Triple Mango','V400 SWEET',100.00,20,'🥭🥭🥭','pods'),
('IGNITE','Pineapple Ice','V400 SWEET',100.00,20,'🍍❄️','pods'),
('IGNITE','Peach Berry Ice','V400 SWEET',100.00,20,'🍑🫐❄️','pods'),
-- ELF 15K
('ELF','Strawberry Ice Cream','15K',70.00,20,'🍓🍦','pods'),
('ELF','Buballo Grape','15K',70.00,20,'🍇','pods'),
('ELF','Strawberry Watermelon','15K',70.00,20,'🍓🍉','pods'),
('ELF','Sour Apple Ice','15K',70.00,20,'😝🍎❄️','pods'),
('ELF','Pineapple Ice','15K',70.00,20,'🍍❄️','pods'),
('ELF','Blue Razz Ice','15K',70.00,20,'🫐❄️','pods'),
('ELF','Hawaiian Popsicle','15K',70.00,20,'🌺🍦','pods'),
-- ELFBAR 30K
('ELFBAR','Miami Mint','30K',85.00,20,'🌿','pods'),
('ELFBAR','Spearmint','30K',85.00,20,'🌿','pods'),
('ELFBAR','Blueberry Sour Raspberry','30K',85.00,20,'😝🫐🫐','pods'),
('ELFBAR','Green Apple Ice','30K',85.00,20,'🍎❄️','pods'),
('ELFBAR','Dragon Strawnana','30K',85.00,20,'🐉🍓🍌','pods'),
('ELFBAR','Açaí Banana Ice','30K',85.00,20,'🫐🍌❄️','pods'),
('ELFBAR','Strawberry Watermelon Ice','30K',85.00,20,'🍓🍉❄️','pods'),
('ELFBAR','Watermelon Ice','30K',85.00,20,'🍉❄️','pods'),
('ELFBAR','Strawberry Ice','30K',85.00,20,'🍓❄️','pods'),
('ELFBAR','Strawmelon Peach','30K',85.00,20,'🍓🍉🍑','pods'),
-- ELFBAR 33K
('ELFBAR','Grape Ice','33K',100.00,20,'🍇❄️','pods'),
-- ELFBAR 40K ICE KING
('ELFBAR','Strawberry Watermelon Ice','40K ICE KING',100.00,20,'🍓🍉❄️','pods'),
('ELFBAR','Summer Splash','40K ICE KING',100.00,20,'🌊','pods'),
('ELFBAR','Tigers Blood','40K ICE KING',100.00,20,'🐯🩸','pods'),
('ELFBAR','Blue Razz Ice','40K ICE KING',100.00,20,'🫐❄️','pods'),
('ELFBAR','Cherry Strazz','40K ICE KING',100.00,20,'🍒🍓','pods'),
('ELFBAR','Strawberry Ice','40K ICE KING',100.00,20,'🍓❄️','pods'),
('ELFBAR','Baja Splash','40K ICE KING',100.00,20,'🌊','pods'),
('ELFBAR','Sour Strawberry Dragon Fruit','40K ICE KING',100.00,20,'😝🍓🐉','pods'),
('ELFBAR','Watermelon Ice','40K ICE KING',100.00,20,'🍉❄️','pods'),
('ELFBAR','Scary Berry','40K ICE KING',100.00,20,'👻🫐','pods'),
('ELFBAR','Green Apple Ice','40K ICE KING',100.00,20,'🍎❄️','pods'),
('ELFBAR','Sour Lush Gummy','40K ICE KING',100.00,20,'😝🍬','pods'),
-- BLACK SHEEP 40K
('BLACK SHEEP','Fresh Mint / Mango Orange','40K',110.00,20,'🌿🥭🍊','pods'),
('BLACK SHEEP','Grape / Menthol','40K',110.00,20,'🍇🌿','pods'),
('BLACK SHEEP','Grape / Energy Drink','40K',110.00,20,'🍇⚡','pods'),
('BLACK SHEEP','Passion Fruit / Watermelon Strawberry','40K',110.00,20,'🌺🍉🍓','pods'),
('BLACK SHEEP','Grape Mango / Fresh Mint','40K',110.00,20,'🍇🥭🌿','pods'),
-- BLACK SHEEP 40K ICE
('BLACK SHEEP','Kiwi Grape Starfruit / Açaí Strawnana','40K ICE',110.00,20,'🥝🍇🫐🍓','pods'),
('BLACK SHEEP','Açaí Strawberry / Açaí Grape','40K ICE',110.00,20,'🫐🍓🍇','pods'),
('BLACK SHEEP','Grape / Grape','40K ICE',110.00,20,'🍇🍇','pods'),
-- OXBAR 30K
('OXBAR','Grand Purple','30K',85.00,20,'🍇','pods'),
('OXBAR','Paradise Grape','30K',85.00,20,'🍇','pods'),
('OXBAR','Ox Lover','30K',85.00,20,'💨','pods'),
('OXBAR','Raspberry Watermelon','30K',85.00,20,'🫐🍉','pods'),
('OXBAR','Fanta Strawberry','30K',85.00,20,'🍓','pods'),
('OXBAR','Strawberry Watermelon','30K',85.00,20,'🍓🍉','pods'),
('OXBAR','Red Ice','30K',85.00,20,'🔴❄️','pods'),
-- OXBAR 50K
('OXBAR','Pineapple Ice','50K',105.00,20,'🍍❄️','pods'),
('OXBAR','Grape Ice','50K',105.00,20,'🍇❄️','pods'),
('OXBAR','Strawberry Grape','50K',105.00,20,'🍓🍇','pods'),
('OXBAR','Watermelon Ice','50K',105.00,20,'🍉❄️','pods'),
('OXBAR','Pineapple Kiwi Dragonfruit','50K',105.00,20,'🍍🥝🐉','pods'),
('OXBAR','Icy Mint','50K',105.00,20,'🌿❄️','pods'),
('OXBAR','Strawberry Kiwi','50K',105.00,20,'🍓🥝','pods'),
-- LOST MARY 20K
('LOST MARY','Lime Grapefruit','20K',75.00,20,'🍋🍊','pods'),
('LOST MARY','Mango Twist','20K',75.00,20,'🥭','pods'),
('LOST MARY','Ice Mint','20K',75.00,20,'🌿❄️','pods'),
-- LOST MIXER 30K
('LOST MIXER','Mango / Strawberry Ice','30K',90.00,20,'🥭🍓❄️','pods'),
('LOST MIXER','Aloe Grape / Sour Apple','30K',90.00,20,'😝🌿🍇🍎','pods'),
('LOST MIXER','Blueberry / Raspberry','30K',90.00,20,'🫐🫐','pods'),
('LOST MIXER','Raspberry / Pineapple','30K',90.00,20,'🫐🍍','pods'),
('LOST MIXER','Orange / Strawberry','30K',90.00,20,'🍊🍓','pods'),
('LOST MIXER','Apple / Grape','30K',90.00,20,'🍎🍇','pods'),
('LOST MIXER','Sweet Watermelon / Watermelon Ice','30K',90.00,20,'🍉🍉❄️','pods');

SELECT CONCAT('Total inserido: ', COUNT(*), ' produtos') AS resultado FROM catalogo;
