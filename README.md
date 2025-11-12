# Guía Virtual - Sistema Modular

Una aplicación web de navegación GPS que funciona como guía turístico virtual, ahora con arquitectura modular para soportar múltiples territorios.

## 🚀 Características Principales

- 🗺️ **Navegación GPS en tiempo real**: Utiliza la geolocalización del dispositivo para guiar al usuario
- 🎵 **Sistema de audio dual**: Voz masculina para descripciones, voz femenina para navegación
- 📱 **Responsive**: Funciona en móviles y computadoras
- 🎯 **POIs personalizables**: Iconos automáticos por categoría (plazas, clubes, hoteles)
- 🛣️ **Rutas realistas**: Siguen las calles reales entre puntos de interés
- 🎮 **Modo testing**: Navegación con teclado para probar en PC
- 🔧 **Arquitectura modular**: Fácil agregar nuevos territorios

## 🏗️ Estructura del Proyecto

```
AAguiavirtual/
├── index.html              # Página principal simplificada
├── css/
│   └── styles.css          # Estilos separados
├── js/
│   └── app.js              # Lógica principal modular
├── data/                   # Datos del territorio actual
│   ├── la-floresta-pois.json
│   └── la-floresta-rutas.json
├── territorios/            # Sistema para múltiples territorios
│   ├── config.json         # Configuración de territorios
│   └── ejemplo-futuro/     # Plantilla para nuevos territorios
└── assets/                 # Recursos multimedia
```

## 🎯 Territorios Disponibles

### 🌊 La Floresta (Activo)
- **Ubicación**: Canelones, Uruguay
- **Puntos**: 12 ubicaciones patrimoniales
- **Duración**: 45-60 minutos
- **Dificultad**: Fácil
- **Características**: Plazas históricas, ex-hotel icónico

## 🆕 Cómo Agregar un Nuevo Territorio

### 1. Crear Estructura de Archivos
```bash
mkdir territorios/mi-territorio
```

### 2. Definir Puntos de Interés
Crea `territorios/mi-territorio/pois.json`:
```json
{
  "territorio": {
    "nombre": "Mi Territorio",
    "centro": [-34.xxx, -55.xxx],
    "zoom": 16
  },
  "puntos": {
    "type": "FeatureCollection", 
    "features": [...]
  }
}
```

### 3. Configurar Rutas por Calles
Crea `territorios/mi-territorio/rutas.json`:
```json
{
  "territorio": "mi-territorio",
  "rutas": {
    "1_2": [coordenadas que siguen calles reales]
  }
}
```

### 4. Registrar en Configuración
Edita `territorios/config.json` para incluir el nuevo territorio.

## 🎵 Sistema de Audio

### Archivos de Audio
- Ubicación: `assets/audio/`
- Formato: MP3, 128kbps
- Duración: 30-90 segundos

### Fallback Automático
Si no hay archivo de audio, el sistema usa:
- 👨 **Voz masculina**: Descripciones de puntos
- 👩 **Voz femenina**: Instrucciones de navegación

## 🎨 Iconos por Categoría

- 🌳 **Plazas**: Verde, icono de árbol
- 👥 **Clubes**: Azul, icono de personas  
- 🛏️ **Hoteles**: Rojo, icono de cama
- 📍 **General**: Morado, marcador genérico

## 🎮 Modo Testing (PC)

1. Presiona **'T'** para activar
2. Usa **flechas ⬆️⬇️⬅️➡️** para moverte
3. Cada clic ≈ 5 metros
4. Perfecto para probar rutas sin salir de casa

## 🔧 Tecnologías

- **Leaflet.js 1.9.4**: Mapas interactivos
- **Font Awesome 6.0.0**: Iconos modernos
- **HTML5 APIs**: Geolocation, Web Speech
- **Arquitectura modular**: JavaScript ES6 Classes
- **GitHub Pages**: Hosting automático

## 🚀 Próximos Pasos

- [ ] Página selector de territorios
- [ ] Filtros por categoría de POIs
- [ ] Grupos temáticos personalizables
- [ ] Modo offline con cache
- [ ] Estadísticas de recorrido
- [ ] Compartir rutas personalizadas

## 🛠️ Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/ricardoguillermo/ricardoguillermo.github.io.git

# Probar localmente
# Abrir index.html en navegador
# Usar modo testing con 'T' + flechas

# Deploy automático
git add .
git commit -m "Agregar nuevo territorio"
git push origin main
```

## 🤝 Contribuciones

### Para Agregar Contenido:
1. Usa las plantillas en `territorios/ejemplo-futuro/`
2. Agrega coordenadas precisas con herramientas como Google Maps
3. Incluye descripciones atractivas y educativas
4. Testa con modo testing antes de publicar

### Para Desarrollo:
1. Fork del repositorio
2. Crea rama para tu feature
3. Implementa mejoras manteniendo la modularidad
4. Pull request con descripción detallada

## 📜 Licencia

MIT License - Libre uso y modificación

---

**🏛️ Preservando el patrimonio cultural a través de la tecnología**

*Desarrollado para promover el turismo cultural en Uruguay y expandible a cualquier territorio del mundo*