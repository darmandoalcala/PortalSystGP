const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BRAND_IMAGES = {
    'LENOVO': 'img/lenovo_logo.png',
    'HP': 'img/hp_logo.png',
    'DELL': 'img/dell_logo.png',
    'ASUS': 'img/asus_logo.png',
    'MSI': 'img/msi_logo.png',
    'ACER': 'img/acer_logo.png',
    'DEFAULT': 'img/default_logo.png'
};

//FECHAS IMPORTANTE: admitir formato de sql 
function calculateDaysAgo(isoDateString) {
    if (!isoDateString || typeof isoDateString !== 'string') return 'Fecha inválida';

    // Crear la fecha directamente del formato YYYY-MM-DD de Supabase
    const reviewDate = new Date(isoDateString);
    
    // Verificar si la fecha es válida. Esto falla si el string no es ISO
    if (isNaN(reviewDate.getTime())) return 'Fecha inválida'; 

    const today = new Date();
    // Resetear horas para cálculo exacto de días
    reviewDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const timeDiff = today.getTime() - reviewDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 0) return 'Hoy';
    if (daysDiff === 1) return '1 día';
    if (daysDiff < 0) return 'Futuro'; // En caso de error
    return `${daysDiff} días`;
}

//MoDAL: Recibe un OBJETO -> rowObject
const modal = document.getElementById('itemModal');
const closeButton = document.querySelector('.close-button');

function showModal(item) { // item es un objeto { ID: 1, MARCA: 'HP', ... }
    // Asignación directa por nombre de propiedad
    const brand = item.MARCA ? item.MARCA.toUpperCase() : 'DEFAULT';
    const imagePath = BRAND_IMAGES[brand] || BRAND_IMAGES['DEFAULT'];
    
    // Poblar contenedor de imagen
    const modalImageContainer = document.getElementById('modal-image-container');
    modalImageContainer.innerHTML = `<img src="${imagePath}" alt="${item.MARCA || ''} ${item.MODELO || ''}" class="modal-device-image">`;

    // Título y Subtítulo
    document.getElementById('modal-title').textContent = `${item.MARCA || ''} ${item.MODELO || ''} (${item.DISPOSITIVO || ''})`; // MARCA MODELO (DISP)
    document.getElementById('modal-subtitle').textContent = `S/N: ${item['NUMERO DE SERIE'] || ''}`; // NUMERO DE SERIE
    
    // Cuerpo
    document.getElementById('modal-user').textContent = item.USUARIO || 'N/A';
    document.getElementById('modal-dpto').textContent = item.DEPARTAMENTO || 'N/A';
    
    // Usamos el formato ISO de Supabase (item.FECHA_REVISADO) para mostrarlo
    document.getElementById('modal-date').textContent = item.FECHA_REVISADO || 'N/A'; 
    // Usamos el formato ISO de Supabase para el cálculo
    document.getElementById('modal-days-ago').textContent = calculateDaysAgo(item.FECHA_REVISADO); 

    // Detalles del estado
    document.getElementById('modal-funciona').textContent = item.FUNCIONA || 'N/A';
    document.getElementById('modal-details-content').textContent = item.DETALLES || 'Sin detalles';
    
    modal.style.display = 'block';
}

// CERRAR MODAL 
closeButton.onclick = function() {
    modal.style.display = 'none';
}
//Cerrar modal 
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// 3. FUNCIÓN DE RENDERIZADO DE OBJETOS DE SUPABASE

/**
 * Renderiza la tabla a partir de un array de objetos (la respuesta de Supabase).
 * @param {Array<Object>} data - Array de objetos devuelto por Supabase.
 */
function renderTableFromObjects(data) {
    console.log("¡Renderizando la tabla! Número de filas:", data.length);
    if (data.length === 0) return;

    // Obtener las claves (headers) del primer objeto
    const headers = Object.keys(data[0]); 

    const table = document.getElementById('inventoryTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // CABECERA
    let headerRow = '<tr>';
    headers.forEach(header => {
        headerRow += `<th>${header}</th>`;
    });
    headerRow += '</tr>';
    thead.innerHTML = headerRow;

    // FILAS DE DATOS
    data.forEach(item => { // item es el objeto de Supabase
        
        // Comprobación defensiva del Serial Number
        const numeroDeSerie = item['NUMERO DE SERIE'];
        if (!numeroDeSerie) {
            return; // salta la fila si no tiene número de serie
        }

        let bodyRow = document.createElement('tr');
        
        // Al hacer click, pasamos el OBJETO COMPLETO
        bodyRow.addEventListener('click', () => {
            showModal(item); 
        });

        headers.forEach(key => { 
            const cellData = item[key] || ''; 
            let className = '';
            let displayData = cellData;

            // IMAGEN MINIATURA (Opcional: Podrías poner un ícono)
            if (key === 'MARCA') {
                const brand = cellData.toUpperCase();
                const imagePath = BRAND_IMAGES[brand] || BRAND_IMAGES['DEFAULT'];
            }

            // FUNCIONA
            if (key === 'FUNCIONA') {
                const value = cellData.toUpperCase();
                if (value === 'SI') {
                    className = 'funciona-si';
                } else if (value === 'DETALLE') {
                    className = 'funciona-detalle';
                } else if (value === 'NO') {
                    className = 'funciona-no';
                }
            }

            // DETALLES
            if (key === 'DETALLES' && cellData.length > 0) {
                className += ' detalles-presente';
            }

            // ACTIVO (asumo que es un booleano o 1/0 en Supabase)
            if (key === 'ACTIVO') {
                const value = String(cellData).toUpperCase();
                if (value === '1' || value === 'TRUE') { 
                    displayData = '<i class="fa-solid fa-circle-check activo-si-icon"></i>';
                } else if (value === '0' || value === 'FALSE') {
                    displayData = '<i class="fa-solid fa-circle-xmark activo-no-icon"></i>';
                }
            }

            const td = document.createElement('td');
            td.className = className.trim();
            td.innerHTML = displayData;
            bodyRow.appendChild(td);
        });
        
        tbody.appendChild(bodyRow);
    });
}


// FUNCIÓN PRINCIPAL: LEER DE SUPABASE AL CARGAR
async function fetchAndRenderFromSupabase() {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = 'block';

    //Verificar la sesión iniciada
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        // Si no hay sesión, redirige al login
        loadingDiv.innerHTML = '<i class="fa-solid fa-lock"></i> Acceso denegado. Redirigiendo...';
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500); 
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('inventario')
            .select('*') 
            .order('MARCA', { ascending: true }); 

        if (error) throw error;
        
        if (data.length === 0) {
            loadingDiv.innerHTML = '<i class="fa-solid fa-face-frown"></i> No hay datos en el inventario.';
            return;
        }
        //Llamada a render
        renderTableFromObjects(data); 

    } catch (error) {
        console.error('Error al leer de Supabase:', error.message);
        loadingDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error al cargar: ${error.message}. ¿Estás logueado?`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// INICIO AUTOMÁTICO AL CARGAR LA PÁGINA
window.onload = fetchAndRenderFromSupabase;

