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

function calculateDaysAgo(isoDateString) {
    if (!isoDateString || typeof isoDateString !== 'string') return 'Sin Registro';

    const reviewDate = new Date(isoDateString);
    
    if (isNaN(reviewDate.getTime())) return 'Fecha inválida'; 

    const today = new Date();
    reviewDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const timeDiff = today.getTime() - reviewDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 0) return 'Hoy';
    if (daysDiff === 1) return '1 día';
    if (daysDiff < 0) return 'Futuro';
    return `${daysDiff} días`;
}

const modal = document.getElementById('itemModal');
const closeButton = document.querySelector('.close-button');

function showModal(data) {
    const brand = data.MARCA.toUpperCase();
    const imagePath = BRAND_IMAGES[brand] || BRAND_IMAGES['DEFAULT'];
    
    const modalImageContainer = document.getElementById('modal-image-container');
    modalImageContainer.innerHTML = `<img src="${imagePath}" alt="${data.MARCA} ${data.MODELO}" class="modal-device-image">`;

    document.getElementById('modal-title').textContent = `${data.MARCA} ${data.MODELO} (${data.DISP})`;
    document.getElementById('modal-subtitle').textContent = `S/N: ${data['NUMERO DE SERIE']}`;
    
    document.getElementById('modal-user').textContent = data.USUARIO || 'N/A';
    document.getElementById('modal-dpto').textContent = data['LUGAR_DPTO'] || 'N/A';
    
    // --- FECHA REVISADO ---
    const fechaRevisado = data['FECHA REVISADO'];
    document.getElementById('modal-date').textContent = fechaRevisado || 'Desconocido';
    document.getElementById('modal-days-ago').textContent = calculateDaysAgo(fechaRevisado);
    
    // --- FECHA COMPRA ---
    const fechaCompra = data['FECHA COMPRA'];
    document.getElementById('modal-buy-date').textContent = fechaCompra || 'Desconocido'; 
    document.getElementById('modal-buy-days-ago').textContent = calculateDaysAgo(fechaCompra);

    document.getElementById('modal-funciona').textContent = data.FUNCIONA || 'N/A';
    document.getElementById('modal-details-content').textContent = data.DETALLES || 'Sin detalles';

    modal.style.display = 'block';
}

closeButton.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

function renderTableFromObjects(data) {
    console.log("¡Renderizando la tabla! Número de filas:", data.length);
    if (data.length === 0) return;

    const allHeaders = Object.keys(data[0]); 
    const excludedHeaders = ['id', 'created_at'];

    const table = document.getElementById('inventoryTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    let headerRow = '<tr>';
    allHeaders.forEach(header => {
        if (!excludedHeaders.includes(header)) {
            headerRow += `<th>${header.replace('_', ' ')}</th>`;
        }
    });
    headerRow += '</tr>';
    thead.innerHTML = headerRow;

    data.forEach(item => {
        
        const numeroDeSerie = item['NUMERO DE SERIE'];
        if (!numeroDeSerie) {
            return; 
        }

        let bodyRow = document.createElement('tr');
        
        bodyRow.addEventListener('click', () => {
            showModal(item); 
        });

        allHeaders.forEach(key => { 
            if (excludedHeaders.includes(key)) return;
            
            const cellData = item[key] || ''; 
            let className = '';
            let displayData = cellData;

            if (key === 'MARCA') {
                const brand = String(cellData).toUpperCase();
                const imagePath = BRAND_IMAGES[brand] || BRAND_IMAGES['DEFAULT'];
                
                displayData = `<img src="${imagePath}" class="brand-icon" alt="${cellData}"> ${cellData}`;
            }

            if (key === 'FUNCIONA') {
                const value = String(cellData).toUpperCase();
                if (value === 'SI') {
                    className = 'funciona-si';
                } else if (value === 'DETALLE') {
                    className = 'funciona-detalle';
                } else if (value === 'NO') {
                    className = 'funciona-no';
                }
            }

            if (key === 'DETALLES' && String(cellData).length > 0) {
                className += ' detalles-presente';
            }

            if (key === 'ACTIVO') {
                const value = String(cellData).toUpperCase();
                if (value === 'TRUE') { 
                    displayData = '<i class="fa-solid fa-circle-check activo-si-icon"></i>';
                } else if (value === 'FALSE') {
                    displayData = '<i class="fa-solid fa-circle-xmark activo-no-icon"></i>';
                }
            }
            
            if (key === 'FECHA COMPRA') {
                // Formatear la fecha para visualización si no está vacía
                if (cellData) {
                    const parts = cellData.split('-'); // YYYY-MM-DD
                    displayData = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
                } else {
                    displayData = '';
                }
            }
            
            if (key === 'FECHA REVISADO') {
                // Formatear la fecha para visualización si no está vacía
                if (cellData) {
                    const parts = cellData.split('-'); // YYYY-MM-DD
                    displayData = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
                } else {
                    displayData = '';
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

async function fetchAndRenderFromSupabase() {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.style.display = 'block';

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        loadingDiv.innerHTML = '<i class="fa-solid fa-lock"></i> Acceso denegado. Redirigiendo...';
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500); 
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('inventario')                             //DE TABLA "inventario"
            .select('*')                                    //SELECCIONAR * (TODO)
            .order('id', { ascending: true });              //Y ORDENAR POR "ID", ASCENDENTE

        if (error) throw error;
        
        if (data.length === 0) {
            loadingDiv.innerHTML = '<i class="fa-solid fa-face-frown"></i> No hay datos en el inventario.';
            return;
        }

        renderTableFromObjects(data); 

    } catch (error) {
        console.error('Error al leer de Supabase:', error.message);
        loadingDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error al cargar: ${error.message}. ¿Estás logueado?`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

window.onload = fetchAndRenderFromSupabase;


// NUEVAS VARIABLES Y FUNCIONES DE HISTORIAL
const TABLA_HISTORIAL = 'historial_revisiones'; 
const historialButton = document.getElementById('crear-historial-button');

function formatDateKey(dateString) {
    if (!dateString) return 'NODATE';
    // Asume el formato YYYY-MM-DD de Supabase y lo convierte a YYYYMMDD
    return dateString.split('T')[0].replace(/-/g, ''); 
}

async function createIncidentHistory() {
    
    // 1. Consulta la tabla inventario por todos los equipos con estado 'DETALLE'
    const { data: incidentData, error: fetchError } = await supabaseClient
        .from('inventario')
        .select('"NUMERO DE SERIE", DETALLES, USUARIO, "FECHA REVISADO"')
        .eq('FUNCIONA', 'DETALLE');

    if (fetchError) {
        alert('Error al leer el inventario: ' + fetchError.message);
        return;
    }

    if (!incidentData || incidentData.length === 0) {
        alert('No se encontraron equipos con estado "DETALLE" para registrar historial.');
        return;
    }

    // 2. Mapea y prepara los datos para la nueva tabla, creando la clave compuesta
    const upsertData = incidentData.map(item => {
        const dateKey = formatDateKey(item['FECHA REVISADO']);
        const serialKey = item['NUMERO DE SERIE'] ? item['NUMERO DE SERIE'].trim().toUpperCase() : 'NOSERIAL';
        
        return {
            // Clave Única: YYYYMMDD-SERIALNUMBER (La llave que evitará duplicados)
            id_revision: `${dateKey}-${serialKey}`, 
            
            "NUMERO DE SERIE": item['NUMERO DE SERIE'], 
            DETALLES: item.DETALLES,
            USUARIO: item.USUARIO,
            "FECHA REVISADO": item['FECHA REVISADO']
        };
    });

    // 3. Usa UPSERT para insertar o actualizar si la id_revision ya existe
    const { error: upsertError } = await supabaseClient
        .from(TABLA_HISTORIAL)
        .upsert(upsertData, { 
            onConflict: 'id_revision', 
            ignoreDuplicates: false 
        }); 

    if (upsertError) {
        console.error("Error en Upsert:", upsertError);
        alert('Error al insertar/actualizar el historial: ' + upsertError.message);
    } else {
        alert(`Historial de ${upsertData.length} incidentes (creados/actualizados) registrado con éxito.`);
    }
}

// --- ENLACE AL BOTÓN DE HISTORIAL ---
if (historialButton) {
    historialButton.addEventListener('click', async () => {
        const originalText = historialButton.innerHTML;
        historialButton.disabled = true;
        historialButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> REGISTRANDO HISTORIAL...';
        
        await createIncidentHistory();
        
        historialButton.disabled = false;
        historialButton.innerHTML = originalText;
    });
}