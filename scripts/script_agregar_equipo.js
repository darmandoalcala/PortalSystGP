//SUPABASE
const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLA_INVENTARIO = 'inventario'; 
//DOM
const selectDispositivo = document.getElementById('disp');
const imagenDispositivo = document.querySelector('#disp-lateral-form img');
const formularioEquipo = document.getElementById('equipoForm'); 
const basePath = 'img/disp/';
const defaultImage = basePath + 'DEFAULT.png';


function actualizarImagen() {
    const valorSeleccionado = selectDispositivo.value;
    let nuevaRuta;

    if (valorSeleccionado === 'OTRO' || !valorSeleccionado) {nuevaRuta = defaultImage;} 
    else {nuevaRuta = basePath + valorSeleccionado + '.png';}

    imagenDispositivo.src = nuevaRuta;
}

function setFechaRevisadoActual() {
    const inputFechaRevisado = document.getElementById('fecha-revisado');
    const hoy = new Date();

    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    const fechaFormateada = `${año}-${mes}-${dia}`;
    inputFechaRevisado.value = fechaFormateada;
}

function concatenarLugarDpto() {
    const sucursalInput = formularioEquipo.querySelector('#lugar_base');
    const dptoInput = formularioEquipo.querySelector('#dpto_base');

    if (!sucursalInput || !dptoInput) return;
    
    const sucursalValue = sucursalInput.value.trim().toUpperCase();
    const dptoValue = dptoInput.value.trim().toUpperCase();
    
    const lugarDptoConcatenado = `GP-${sucursalValue}/${dptoValue}`;

    let hiddenLugarInput = formularioEquipo.querySelector('input[name="LUGAR_DPTO"]');
    
    if (!hiddenLugarInput) {
        hiddenLugarInput = document.createElement('input');
        hiddenLugarInput.type = 'hidden';
        hiddenLugarInput.name = 'LUGAR_DPTO'; // Columna final
        formularioEquipo.appendChild(hiddenLugarInput);
    }

    hiddenLugarInput.value = lugarDptoConcatenado;
}

async function agregarEquipoASupabase(event) {
    event.preventDefault();

    concatenarLugarDpto(); 

    const formData = new FormData(formularioEquipo);
    const data = {};

    for (const [key, value] of formData.entries()) {
        if (key === 'lugar_base' || key === 'dpto_base') continue; 

        let cleanedValue = (typeof value === 'string' ? value.trim() : value);
        if (cleanedValue === '') {
            cleanedValue = null;
        }
        
        if (key === 'ACTIVO') {
            data[key] = cleanedValue === 'TRUE';
        } else if (key === 'DETALLES') {
            data[key] = cleanedValue;
        } else if (key === 'FECHA COMPRA' || key === 'FECHA REVISADO') {
            data[key] = cleanedValue;
        } else {
            data[key] = cleanedValue ? String(cleanedValue).toUpperCase() : cleanedValue;
        }
    }

    // Validación mínima
    if (!data['NUMERO DE SERIE'] || data['NUMERO DE SERIE'] === 'NULL') {
        alert('Por favor, ingresa el Número de Serie.');
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from(TABLA_INVENTARIO)
            .insert([data]);

        if (error) {
            console.error('Error al insertar en Supabase:', error);
            if (error.code === '23505') { 
                alert(`Error: El equipo con número de serie ${data['NUMERO DE SERIE']} ya existe.`);
            } else {
                alert(`Error al guardar: ${error.message}`);
            }
        } else {
            alert('✅ Equipo agregado exitosamente!');
            formularioEquipo.reset(); 
            setFechaRevisadoActual(); 
            actualizarImagen();
        }
    } catch (e) {
        console.error('Error de conexión o inesperado:', e);
        alert('Ocurrió un error inesperado al intentar guardar el equipo.');
    }
}


// Inicializacion

document.addEventListener('DOMContentLoaded', function() {
    setFechaRevisadoActual();

    if (selectDispositivo) {
        selectDispositivo.addEventListener('change', actualizarImagen);
        setTimeout(actualizarImagen, 100); 
    }
    
    if (formularioEquipo) {
        // Envioo
        formularioEquipo.addEventListener('submit', agregarEquipoASupabase);
        //CONCATENACION
        const sucursalInput = document.getElementById('lugar_base');
        const dptoInput = document.getElementById('dpto_base');
        
        if (sucursalInput && dptoInput) {
             const updateLugarDpto = () => concatenarLugarDpto();
             sucursalInput.addEventListener('input', updateLugarDpto);
             dptoInput.addEventListener('input', updateLugarDpto);
             updateLugarDpto();
        }
    }
});