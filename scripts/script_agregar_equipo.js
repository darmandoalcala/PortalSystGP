// SUPABASE
const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLA_INVENTARIO = 'inventario'; 
const TABLA_USUARIOS = 'usuarios';

// DOM
const selectDispositivo = document.getElementById('disp');
const imagenDispositivo = document.querySelector('#disp-lateral-form img');
const formularioEquipo = document.getElementById('equipoForm'); 
const basePath = 'img/disp/';
const defaultImage = basePath + 'DEFAULT.png';

// Elementos del Buscador de Usuarios
const usuarioSearchInput = document.getElementById('usuario_search');
const suggestionsList = document.getElementById('user-suggestions');
const idUsuarioHidden = document.getElementById('id_usuario');
const dptoDisplay = document.getElementById('usuario_dpto_display');


// --- 1. LÓGICA DE IMAGEN Y FECHAS (Sin cambios) ---

function actualizarImagen() {
    const valorSeleccionado = selectDispositivo.value;
    let nuevaRuta = (valorSeleccionado === 'OTRO' || !valorSeleccionado) 
        ? defaultImage 
        : basePath + valorSeleccionado + '.png';
    imagenDispositivo.src = nuevaRuta;
}

function setFechaRevisadoActual() {
    const inputFechaRevisado = document.getElementById('fecha-revisado');
    const hoy = new Date();
    const fechaFormateada = hoy.toISOString().split('T')[0]; // Forma más corta YYYY-MM-DD
    inputFechaRevisado.value = fechaFormateada;
}


// --- 2. LÓGICA DEL BUSCADOR DE USUARIOS (NUEVO) ---

if (usuarioSearchInput) {
    usuarioSearchInput.addEventListener('input', async function() {
        const query = this.value.trim().toUpperCase();
        
        // Limpiar si está vacío
        if (query.length < 3) {
            suggestionsList.style.display = 'none';
            return;
        }

        // Buscar en Supabase
        const { data, error } = await supabaseClient
            .from(TABLA_USUARIOS)
            .select('id, "NOMBRE COMPLETO", "DEPARTAMENTO", "LUGAR_DPTO", "NUMERO EMPLEADO"')
            .or(`"NOMBRE COMPLETO".ilike.%${query}%, "NUMERO EMPLEADO".ilike.%${query}%`)
            .limit(5);

        if (error) {
            console.error("Error buscando usuarios:", error);
            return;
        }

        // Renderizar sugerencias
        suggestionsList.innerHTML = '';
        if (data.length > 0) {
            suggestionsList.style.display = 'block';
            data.forEach(user => {
                const li = document.createElement('li');
                li.style.padding = '8px';
                li.style.cursor = 'pointer';
                li.style.borderBottom = '1px solid #eee';
                li.textContent = `${user['NUMERO EMPLEADO']} - ${user['NOMBRE COMPLETO']} (${user['DEPARTAMENTO'] || user['LUGAR_DPTO'] || 'N/A'})`;
                
                // Al hacer clic en una sugerencia
                li.addEventListener('click', () => {
                    seleccionarUsuario(user);
                });
                
                suggestionsList.appendChild(li);
            });
        } else {
            suggestionsList.style.display = 'none';
        }
    });
    
    // Ocultar lista al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (e.target !== usuarioSearchInput && e.target !== suggestionsList) {
            suggestionsList.style.display = 'none';
        }
    });
}

function seleccionarUsuario(user) {
    usuarioSearchInput.value = user['NOMBRE COMPLETO'];
    idUsuarioHidden.value = user.id;
    
    // Mostrar info extra para confirmación visual
    const ubicacion = user['LUGAR_DPTO'] || user['DEPARTAMENTO'] || 'N/A';
    dptoDisplay.value = ubicacion;
    
    suggestionsList.style.display = 'none';
}


// --- 3. GUARDADO EN SUPABASE (ACTUALIZADO) ---

async function agregarEquipoASupabase(event) {
    event.preventDefault();

    const formData = new FormData(formularioEquipo);
    const data = {};

    for (const [key, value] of formData.entries()) {
        // Ignoramos campos auxiliares de búsqueda (solo visuales)
        if (key === 'USUARIO_SEARCH') continue; 

        let cleanedValue = (typeof value === 'string' ? value.trim() : value);
        if (cleanedValue === '') cleanedValue = null;
        
        if (key === 'ACTIVO') {
            data[key] = cleanedValue === 'TRUE';
        } else if (key === 'DETALLES' || key === 'FECHA COMPRA' || key === 'FECHA REVISADO' || key === 'id_usuario') {
            // Estos campos van tal cual (sin Uppercase forzado)
            // Nota: id_usuario se convierte a número automáticamente si es string numérico
            data[key] = cleanedValue;
        } else {
            // Textos generales a mayúsculas
            data[key] = cleanedValue ? String(cleanedValue).toUpperCase() : cleanedValue;
        }
    }

    // Validación de Integridad
    if (!data['NUMERO DE SERIE']) {
        alert('Por favor, ingresa el Número de Serie.');
        return;
    }
    if (!data['id_usuario']) {
        alert('Por favor, busca y selecciona un usuario de la lista.');
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from(TABLA_INVENTARIO)
            .insert([data]);

        if (error) {
            console.error('Error al insertar:', error);
            if (error.code === '23505') { 
                alert(`Error: El equipo con número de serie ${data['NUMERO DE SERIE']} ya existe.`);
            } else {
                alert(`Error al guardar: ${error.message}`);
            }
        } else {
            alert('✅ Equipo vinculado y agregado exitosamente!');
            formularioEquipo.reset(); 
            setFechaRevisadoActual(); 
            actualizarImagen();
            dptoDisplay.value = ''; // Limpiar campo extra
            idUsuarioHidden.value = ''; // Limpiar ID oculto
        }
    } catch (e) {
        console.error('Error inesperado:', e);
        alert('Ocurrió un error inesperado al intentar guardar el equipo.');
    }
}


// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function() {
    setFechaRevisadoActual();

    if (selectDispositivo) {
        selectDispositivo.addEventListener('change', actualizarImagen);
        setTimeout(actualizarImagen, 100); 
    }
    
    if (formularioEquipo) {
        formularioEquipo.addEventListener('submit', agregarEquipoASupabase);
    }
});