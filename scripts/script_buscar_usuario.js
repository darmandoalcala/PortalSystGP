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

function calculateDaysAgo(dateString) {
    if (!dateString || typeof dateString !== 'string' || dateString.length < 8) return 'Sin Registro';

    let dateParts;
    let reviewDate;

    // Detectar el formato de fecha:
    if (dateString.includes('/')) {
        // Formato: DD/MM/AAAA (Usado en el CSV)
        dateParts = dateString.split('/');
        // Crear fecha: new Date(AAAA, MM - 1, DD)
        reviewDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    } else {
        // Formato: YYYY-MM-DD (Usado en Supabase/ISO)
        reviewDate = new Date(dateString);
    }

    // Si la fecha es inválida (ej. texto incorrecto o formato roto)
    if (isNaN(reviewDate.getTime())) return 'Fecha inválida'; 

    const today = new Date();
    // Resetear horas para cálculo exacto de días
    reviewDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const timeDiff = today.getTime() - reviewDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff === 0) return 'Hoy';
    if (daysDiff === 1) return '1 día';
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


const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const tbody = document.getElementById('inventoryTable').querySelector('tbody');
const loadingMessage = document.getElementById('loadingMessage');

searchButton.addEventListener('click', searchInventory);

async function searchInventory() {
    const searchTerm = searchInput.value.trim();

    if (searchTerm.length < 3) {
        loadingMessage.textContent = 'Por favor, introduce al menos 3 caracteres.';
        tbody.innerHTML = '';
        return;
    }

    loadingMessage.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
    tbody.innerHTML = '';

    try {
        // Buscar coincidencias parciales (case-insensitive LIKE) en USUARIO o LUGAR/DPTO
        const { data, error } = await supabaseClient
            .from('inventario')
            .select('*')
            .or(`USUARIO.ilike.%${searchTerm}%,LUGAR_DPTO.ilike.%${searchTerm}%`);

        if (error) throw error;

        if (data.length === 0) {
            loadingMessage.textContent = `❌ No se encontraron equipos para "${searchTerm}".`;
            return;
        }

        renderSimpleTable(data);
        loadingMessage.textContent = `✅ ${data.length} resultados encontrados.`;

    } catch (error) {
        console.error('Error de búsqueda:', error);
        loadingMessage.textContent = 'Hubo un error al conectar con la base de datos.';
    }
}

// =========================================================
// RENDERIZADO SIMPLE Y MODAL
// =========================================================

function renderSimpleTable(data) {
    tbody.innerHTML = '';

    data.forEach(item => {
        let bodyRow = document.createElement('tr');
        
        // Adjuntar el objeto completo al click para que el modal funcione
        bodyRow.addEventListener('click', () => {
            showModal(item);
        });

        // Columna 1: USUARIO
        let tdUser = document.createElement('td');
        tdUser.textContent = item.USUARIO || 'N/A';
        bodyRow.appendChild(tdUser);

        // Columna 2: LUGAR/DPTO
        let tdLocation = document.createElement('td');
        tdLocation.textContent = item['LUGAR_DPTO'] || 'N/A';
        bodyRow.appendChild(tdLocation);
        
        // Columna 3: NUMERO DE SERIE (Oculto o para referencia)
        let tdSerial = document.createElement('td');
        tdSerial.textContent = item['NUMERO DE SERIE'] || 'N/A';
        bodyRow.appendChild(tdSerial);

        tbody.appendChild(bodyRow);
    });
}