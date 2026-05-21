-- Migración 012: Agregar categoría "Planes Personalizados" (id=4)
-- Necesaria porque crear_plan_personalizado hardcodea categoria_plan_id = 4

INSERT INTO categorias_planes (categoria_plan_id, nombre, descripcion, icono, orden)
VALUES (4, 'Planes Personalizados', 'Planes creados por el usuario a su medida', '✨', 4)
ON CONFLICT (categoria_plan_id) DO NOTHING;
