-- Script simple para borrar todos los manuales usando CASCADE
-- ADVERTENCIA: Esto borrará TODOS los manuales y no se puede deshacer

-- Si tienes configurado ON DELETE CASCADE en las claves foráneas,
-- este comando borrará automáticamente todos los datos relacionados
DELETE FROM manuals;

-- Si no tienes CASCADE configurado, usa el script delete_all_manuals.sql

-- Verificar que todo esté borrado
SELECT 
    'Manuales' as tabla, COUNT(*) as cantidad FROM manuals
UNION ALL
SELECT 
    'Secciones' as tabla, COUNT(*) as cantidad FROM sections
UNION ALL
SELECT 
    'Subsecciones' as tabla, COUNT(*) as cantidad FROM subsections
UNION ALL
SELECT 
    'Bloques' as tabla, COUNT(*) as cantidad FROM blocks;
