const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLA_INVENTARIO = 'inventario';
const TABLA_USUARIOS = 'usuarios';

const equipoForm = document.getElementById('equipoForm');
const saveButton = document.getElementById('saveButton'); 

let currentSerialNumber = null; 

const usuarioSearchInput = document.getElementById('usuario_search');
const suggestionsList = document.getElementById('user-suggestions');
const idUsuarioHidden = document.getElementById('id_usuario');
const dptoDisplay = document.getElementById('usuario_dpto_display');

const BASE_DEVICE_IMAGE_PATH = 'img/disp/';
const DEFAULT_DEVICE_IMAGE = BASE_DEVICE_IMAGE_PATH + 'DEFAULT.png';

async function fetchAndRenderSuggestions() {
    if (!usuarioSearchInput) return;
    const query = usuarioSearchInput.value.trim().toUpperCase();
    
    if (query.length < 3) {
        suggestionsList.style.display = 'none';
        return;
    }

    const { data, error } = await supabaseClient
        .from(TABLA_USUARIOS)
        .select('id, "NOMBRE COMPLETO", "DEPARTAMENTO", "LUGAR_DPTO", "NUMERO EMPLEADO"')
        .or(`"NOMBRE COMPLETO".ilike.%${query}%, "NUMERO EMPLEADO".ilike.%${query}%`)
        .limit(5);

    if (error) {
        console.error("Error buscando usuarios:", error);
        return;
    }

    suggestionsList.innerHTML = '';
    if (data.length > 0) {
        suggestionsList.style.display = 'block';
        data.forEach(user => {
            const li = document.createElement('li');
            li.style.cssText = 'padding: 8px; cursor: pointer; border-bottom: 1px solid #eee;';
            const ubicacion = user['LUGAR_DPTO'] || user['DEPARTAMENTO'] || 'N/A';
            li.textContent = `${user['NOMBRE COMPLETO']} (${ubicacion})`;
            
            li.addEventListener('click', () => {
                seleccionarUsuario(user);
            });
            
            suggestionsList.appendChild(li);
        });
    } else {
        suggestionsList.style.display = 'none';
    }
}

function seleccionarUsuario(user) {
    usuarioSearchInput.value = user['NOMBRE COMPLETO'];
    idUsuarioHidden.value = user.id;
    
    const ubicacion = user['LUGAR_DPTO'] || user['DEPARTAMENTO'] || 'N/A';
    dptoDisplay.value = ubicacion;
    
    suggestionsList.style.display = 'none';
}

function updateDeviceImage(data) {
    const dispLateralImg = document.querySelector('#disp-lateral-form img');
    if (!dispLateralImg) return;
    const deviceType = data.DISP || '';
    let imagePath;
    if (deviceType) {
        imagePath = BASE_DEVICE_IMAGE_PATH + deviceType.toUpperCase() + '.png';
    } else {
        imagePath = DEFAULT_DEVICE_IMAGE;
    }
    dispLateralImg.src = imagePath;
    dispLateralImg.alt = `IMAGEN DE ${deviceType}`;
}

// FUNCIÓN CLAVE PARA LA FECHA ACTUAL
function setFechaRevisadoActual() {
    const inputFechaRevisado = document.getElementById('fecha-revisado');
    const hoy = new Date();
    const fechaFormateada = hoy.toISOString().split('T')[0];
    inputFechaRevisado.value = fechaFormateada;
}

async function fetchEquipoDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const serial = urlParams.get('serial');
    
    if (!serial) {
        alert('Error: Número de serie no especificado en la URL.');
        return;
    }
    
    currentSerialNumber = serial.toUpperCase();

    const serialInput = document.querySelector('input[name="NUMERO DE SERIE"]');
    if (serialInput) {
        serialInput.value = currentSerialNumber;
    }

    try {
        const { data, error } = await supabaseClient
            .from(TABLA_INVENTARIO)
            .select(`
                *,
                usuarios (id, "NOMBRE COMPLETO", "DEPARTAMENTO", "LUGAR_DPTO")
            `)
            .eq('NUMERO DE SERIE', currentSerialNumber)
            .single(); 

        if (error) throw error;
        
        if (data) {
            updateDeviceImage(data);
            fillForm(data);
            fillUserFields(data);
            // Establecer la fecha de revisión al día de hoy al cargar el formulario
            setFechaRevisadoActual(); 
        } else {
            alert(`Equipo con S/N ${currentSerialNumber} no encontrado.`);
        }

    } catch (error) {
        console.error('Error al cargar detalles del equipo:', error);
        alert('Error al cargar datos del servidor.');
    }
}

function fillForm(data) {
    // Llenado de DETALLES para evitar fallo del textarea
    const detallesElement = document.getElementById('nota');
    if (detallesElement) {
        detallesElement.value = data.DETALLES || '';
    }

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            if (key === 'id_usuario' || key === 'usuarios' || key === 'USUARIO' || key === 'LUGAR_DPTO' || key === 'DETALLES' || key === 'FECHA REVISADO') continue;

            const element = document.querySelector(`[name="${key}"]`);
            if (element) {
                let value = data[key];
                
                if (key === 'ACTIVO' && element.type === 'radio') {
                    const radioValue = value ? 'TRUE' : 'FALSE';
                    const radioElement = document.querySelector(`input[name="ACTIVO"][value="${radioValue}"]`);
                    if (radioElement) radioElement.checked = true;
                } else if (key === 'FUNCIONA' && element.type === 'radio') {
                    const radioElement = document.querySelector(`input[name="FUNCIONA"][value="${value}"]`);
                    if (radioElement) radioElement.checked = true;
                } else if (element.type === 'radio' || element.type === 'checkbox') {
                } else {
                    element.value = value || '';
                }
            }
        }
    }
}

function fillUserFields(data) {
    const user = data.usuarios; 
    
    if (idUsuarioHidden) {
        idUsuarioHidden.value = data.id_usuario || '';
    }

    if (user && user.id) {
        if (usuarioSearchInput) {
            usuarioSearchInput.value = user['NOMBRE COMPLETO'] || 'SIN ASIGNAR';
        }

        if (dptoDisplay) {
            const ubicacion = user['LUGAR_DPTO'] || user['DEPARTAMENTO'] || 'N/A';
            dptoDisplay.value = ubicacion;
        }
    } else {
        if (usuarioSearchInput) usuarioSearchInput.value = '';
        if (dptoDisplay) dptoDisplay.value = 'SIN ASIGNAR';
    }
}

async function handleUpdate(event) {
    event.preventDefault();
    
    if (!currentSerialNumber) {
        alert('Error: No se ha podido identificar el equipo a actualizar.');
        return;
    }
    
    saveButton.disabled = true;
    saveButton.textContent = 'ACTUALIZANDO...';

    const formData = new FormData(equipoForm);
    const updateData = {};

    for (const [key, value] of formData.entries()) {
        if (key === 'USUARIO_SEARCH' || key === 'NUMERO DE SERIE') continue;
        
        let cleanedValue = (typeof value === 'string' ? value.trim() : value) || null;
        
        if (cleanedValue === null) {
            updateData[key] = null;
            continue;
        }

        if (key === 'ACTIVO') {
            updateData[key] = cleanedValue === 'TRUE';
            
        } else if (key === 'FECHA COMPRA' || key === 'FECHA REVISADO' || key === 'id_usuario') {
            updateData[key] = cleanedValue; 
            
        } else {
            updateData[key] = String(cleanedValue).toUpperCase();
        }
    }
    
    // Incluir la fecha de revisión actual
    setFechaRevisadoActual();
    updateData['FECHA REVISADO'] = document.getElementById('fecha-revisado').value;
    updateData['DETALLES'] = document.getElementById('nota').value.toUpperCase();

    if (!updateData.id_usuario && usuarioSearchInput.value) {
        alert('Por favor, selecciona un usuario de la lista de sugerencias para obtener su ID.');
        saveButton.disabled = false;
        saveButton.textContent = 'GUARDAR CAMBIOS';
        return;
    }

    try {
        const { error } = await supabaseClient
            .from(TABLA_INVENTARIO)
            .update(updateData)
            .eq('NUMERO DE SERIE', currentSerialNumber);

        if (error) throw error;

        alert(`✅ Equipo ${currentSerialNumber} actualizado con éxito!`);
        window.location.href = 'vista_inventario.html'; 

    } catch (error) {
        console.error('Error al actualizar el equipo:', error);
        alert(`Error al actualizar el equipo: ${error.message}`);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'GUARDAR CAMBIOS';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    fetchEquipoDetails(); 
    
    if (usuarioSearchInput) {
        usuarioSearchInput.addEventListener('input', fetchAndRenderSuggestions);
    }
    document.addEventListener('click', function(e) {
        if (suggestionsList && e.target !== usuarioSearchInput && e.target !== suggestionsList) {
            suggestionsList.style.display = 'none';
        }
    });

    if (equipoForm) {
        equipoForm.addEventListener('submit', handleUpdate);
    }
});