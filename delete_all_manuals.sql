-- Script para borrar todos los manuales y sus datos relacionados
-- ADVERTENCIA: Esto borrará TODOS los manuales y no se puede deshacer

-- Desactivar restricciones de clave foránea temporalmente (opcional)
-- SET session_replication_role = replica;

-- Borrar en orden para respetar las claves foráneas
-- Primero los bloques (dependen de subsecciones)
DELETE FROM blocks;

-- Luego las subsecciones (dependen de secciones)
DELETE FROM subsections;

-- Luego las secciones (dependen de manuales)
DELETE FROM sections;

-- Finalmente los manuales
DELETE FROM manuals;

-- Reactivar restricciones (si las desactivaste)
-- SET session_replication_role = DEFAULT;

-- Reiniciar secuencias (opcional, para que los IDs vuelvan a empezar desde 1)
-- ALTER SEQUENCE manuals_id_seq RESTART WITH 1;
-- ALTER SEQUENCE sections_id_seq RESTART WITH 1;
-- ALTER SEQUENCE subsections_id_seq RESTART WITH 1;
-- ALTER SEQUENCE blocks_id_seq RESTART WITH 1;

-- Verificar que todo esté borrado
SELECT 'Manuales restantes:' as tabla, COUNT(*) as cantidad FROM manuals
UNION ALL
SELECT 'Secciones restantes:' as tabla, COUNT(*) as cantidad FROM sections
UNION ALL
SELECT 'Subsecciones restantes:' as tabla, COUNT(*) as cantidad FROM subsections
UNION ALL
SELECT 'Bloques restantes:' as tabla, COUNT(*) as cantidad FROM blocks;
