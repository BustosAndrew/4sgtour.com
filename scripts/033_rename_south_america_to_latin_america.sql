-- Rename "South America" continent to "Latin America" in all existing trips
UPDATE trips
SET continent = 'Latin America'
WHERE continent = 'South America';
