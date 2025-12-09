const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLA_INVENTARIO = 'inventario';

const equipoForm = document.getElementById('equipoForm');
const saveButton = document.getElementById('saveButton'); 

let currentSerialNumber = null; 

const formFieldMapping = {
    'NUMERO DE SERIE': 'NUMERO DE SERIE',
    'MARCA': 'MARCA',
    'MODELO': 'MODELO',
    'DISP': 'DISP',
    'USUARIO': 'USUARIO',
    'LUGAR_DPTO': 'LUGAR_DPTO',
    'FECHA COMPRA': 'FECHA COMPRA',
    'FECHA REVISADO': 'FECHA REVISADO',
    'FUNCIONA': 'FUNCIONA',
    'DETALLES': 'DETALLES',
    'ACTIVO': 'ACTIVO' 
};

const BRAND_IMAGES = {
    'LENOVO': 'img/lenovo_logo.png',
    'HP': 'img/hp_logo.png',
    'DELL': 'img/dell_logo.png',
    'ASUS': 'img/asus_logo.png',
    'MSI': 'img/msi_logo.png',
    'ACER': 'img/acer_logo.png',
    'DEFAULT': 'img/default_logo.png'
};

const BASE_DEVICE_IMAGE_PATH = 'img/disp/';
const DEFAULT_DEVICE_IMAGE = BASE_DEVICE_IMAGE_PATH + 'DEFAULT.png';

/**
 * Actualiza la imagen lateral del equipo basándose en el TIPO de dispositivo (DISP).
 * @param {Object} data - Objeto de datos del equipo (con DISP).
 */
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
async function fetchEquipoDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const serial = urlParams.get('serial');
    console.log("Serial obtenido de la URL:", serial);
    
    if (!serial) {
        alert('Error: Número de serie no especificado en la URL.');
        return;
    }
    
    currentSerialNumber = serial;

    const serialInput = document.querySelector('input[name="NUMERO DE SERIE"]');
    if (serialInput) {
        serialInput.value = serial;
    }

    try {
        const { data, error } = await supabaseClient
            .from(TABLA_INVENTARIO)
            .select('*')
            .eq('NUMERO DE SERIE', serial)
            .single(); 

        if (error) throw error;
        
        if (data) {
            updateDeviceImage(data);
            fillForm(data);
        } else {
            alert(`Equipo con S/N ${serial} no encontrado.`);
        }

    } catch (error) {
        console.error('Error al cargar detalles del equipo:', error);
        alert('Error al cargar datos del servidor.');
    }
}

function fillForm(data) {
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
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
                    // Ignorar
                } else {
                    element.value = value || '';
                }
            }
        }
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
        if (key === 'lugar_base' || key === 'dpto_base') continue;          //IGNORAR CAMPOS AUXILIARES
        
        let cleanedValue = (typeof value === 'string' ? value.trim() : value) || null;
        
        // Si se asignaron valores vacíos, enviarlos como null
        if (cleanedValue === null) {
            updateData[key] = null;
            continue;
        }

        // ACTIVO
        if (key === 'ACTIVO') {
            updateData[key] = cleanedValue === 'TRUE';
            
        // FECHAS
        } else if (key === 'FECHA COMPRA' || key === 'FECHA REVISADO') {
            updateData[key] = cleanedValue; 
            
        // DETALLES
        } else if (key === 'DETALLES') {
            updateData[key] = String(cleanedValue).toUpperCase(); 
            
        // EL RESTO...
        } else {
            updateData[key] = String(cleanedValue).toUpperCase();
        }
    }

    // UPDATE
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


// INICIALIZACIoN
document.addEventListener('DOMContentLoaded', () => {
    fetchEquipoDetails(); 
    
    if (equipoForm) {
        equipoForm.addEventListener('submit', handleUpdate);
    }
});