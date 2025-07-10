-- Script para borrar manuales duplicados (mismo título)
-- Esto mantendrá solo el manual más reciente de cada título

-- Ver los manuales duplicados primero
SELECT title, COUNT(*) as cantidad, string_agg(id::text, ', ') as ids
FROM manuals 
GROUP BY title 
HAVING COUNT(*) > 1;

-- Borrar manuales duplicados, manteniendo el más reciente (ID más alto)
-- ADVERTENCIA: Esto borrará los duplicados, ajusta según tus necesidades

WITH duplicated_manuals AS (
    SELECT id, title,
           ROW_NUMBER() OVER (PARTITION BY title ORDER BY id DESC) as rn
    FROM manuals
),
manuals_to_delete AS (
    SELECT id FROM duplicated_manuals WHERE rn > 1
)
-- Primero borrar bloques de manuales duplicados
DELETE FROM blocks 
WHERE subsection_id IN (
    SELECT s.id FROM subsections s
    JOIN sections sec ON s.section_id = sec.id
    JOIN manuals_to_delete mtd ON sec.manual_id = mtd.id
);

-- Borrar subsecciones de manuales duplicados
DELETE FROM subsections 
WHERE section_id IN (
    SELECT sec.id FROM sections sec
    JOIN manuals_to_delete mtd ON sec.manual_id = mtd.id
);

-- Borrar secciones de manuales duplicados
DELETE FROM sections 
WHERE manual_id IN (SELECT id FROM manuals_to_delete);

-- Finalmente borrar los manuales duplicados
DELETE FROM manuals 
WHERE id IN (SELECT id FROM manuals_to_delete);

-- Verificar resultado
SELECT title, COUNT(*) as cantidad
FROM manuals 
GROUP BY title 
ORDER BY title;
