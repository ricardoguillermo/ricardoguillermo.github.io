/**
 * GUÍA VIRTUAL - SISTEMA MODULAR
 * Sistema de navegación GPS con guía de audio para tours virtuales
 * 
 * Estructura modular preparada para múltiples territorios y grupos de POIs
 */

class GuiaVirtual {
    constructor(territoryId = 'la-floresta', territoryData = null) {
        this.territoryId = territoryId;
        this.territoryData = territoryData;
        this.territorio = null;
        this.puntosInteres = null;
        this.rutasCalles = null;
        this.mapa = null;
        this.marcadoresLeaflet = {};
        this.marcadorUsuario = null;
        this.posicionActualUsuario = null;
        this.rutaActual = null;
        this.puntoSiguienteActual = null;
        this.modoTesting = false;
        
        // Configuraciones
        this.config = {
            radioActivacion: 30,
            radioPopupCerrar: 60,
            incrementoTesting: 0.00004,
            zoomInicial: 17
        };
        
        // Sistema de voces
        this.vocesDisponibles = [];
        this.vozMasculina = null;
        this.vozFemenina = null;
        
        this.inicializar();
    }
    
    /**
     * Inicialización principal del sistema
     */
    async inicializar() {
        console.log("🚀 Iniciando Guía Virtual...");
        
        try {
            await this.cargarDatos();
            this.configurarVoces();
            this.inicializarMapa();
            this.configurarGeolocation();
            this.configurarEventosTeclado();
            this.mostrarInstrucciones();
            
            console.log("✅ Guía Virtual inicializada correctamente");
        } catch (error) {
            console.error("❌ Error al inicializar:", error);
            console.error("Stack trace completo:", error.stack);
            // No mostrar alert automáticamente, permitir manejo en territorio.html
            throw error;
        }
    }
    
    /**
     * Carga los datos del territorio desde archivos JSON
     */
    async cargarDatos() {
        console.log(`📡 Cargando datos del territorio: ${this.territoryId}...`);
        
        try {
            // Verificar que se pasaron los datos del territorio
            if (!this.territoryData || !this.territoryData.archivos) {
                throw new Error(`❌ Datos del territorio no proporcionados correctamente. ID: ${this.territoryId}`);
            }
            
            const poisFile = this.territoryData.archivos.pois;
            const rutasFile = this.territoryData.archivos.rutas;
            
            console.log(`🔍 Cargando POIs desde: ${poisFile}`);
            console.log(`🔍 Cargando rutas desde: ${rutasFile}`);
            
            // Cargar POIs
            const responsePois = await fetch(poisFile);
            if (!responsePois.ok) throw new Error(`Error HTTP POIs ${responsePois.status}: ${poisFile}`);
            const dataPois = await responsePois.json();
            
            console.log(`📋 Estructura POIs:`, dataPois);
            
            // Cargar rutas
            const responseRutas = await fetch(rutasFile);
            if (!responseRutas.ok) throw new Error(`Error HTTP rutas ${responseRutas.status}: ${rutasFile}`);
            const dataRutas = await responseRutas.json();
            
            this.territorio = dataPois.territorio;
            this.puntosInteres = dataPois.features;
            this.rutasCalles = dataRutas.rutas;
            
            console.log(`📍 Territorio cargado: ${this.territorio.nombre}`);
            console.log(`🗺️ ${this.puntosInteres.length} puntos de interés`);
            console.log(`🛣️ ${Object.keys(this.rutasCalles).length} rutas por calles`);
            
        } catch (error) {
            console.error('❌ Error cargando datos del territorio:', error);
            console.error('Stack trace:', error.stack);
            throw error;
        }
    }
    
    /**
     * Configurar sistema de síntesis de voz
     */
    configurarVoces() {
        if (!('speechSynthesis' in window)) {
            console.log("⚠️ Síntesis de voz no disponible");
            return;
        }
        
        const cargarVoces = () => {
            this.vocesDisponibles = speechSynthesis.getVoices();
            console.log(`🎭 Voces disponibles: ${this.vocesDisponibles.length}`);
            
            // Buscar voces en español
            const vocesEspanol = this.vocesDisponibles.filter(voz => 
                voz.lang.startsWith('es') || voz.name.toLowerCase().includes('spanish')
            );
            
            // Asignar voces por género
            this.vozFemenina = vocesEspanol.find(voz => 
                voz.name.toLowerCase().includes('female') ||
                voz.name.toLowerCase().includes('mujer') ||
                voz.name.toLowerCase().includes('maria') ||
                voz.name.toLowerCase().includes('microsoft zira')
            );
            
            this.vozMasculina = vocesEspanol.find(voz => 
                voz.name.toLowerCase().includes('male') ||
                voz.name.toLowerCase().includes('hombre') ||
                voz.name.toLowerCase().includes('carlos') ||
                voz.name.toLowerCase().includes('microsoft pablo')
            ) || vocesEspanol[0];
            
            if (!this.vozFemenina && vocesEspanol.length > 1) {
                this.vozFemenina = vocesEspanol.find(voz => voz !== this.vozMasculina) || vocesEspanol[0];
            }
            
            if (!this.vozMasculina) this.vozMasculina = this.vocesDisponibles[0];
            if (!this.vozFemenina) this.vozFemenina = this.vocesDisponibles[1] || this.vocesDisponibles[0];
            
            console.log(`👨 Voz masculina: ${this.vozMasculina?.name || "No disponible"}`);
            console.log(`👩 Voz femenina: ${this.vozFemenina?.name || "No disponible"}`);
        };
        
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = cargarVoces;
        }
        setTimeout(cargarVoces, 100);
    }
    
    /**
     * Inicializar el mapa Leaflet
     */
    inicializarMapa() {
        console.log("🗺️ Inicializando mapa...");
        
        // Verificar que el elemento del mapa existe
        const mapElement = document.getElementById("map");
        if (!mapElement) {
            throw new Error("❌ Elemento del mapa no encontrado. DOM no está listo.");
        }
        
        console.log("✅ Elemento del mapa encontrado:", mapElement);
        
        // Verificar que el territorio está cargado
        if (!this.territorio || !this.territorio.centro) {
            throw new Error("❌ Datos del territorio no están cargados correctamente.");
        }
        
        console.log("✅ Territorio cargado:", this.territorio);
        
        // LIMPIEZA AGRESIVA DEL MAPA EXISTENTE
        if (this.mapa) {
            console.log("🧹 Limpiando mapa existente...");
            this.mapa.remove();
            this.mapa = null;
        }
        
        // Limpiar cualquier instancia previa de Leaflet en el elemento
        if (mapElement._leaflet_id) {
            console.log("🧹 Eliminando ID de Leaflet...");
            delete mapElement._leaflet_id;
        }
        
        // Limpiar completamente el contenido del div
        mapElement.innerHTML = '';
        mapElement.className = '';
        
        // Remover todos los atributos relacionados con Leaflet
        const leafletAttrs = ['tabindex', 'style'];
        leafletAttrs.forEach(attr => {
            if (mapElement.hasAttribute(attr)) {
                mapElement.removeAttribute(attr);
            }
        });
        
        console.log("🧹 Elemento del mapa completamente limpiado");
        
        // Crear mapa centrado en el territorio
        this.mapa = L.map("map").setView(this.territorio.centro, this.territorio.zoom);
        
        // Cargar tiles de OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap",
        }).addTo(this.mapa);
        
        // Agregar puntos de interés al mapa
        this.agregarPuntosInteres();
        
        // Dibujar ruta completa
        this.dibujarRutaCompleta();
        
        // Configurar evento de clic para mostrar coordenadas
        this.configurarMostrarCoordenadas();
    }
    
    /**
     * Configurar evento de clic en el mapa para mostrar coordenadas
     * Similar a Google Maps - muestra las coordenadas del punto clicado
     */
    configurarMostrarCoordenadas() {
        // Variable para almacenar el popup de coordenadas actual
        this.popupCoordenadas = null;
        
        this.mapa.on('click', (e) => {
            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);
            
            // Cerrar popup anterior si existe
            if (this.popupCoordenadas) {
                this.mapa.closePopup(this.popupCoordenadas);
            }
            
            // Crear contenido del popup con coordenadas
            const contenidoPopup = `
                <div class="coordenadas-popup">
                    <h4><i class="fas fa-map-marker-alt"></i> Coordenadas</h4>
                    <div class="coordenadas-info">
                        <p><strong>Latitud:</strong> ${lat}</p>
                        <p><strong>Longitud:</strong> ${lng}</p>
                        <small class="coordenadas-formato">Formato: ${lat}, ${lng}</small>
                    </div>
                    <div class="coordenadas-acciones">
                        <button onclick="navigator.clipboard.writeText('${lat}, ${lng}').then(() => {
                            const btn = this;
                            const originalText = btn.innerHTML;
                            btn.innerHTML = '<i class=\\"fas fa-check\\"></i> Copiado!';
                            setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                        })" class="btn-copiar-coordenadas">
                            <i class="fas fa-copy"></i> Copiar
                        </button>
                    </div>
                </div>
            `;
            
            // Crear y mostrar popup en la posición clicada
            this.popupCoordenadas = L.popup({
                maxWidth: 280,
                closeOnClick: false,
                autoClose: false,
                className: 'popup-coordenadas'
            })
            .setLatLng(e.latlng)
            .setContent(contenidoPopup)
            .openOn(this.mapa);
        });
        
        console.log("🎯 Sistema de coordenadas configurado - haz clic en el mapa para ver coordenadas");
    }
    
    /**
     * Agregar puntos de interés al mapa con iconos personalizados
     */
    agregarPuntosInteres() {
        L.geoJSON(this.puntosInteres, {
            pointToLayer: (feature, latlng) => {
                const iconoPersonalizado = this.crearIconoPersonalizado(feature.properties);
                return L.marker(latlng, { icon: iconoPersonalizado });
            },
            onEachFeature: (feature, layer) => {
                const popupContent = `<b>${feature.properties.nombre}</b><br>${feature.properties.descripcion}`;
                layer.bindPopup(popupContent);
                this.marcadoresLeaflet[feature.properties.id] = layer;
            },
        }).addTo(this.mapa);
    }
    
    /**
     * Crear icono personalizado basado en la categoría del POI
     */
    crearIconoPersonalizado(propiedades) {
        const tipoIcon = this.obtenerIconoPorCategoria(propiedades.categoria || propiedades.nombre);
        
        return L.divIcon({
            className: "custom-div-icon",
            html: `<div class="poi-icon ${tipoIcon.className}" title="${tipoIcon.title}">
                     <i class="${tipoIcon.iconClass}"></i>
                   </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15],
        });
    }
    
    /**
     * Determinar tipo de icono basado en categoría
     */
    obtenerIconoPorCategoria(categoria) {
        const categoriaLower = categoria.toLowerCase();
        
        if (categoriaLower.includes('plaza') || categoriaLower.startsWith('pla')) {
            return {
                className: "icon-plaza",
                iconClass: "fas fa-tree",
                title: "Plaza",
            };
        } else if (categoriaLower.includes('club') || categoriaLower.includes('country')) {
            return {
                className: "icon-club", 
                iconClass: "fas fa-users",
                title: "Club/Institución",
            };
        } else if (categoriaLower.includes('hotel')) {
            return {
                className: "icon-hotel",
                iconClass: "fas fa-bed",
                title: "Hotel",
            };
        } else {
            return {
                className: "icon-default",
                iconClass: "fas fa-map-marker-alt",
                title: "Punto de Interés",
            };
        }
    }
    
    /**
     * Dibujar ruta completa que sigue las calles
     */
    dibujarRutaCompleta() {
        const puntosOrdenados = this.puntosInteres.sort((a, b) => 
            a.properties.orden - b.properties.orden
        );
        
        const coordenadasRutaCompleta = [];
        
        for (let i = 0; i < puntosOrdenados.length - 1; i++) {
            const puntoActual = puntosOrdenados[i];
            const puntoSiguiente = puntosOrdenados[i + 1];
            
            const claveRuta = `${puntoActual.properties.orden}_${puntoSiguiente.properties.orden}`;
            const rutaPorCalles = this.rutasCalles[claveRuta];
            
            if (rutaPorCalles && rutaPorCalles.length > 0) {
                for (const coord of rutaPorCalles) {
                    coordenadasRutaCompleta.push([coord[1], coord[0]]); // [lat, lon]
                }
            }
        }
        
        if (coordenadasRutaCompleta.length > 1) {
            L.polyline(coordenadasRutaCompleta, {
                color: '#e74c3c',
                weight: 3,
                opacity: 0.7,
                dashArray: '8, 12'
            }).addTo(this.mapa);
            
            console.log("🔴 Ruta completa dibujada siguiendo calles");
        }
    }
    
    /**
     * Configurar geolocalización en tiempo real
     */
    configurarGeolocation() {
        if (!("geolocation" in navigator)) {
            alert("Tu navegador no soporta geolocalización. Esta aplicación no funcionará.");
            return;
        }
        
        console.log("📍 Iniciando geolocalización...");
        
        const opciones = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        };
        
        navigator.geolocation.watchPosition(
            (posicion) => this.onUbicacionCorrecta(posicion),
            (error) => this.onUbicacionError(error),
            opciones
        );
    }
    
    /**
     * Manejar actualización de ubicación
     */
    onUbicacionCorrecta(evento) {
        const lat = evento.coords.latitude;
        const lon = evento.coords.longitude;
        const precision = evento.coords.accuracy;
        
        this.posicionActualUsuario = L.latLng(lat, lon);
        
        console.log(`📍 Nueva ubicación: ${lat.toFixed(6)}, ${lon.toFixed(6)} (±${Math.round(precision)}m)`);
        
        // Centrar mapa la primera vez
        if (this.marcadorUsuario === null) {
            this.mapa.setView([lat, lon], this.config.zoomInicial);
        }
        
        // Actualizar o crear marcador del usuario
        if (this.marcadorUsuario) {
            this.marcadorUsuario.setLatLng(this.posicionActualUsuario);
        } else {
            this.marcadorUsuario = L.circleMarker([lat, lon], {
                color: "#007bff",
                fillColor: "#007bff",
                fillOpacity: 0.5,
                radius: 8,
            }).addTo(this.mapa);
        }
        
        // Actualizar navegación visual
        if (this.puntoSiguienteActual) {
            this.dibujarRutaHaciaSiguiente(this.puntoSiguienteActual);
        }
        
        // Revisar proximidad
        this.revisarProximidad(lat, lon);
    }
    
    /**
     * Manejar errores de geolocalización
     */
    onUbicacionError(error) {
        console.error("❌ Error de geolocalización:", error.message);
        
        if (error.code === error.PERMISSION_DENIED) {
            alert("Permiso de ubicación denegado. Recarga la página y acepta para continuar.");
        }
    }
    
    /**
     * Revisar proximidad a puntos de interés
     */
    revisarProximidad(lat, lon) {
        const miPosicion = L.latLng(lat, lon);
        
        for (const feature of this.puntosInteres) {
            const coordsPunto = feature.geometry.coordinates;
            const posPunto = L.latLng(coordsPunto[1], coordsPunto[0]);
            const distancia = this.mapa.distance(miPosicion, posPunto);
            const marcador = this.marcadoresLeaflet[feature.properties.id];
            
            // Activación de puntos no visitados
            if (!feature.properties.visitado && distancia < this.config.radioActivacion) {
                console.log(`🎯 ¡CERCA DE ${feature.properties.nombre}!`);
                this.activarPunto(feature);
            }
            
            // Auto-cerrar popups lejanos
            if (marcador && marcador.isPopupOpen() && distancia > this.config.radioPopupCerrar) {
                marcador.closePopup();
                console.log(`❌ Popup cerrado: ${feature.properties.nombre} (${Math.round(distancia)}m)`);
            }
        }
    }
    
    /**
     * Activar punto de interés cuando el usuario se acerca
     */
    activarPunto(feature) {
        feature.properties.visitado = true;
        
        const marcador = this.marcadoresLeaflet[feature.properties.id];
        if (marcador) marcador.openPopup();
        
        console.log(`🎯 PUNTO ACTIVADO: ${feature.properties.nombre}`);
        
        this.reproducirAudioConFallback(
            feature.properties.audio,
            feature.properties.nombre, 
            feature.properties.descripcion,
            feature.properties.orden
        );
    }
    
    /**
     * Sistema de audio con fallback a síntesis de voz
     */
    reproducirAudioConFallback(audioFile, nombre, descripcion, orden) {
        try {
            const audio = new Audio(audioFile);
            
            audio.oncanplaythrough = () => {
                console.log("✅ Audio MP3 cargado");
                this.mostrarNotificacion(`🎵 ${nombre}`, 'success');
            };
            
            audio.onerror = () => {
                console.log("❌ Error MP3, usando síntesis");
                this.usarSintesisDeVoz(nombre, descripcion, orden);
            };
            
            audio.onended = () => {
                console.log("🏁 Audio MP3 terminado");
                this.anunciarSiguientePunto(orden);
            };
            
            audio.play().catch(() => {
                this.usarSintesisDeVoz(nombre, descripcion, orden);
            });
            
        } catch (e) {
            this.usarSintesisDeVoz(nombre, descripcion, orden);
        }
    }
    
    /**
     * Síntesis de voz como respaldo
     */
    usarSintesisDeVoz(nombre, descripcion, orden) {
        this.mostrarNotificacion(`🗣️ ${nombre}`, 'info');
        
        if ('speechSynthesis' in window) {
            const texto = `Has llegado a ${nombre}. ${descripcion}`;
            this.hablarTexto(texto, false); // Voz masculina para descripciones
            
            setTimeout(() => {
                this.anunciarSiguientePunto(orden);
            }, texto.length * 80);
        } else {
            setTimeout(() => this.anunciarSiguientePunto(orden), 2000);
        }
    }
    
    /**
     * Función de síntesis de voz
     */
    hablarTexto(texto, usarVozFemenina = false) {
        if (!('speechSynthesis' in window)) return;
        
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(texto);
        const vozSeleccionada = usarVozFemenina ? this.vozFemenina : this.vozMasculina;
        
        if (vozSeleccionada) {
            utterance.voice = vozSeleccionada;
            utterance.lang = vozSeleccionada.lang;
        } else {
            utterance.lang = 'es-ES';
        }
        
        // Configurar parámetros por tipo de voz
        if (usarVozFemenina) {
            utterance.rate = 1.0;
            utterance.pitch = 1.1;
            utterance.volume = 0.9;
        } else {
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
        }
        
        speechSynthesis.speak(utterance);
    }
    
    /**
     * Anunciar siguiente punto con navegación visual
     */
    anunciarSiguientePunto(ordenActual) {
        const siguientePunto = this.encontrarSiguientePunto(ordenActual);
        
        if (siguientePunto && this.posicionActualUsuario) {
            const posSiguiente = L.latLng(
                siguientePunto.geometry.coordinates[1],
                siguientePunto.geometry.coordinates[0]
            );
            
            const distancia = this.mapa.distance(this.posicionActualUsuario, posSiguiente);
            const distanciaRedondeada = Math.round(distancia);
            
            // Navegación visual
            this.actualizarNavegacionVisual(siguientePunto);
            
            // Anuncio por voz femenina
            const textoAnuncio = `Siguiente parada: ${siguientePunto.properties.nombre}. Se encuentra a ${distanciaRedondeada} metros.`;
            this.hablarTexto(textoAnuncio, true);
            this.mostrarNotificacion(`👩‍🗣️ ${siguientePunto.properties.nombre}`, 'info');
            
        } else if (!siguientePunto) {
            // Recorrido completado
            this.limpiarDestacadoAnterior();
            if (this.rutaActual) {
                this.mapa.removeLayer(this.rutaActual);
                this.rutaActual = null;
            }
            
            this.hablarTexto("Has completado el recorrido. ¡Gracias por visitarnos!", true);
            this.mostrarNotificacion("🎉 ¡Recorrido completado!", 'success');
        }
    }
    
    /**
     * Encontrar siguiente punto en el recorrido
     */
    encontrarSiguientePunto(ordenActual) {
        return this.puntosInteres.find(f => f.properties.orden === ordenActual + 1);
    }
    
    /**
     * Actualizar navegación visual completa
     */
    actualizarNavegacionVisual(siguientePunto) {
        this.destacarSiguientePunto(siguientePunto);
        this.dibujarRutaHaciaSiguiente(siguientePunto);
    }
    
    /**
     * Destacar visualmente el siguiente punto
     */
    destacarSiguientePunto(punto) {
        this.limpiarDestacadoAnterior();
        
        if (punto) {
            const marcador = this.marcadoresLeaflet[punto.properties.id];
            if (marcador && marcador._icon) {
                const poiIcon = marcador._icon.querySelector('.poi-icon');
                if (poiIcon) {
                    poiIcon.classList.add('icon-siguiente');
                    this.puntoSiguienteActual = punto;
                }
            }
        }
    }
    
    /**
     * Limpiar destacado anterior
     */
    limpiarDestacadoAnterior() {
        if (this.puntoSiguienteActual) {
            const marcadorAnterior = this.marcadoresLeaflet[this.puntoSiguienteActual.properties.id];
            if (marcadorAnterior && marcadorAnterior._icon) {
                const poiIcon = marcadorAnterior._icon.querySelector('.poi-icon');
                if (poiIcon) {
                    poiIcon.classList.remove('icon-siguiente');
                }
            }
            this.puntoSiguienteActual = null;
        }
    }
    
    /**
     * Dibujar ruta azul hacia el siguiente punto
     */
    dibujarRutaHaciaSiguiente(puntoDestino) {
        if (this.rutaActual) {
            this.mapa.removeLayer(this.rutaActual);
            this.rutaActual = null;
        }
        
        if (puntoDestino && this.posicionActualUsuario) {
            const rutaPorCalles = this.obtenerRutaPorCalles(puntoDestino);
            
            if (rutaPorCalles && rutaPorCalles.length > 1) {
                const coordenadas = rutaPorCalles.map(coord => [coord[1], coord[0]]);
                
                // Agregar posición actual si es necesaria
                const primeraCoord = coordenadas[0];
                const distanciaPrimerPunto = this.mapa.distance(this.posicionActualUsuario, L.latLng(primeraCoord));
                
                if (distanciaPrimerPunto > 20) {
                    coordenadas.unshift([this.posicionActualUsuario.lat, this.posicionActualUsuario.lng]);
                }
                
                this.rutaActual = L.polyline(coordenadas, {
                    color: '#2196F3',
                    weight: 6,
                    opacity: 0.9,
                    dashArray: '10, 5',
                    dashOffset: '0'
                }).addTo(this.mapa);
                
            } else {
                // Fallback: línea recta
                const destino = L.latLng(
                    puntoDestino.geometry.coordinates[1],
                    puntoDestino.geometry.coordinates[0]
                );
                
                this.rutaActual = L.polyline([this.posicionActualUsuario, destino], {
                    color: '#FF9800',
                    weight: 6,
                    opacity: 0.7,
                    dashArray: '15, 10'
                }).addTo(this.mapa);
            }
            
            // Animar línea punteada
            this.animarLinea();
        }
    }
    
    /**
     * Obtener ruta predefinida por calles
     */
    obtenerRutaPorCalles(puntoDestino) {
        const puntoActual = this.encontrarPuntoAnterior(puntoDestino.properties.orden);
        
        if (puntoActual) {
            const claveRuta = `${puntoActual.properties.orden}_${puntoDestino.properties.orden}`;
            return this.rutasCalles[claveRuta] || null;
        }
        
        return null;
    }
    
    /**
     * Encontrar punto anterior visitado
     */
    encontrarPuntoAnterior(ordenDestino) {
        let puntoAnterior = null;
        let mayorOrden = 0;
        
        for (const feature of this.puntosInteres) {
            if (feature.properties.visitado && 
                feature.properties.orden < ordenDestino && 
                feature.properties.orden > mayorOrden) {
                mayorOrden = feature.properties.orden;
                puntoAnterior = feature;
            }
        }
        
        return puntoAnterior;
    }
    
    /**
     * Animar línea punteada de navegación
     */
    animarLinea() {
        let offset = 0;
        const animar = () => {
            if (this.rutaActual && this.mapa.hasLayer(this.rutaActual)) {
                offset += 2;
                this.rutaActual.setStyle({ dashOffset: -offset });
                setTimeout(animar, 100);
            }
        };
        animar();
    }
    
    /**
     * Mostrar notificaciones en pantalla
     */
    mostrarNotificacion(mensaje, tipo = 'info') {
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;
        
        notificacion.style.cssText = `
            position: fixed;
            top: 80px;
            right: 10px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 1001;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            transition: opacity 0.3s;
            background: ${tipo === 'success' ? '#4CAF50' : tipo === 'warning' ? '#FF9800' : '#2196F3'};
        `;
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.style.opacity = '0';
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.parentNode.removeChild(notificacion);
                }
            }, 300);
        }, 4000);
    }
    
    // === MODO TESTING PARA PC ===
    
    /**
     * Configurar eventos del teclado para testing
     */
    configurarEventosTeclado() {
        document.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 't') {
                this.activarModoTesting();
                return;
            }
            
            if (!this.modoTesting) return;
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
                event.preventDefault();
            }
            
            switch(event.key) {
                case 'ArrowUp':
                    this.moverPosicionTest('arriba');
                    break;
                case 'ArrowDown':
                    this.moverPosicionTest('abajo');
                    break;
                case 'ArrowLeft':
                    this.moverPosicionTest('izquierda');
                    break;
                case 'ArrowRight':
                    this.moverPosicionTest('derecha');
                    break;
            }
        });
    }
    
    /**
     * Activar modo testing
     */
    activarModoTesting() {
        if (!this.modoTesting) {
            this.modoTesting = true;
            this.posicionTestLat = this.territorio.centro[0];
            this.posicionTestLon = this.territorio.centro[1];
            
            console.log("🎮 MODO TESTING ACTIVADO");
            
            // Mostrar indicador de estado
            const statusElement = document.getElementById('testing-status');
            if (statusElement) {
                statusElement.style.display = 'block';
            }
            
            // Actualizar botón
            const botonTesting = document.getElementById('btnToggleTesting');
            if (botonTesting) {
                botonTesting.innerHTML = '<i class="fas fa-stop"></i> Cerrar Testing';
                botonTesting.className = 'testing-btn stop';
            }
            
            this.posicionActualUsuario = L.latLng(this.posicionTestLat, this.posicionTestLon);
            
            if (this.marcadorUsuario) {
                this.marcadorUsuario.setLatLng(this.posicionActualUsuario);
            } else {
                this.marcadorUsuario = L.circleMarker([this.posicionTestLat, this.posicionTestLon], {
                    color: "#007bff",
                    fillColor: "#007bff",
                    fillOpacity: 0.5,
                    radius: 8,
                }).addTo(this.mapa);
            }
            
            this.mapa.setView([this.posicionTestLat, this.posicionTestLon], this.config.zoomInicial);
            this.revisarProximidad(this.posicionTestLat, this.posicionTestLon);
            
            this.mostrarNotificacion("🎮 Modo testing activado - Usa las flechas del teclado", 'success');
        }
    }
    
    /**
     * Mover posición en modo testing
     */
    moverPosicionTest(direccion) {
        if (!this.modoTesting) return;
        
        switch(direccion) {
            case 'arriba':
                this.posicionTestLat += this.config.incrementoTesting;
                break;
            case 'abajo':
                this.posicionTestLat -= this.config.incrementoTesting;
                break;
            case 'izquierda':
                this.posicionTestLon -= this.config.incrementoTesting;
                break;
            case 'derecha':
                this.posicionTestLon += this.config.incrementoTesting;
                break;
        }
        
        this.posicionActualUsuario = L.latLng(this.posicionTestLat, this.posicionTestLon);
        
        if (this.marcadorUsuario) {
            this.marcadorUsuario.setLatLng(this.posicionActualUsuario);
        }
        
        this.mapa.setView([this.posicionTestLat, this.posicionTestLon], this.config.zoomInicial);
        
        if (this.puntoSiguienteActual) {
            this.dibujarRutaHaciaSiguiente(this.puntoSiguienteActual);
        }
        
        this.revisarProximidad(this.posicionTestLat, this.posicionTestLon);
    }
    
    /**
     * Mostrar instrucciones iniciales
     */
    mostrarInstrucciones() {
        console.log("💡 Para testing en PC: Presiona 'T' para activar, luego usa las flechas ⬆️⬇️⬅️➡️");
    }
    
    // === FUNCIONES PARA PANEL DE TESTING ===
    
    /**
     * Mostrar todos los POIs en el mapa
     */
    mostrarTodosPOIs() {
        console.log("🗺️ Mostrando todos los POIs");
        
        // Abrir todos los popups
        for (const feature of this.puntosInteres) {
            const marcador = this.marcadoresLeaflet[feature.properties.id];
            if (marcador) {
                marcador.openPopup();
            }
        }
        
        // Ajustar vista para mostrar todos los POIs
        const group = new L.featureGroup(Object.values(this.marcadoresLeaflet));
        this.mapa.fitBounds(group.getBounds().pad(0.1));
        
        this.mostrarNotificacion("🗺️ Todos los POIs visibles", 'info');
    }
    
    /**
     * Probar sistema de audio
     */
    probarAudio() {
        console.log("🔊 Probando sistema de audio");
        
        const textoTest = "Prueba de audio del sistema. Las voces están funcionando correctamente.";
        
        if ('speechSynthesis' in window) {
            // Probar voz masculina
            this.hablarTexto("Voz masculina: " + textoTest, false);
            
            // Probar voz femenina después de un tiempo
            setTimeout(() => {
                this.hablarTexto("Voz femenina: " + textoTest, true);
            }, 4000);
            
            this.mostrarNotificacion("🔊 Probando voces masculina y femenina", 'info');
        } else {
            this.mostrarNotificacion("❌ Síntesis de voz no disponible", 'warning');
        }
    }
    
    /**
     * Centrar mapa en el territorio actual
     */
    centrarMapa() {
        console.log("🎯 Centrando mapa en territorio:", this.territorio.nombre);
        
        if (this.territorio && this.territorio.centro) {
            this.mapa.setView(this.territorio.centro, this.territorio.zoom);
            
            // Si está en modo testing, mover la posición test al centro
            if (this.modoTesting) {
                this.posicionTestLat = this.territorio.centro[0];
                this.posicionTestLon = this.territorio.centro[1];
                this.posicionActualUsuario = L.latLng(this.posicionTestLat, this.posicionTestLon);
                
                if (this.marcadorUsuario) {
                    this.marcadorUsuario.setLatLng(this.posicionActualUsuario);
                }
                
                this.revisarProximidad(this.posicionTestLat, this.posicionTestLon);
                console.log("📍 Posición de testing actualizada al centro del territorio");
            }
            
            this.mostrarNotificacion(`🎯 Centrado en ${this.territorio.nombre}`, 'success');
        } else {
            this.mostrarNotificacion("❌ No se pudo centrar: territorio no cargado", 'warning');
        }
    }
    
    /**
     * Alternar modo testing
     */
    alternarModoTesting() {
        if (this.modoTesting) {
            this.desactivarModoTesting();
        } else {
            this.activarModoTesting();
        }
    }
    
    /**
     * Desactivar modo testing
     */
    desactivarModoTesting() {
        if (this.modoTesting) {
            this.modoTesting = false;
            console.log("🎮 MODO TESTING DESACTIVADO");
            
            // Ocultar indicador de estado
            const statusElement = document.getElementById('testing-status');
            if (statusElement) {
                statusElement.style.display = 'none';
            }
            
            // Actualizar botón
            const botonTesting = document.getElementById('btnToggleTesting');
            if (botonTesting) {
                botonTesting.innerHTML = '<i class="fas fa-play"></i> Iniciar Testing';
                botonTesting.className = 'testing-btn start';
            }
            
            this.mostrarNotificacion("🎮 Modo testing desactivado", 'info');
        }
    }
}

// Nota: La inicialización se maneja desde territorio.html
// No crear instancia automática aquí para evitar conflictos