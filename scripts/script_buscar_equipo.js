const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const tbody = document.getElementById('inventoryTable').querySelector('tbody');
const loadingMessage = document.getElementById('loadingMessage');

searchButton.addEventListener('click', searchInventory);

// Permitir buscar con ENTER
searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        searchInventory();
    }
});

async function searchInventory() {
    const searchTerm = searchInput.value.trim();

    if (searchTerm.length < 3) {
        loadingMessage.textContent = 'Por favor, introduce al menos 3 caracteres.';
        tbody.innerHTML = '';
        return;
    }
    
    const upperSearchTerm = searchTerm.toUpperCase(); 

    loadingMessage.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
    tbody.innerHTML = '';

    try {
        // 1. TRAEMOS TODO EL INVENTARIO + DATOS DE USUARIOS
        // (Quitamos el .or() de aquí para filtrar en memoria)
        const { data, error } = await supabaseClient
            .from('inventario')
            .select(`
                *,
                usuarios (
                    "NOMBRE COMPLETO",
                    "LUGAR_DPTO",
                    "DEPARTAMENTO"
                )
            `);

        if (error) throw error;

        if (!data || data.length === 0) {
            loadingMessage.textContent = `❌ Base de datos vacía.`;
            return;
        }

        // 2. FILTRADO EN JAVASCRIPT (Aquí es donde buscamos en todas partes)
        const filteredData = data.filter(item => {
            // Obtenemos los valores en mayúsculas para comparar
            const serial = (item['NUMERO DE SERIE'] || '').toUpperCase();
            
            const usuarioInfo = item.usuarios || {};
            const nombre = (usuarioInfo['NOMBRE COMPLETO'] || '').toUpperCase();
            const lugar = (usuarioInfo['LUGAR_DPTO'] || '').toUpperCase();
            const depto = (usuarioInfo['DEPARTAMENTO'] || '').toUpperCase();

            // Retornamos TRUE si el término está en CUALQUIERA de estos campos
            return serial.includes(upperSearchTerm) || 
                   nombre.includes(upperSearchTerm) || 
                   lugar.includes(upperSearchTerm) || 
                   depto.includes(upperSearchTerm);
        });

        // 3. VERIFICAR RESULTADOS DEL FILTRO
        if (filteredData.length === 0) {
            loadingMessage.textContent = `❌ No se encontraron equipos para "${searchTerm}".`;
            return;
        }

        renderSimpleTable(filteredData);
        loadingMessage.textContent = `✅ ${filteredData.length} resultados encontrados.`;

    } catch (error) {
        console.error('Error de búsqueda:', error);
        loadingMessage.textContent = 'Hubo un error al conectar con la base de datos.';
    }
}

function renderSimpleTable(data) {
    tbody.innerHTML = '';

    const flatData = data.map(item => {
        const usuarioInfo = item.usuarios || {};
        
        let dpto = 'N/A';
        // Lógica de prioridad de departamento
        if (usuarioInfo['LUGAR_DPTO']) {
            dpto = usuarioInfo['LUGAR_DPTO'];
        } else if (usuarioInfo['DEPARTAMENTO']) {
            dpto = usuarioInfo['DEPARTAMENTO'];
        }

        return {
            ...item,
            "USUARIO_DISPLAY": usuarioInfo['NOMBRE COMPLETO'] || 'SIN ASIGNAR',
            "LUGAR_DISPLAY": dpto
        };
    });

    flatData.forEach(item => {
        let bodyRow = document.createElement('tr');
        
        bodyRow.addEventListener('click', () => {
            if (typeof showGlobalModal === 'function') {
                showGlobalModal(item);
            } else {
                console.error("showGlobalModal no está definida.");
            }
        });

        let tdUser = document.createElement('td');
        tdUser.textContent = item['USUARIO_DISPLAY'];
        bodyRow.appendChild(tdUser);

        let tdLocation = document.createElement('td');
        tdLocation.textContent = item['LUGAR_DISPLAY'];
        bodyRow.appendChild(tdLocation);
        
        let tdSerial = document.createElement('td');
        tdSerial.textContent = item['NUMERO DE SERIE'] || 'N/A';
        bodyRow.appendChild(tdSerial);

        tbody.appendChild(bodyRow);
    });
}