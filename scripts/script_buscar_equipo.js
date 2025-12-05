const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SE ELIMINARON: BRAND_IMAGES, calculateDaysAgo, modal, closeButton, showModal, closeButton.onclick, window.onclick

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
    
    // Convertir el término de búsqueda a mayúsculas para coincidencia (similar al CSV)
    const upperSearchTerm = searchTerm.toUpperCase(); 

    loadingMessage.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
    tbody.innerHTML = '';

    try {
        // Buscar coincidencias parciales (case-insensitive LIKE) en USUARIO o LUGAR/DPTO
        const { data, error } = await supabaseClient
            .from('inventario')
            .select('*')
            .or(`USUARIO.ilike.%${upperSearchTerm}%,LUGAR_DPTO.ilike.%${upperSearchTerm}%,NUMERO DE SERIE.ilike.%${upperSearchTerm}%`);

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

// RENDERIZADO SIMPLE Y MODAL
function renderSimpleTable(data) {
    tbody.innerHTML = '';

    data.forEach(item => {
        let bodyRow = document.createElement('tr');
        
        // CORRECCIÓN CLAVE: Usar la función global showGlobalModal
        bodyRow.addEventListener('click', () => {
            if (typeof showGlobalModal === 'function') {
                showGlobalModal(item);
            } else {
                console.error("showGlobalModal no está definida. Asegúrate de cargar el script global del modal.");
            }
        });

        // Columna 1: USUARIO
        let tdUser = document.createElement('td');
        tdUser.textContent = item.USUARIO || 'N/A';
        bodyRow.appendChild(tdUser);

        // Columna 2: LUGAR/DPTO
        let tdLocation = document.createElement('td');
        tdLocation.textContent = item['LUGAR_DPTO'] || 'N/A';
        bodyRow.appendChild(tdLocation);
        
        // Columna 3: NUMERO DE SERIE
        let tdSerial = document.createElement('td');
        tdSerial.textContent = item['NUMERO DE SERIE'] || 'N/A';
        bodyRow.appendChild(tdSerial);

        tbody.appendChild(bodyRow);
    });
}