# 🛠️ GUÍA PARA EDITAR RUTAS DE ATLÁNTIDA

## 📍 Formato de Coordenadas
- Usar SIEMPRE puntos (.) para decimales: `-55.762658`
- NUNCA usar comas (,) para decimales: `-55,762658` ❌
- Formato: `[longitud, latitud]`

## 🗺️ Cómo Obtener Coordenadas Precisas

1. **Usar la funcionalidad del mapa**: Haz clic izquierdo en cualquier punto del mapa en http://localhost:8000/territorio.html?id=atlantida
2. **Google Maps**: Clic derecho → "¿Qué hay aquí?" → Copiar coordenadas
3. **OpenStreetMap**: Clic derecho → Mostrar dirección

## 📝 Editar Rutas - Archivo: territorios/atlantida/rutas.json

### Estructura actual:
```json
"1_2": [
  [-55.762658, -34.770592],    // Punto inicial
  [-55.762100, -34.771200],    // Punto intermedio
  [-55.761500, -34.772000],    // Punto intermedio
  [-55.760383, -34.773202]     // Punto final
]
```

### Para ajustar una ruta:
1. Abre: `territorios/atlantida/rutas.json`
2. Encuentra la ruta (ej: "1_2", "7_8", etc.)
3. Modifica/agrega coordenadas siguiendo las calles
4. Guarda el archivo

## 🚀 Subir Cambios

```bash
git add territorios/atlantida/rutas.json
git commit -m "fix: Ajustar trazado de rutas en Atlántida"
git push origin main
```

## 🎯 POIs Actuales (orden de recorrido):
1. poi_1: Plaza de la Madre (inicio)
2. poi_2: Plaza [algo] 
3. poi_3: Plaza Artigas
4. poi_4: Plaza Varela
5. poi_9: Plaza Montevideo
6. poi_7: Plaza El Jardín de Alondra
7. poi_8: Parque Azul
8. poi_10: Casino de Atlántida (final)

## 📍 Coordenadas de Referencia:
- poi_1: [-55.762658, -34.770592]
- poi_2: [-55.760383, -34.773202]  
- poi_3: [-55.761412, -34.773836]
- poi_4: [-55.760509, -34.774842]
- poi_9: [-55.759994, -34.772086]
- poi_7: [-55.7500, -34.7720]
- poi_8: [-55.75264939021698, -34.77627192296242]
- poi_10: [-55.762671906350626, -34.77319474014669]