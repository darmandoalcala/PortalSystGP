const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLA_INVENTARIO = 'inventario';
const TABLA_HISTORIAL = 'historial_revisiones';

let currentPage = 1;
const itemsPerPage = 50;
let fullInventoryData = [];

function updateTablePagination() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedData = fullInventoryData.slice(start, end);
        const total = fullInventoryData.length;
        document.getElementById('pageInfo').textContent = `Mostrando ${start + 1} - ${Math.min(end, total)} de ${total}`;

        renderTableFromObjects(paginatedData);
}


function renderTableFromObjects(data) {
        if (data.length === 0) return;

        const flatData = data.map(item => {
                const usuarioInfo = item.usuarios || {};
                return {
                        ...item,
                        "USUARIO": usuarioInfo['NOMBRE COMPLETO'] || 'SIN ASIGNAR',
                        "LUGAR_DPTO": usuarioInfo['LUGAR_DPTO'] || (usuarioInfo['DEPARTAMENTO'] ? `${usuarioInfo['DEPARTAMENTO']} - ${usuarioInfo['ZONA'] || ''}` : 'N/A'),
                        usuarios: undefined
                };
        });

        const displayHeaders = ['ACTIVO', 'USUARIO', 'DISP', 'FUNCIONA', 'DETALLES', 'LUGAR_DPTO'];

        const table = document.getElementById('inventoryTable');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        thead.innerHTML = '';
        tbody.innerHTML = '';

        let headerRow = '<tr>';
        displayHeaders.forEach(header => {
                headerRow += `<th>${header.replace('_', ' ')}</th>`;
        });
        headerRow += '</tr>';
        thead.innerHTML = headerRow;

        flatData.forEach(item => {
                const numeroDeSerie = item['NUMERO DE SERIE'];
                if (!numeroDeSerie) return;

                let bodyRow = document.createElement('tr');
                bodyRow.addEventListener('click', () => {
                        if (typeof showGlobalModal === 'function') {
                                showGlobalModal(item);
                        }
                });

                displayHeaders.forEach(key => {
                        const cellData = item[key] || '';
                        let className = '';
                        let displayData = cellData;

                        if (key === 'FUNCIONA') {
                                const value = String(cellData).toUpperCase();
                                if (value === 'SI') className = 'funciona-si';
                                else if (value === 'DETALLE') className = 'funciona-detalle';
                                else if (value === 'NO') className = 'funciona-no';
                        }

                        if (key === 'DETALLES' && String(cellData).length > 0) {
                                className += ' detalles-presente';
                        }

                        if (key === 'ACTIVO') {
                                const value = String(cellData).toUpperCase();
                                displayData = (value === 'TRUE')
                                        ? '<i class="fa-solid fa-circle-check activo-si-icon"></i>'
                                        : '<i class="fa-solid fa-circle-xmark activo-no-icon"></i>';
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
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                return;
        }

        try {
                const { data, error } = await supabaseClient
                        .from('inventario')
                        .select(`
                                *,
                                usuarios (
                                        "NOMBRE COMPLETO",
                                        "LUGAR_DPTO"
                                )
                        `)
                        .order('id', { ascending: true });

                if (error) throw error;

                if (!data || data.length === 0) {
                        loadingDiv.innerHTML = '<i class="fa-solid fa-face-frown"></i> No hay datos en el inventario.';
                        return;
                }

                // Guardamos los datos completos y reiniciamos a la página 1
                fullInventoryData = data;
                currentPage = 1;
                updateTablePagination();

        } catch (error) {
                console.error('Error al leer de Supabase:', error.message);
                loadingDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error al cargar: ${error.message}`;
        } finally {
                loadingDiv.style.display = 'none';
        }
}

function updateTablePagination() {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedData = fullInventoryData.slice(start, end);

        const total = fullInventoryData.length;
        const infoText = document.getElementById('pageInfo');
        if (infoText) {
                infoText.textContent = `Mostrando ${start + 1} - ${Math.min(end, total)} de ${total}`;
        }

        // Deshabilitar botones si no hay más páginas
        document.getElementById('prevPage').disabled = (currentPage === 1);
        document.getElementById('nextPage').disabled = (end >= total);

        renderTableFromObjects(paginatedData);
}

document.getElementById('prevPage').onclick = () => {
        if (currentPage > 1) {
                currentPage--;
                updateTablePagination();
                window.scrollTo(0, 0); 
        }
};

document.getElementById('nextPage').onclick = () => {
        const maxPage = Math.ceil(fullInventoryData.length / itemsPerPage);
        if (currentPage < maxPage) {
                currentPage++;
                updateTablePagination();
                window.scrollTo(0, 0);
        }
};

window.onload = fetchAndRenderFromSupabase;

function formatDateKey(dateString) {
        if (!dateString) return 'NODATE';
        return dateString.split('T')[0].replace(/-/g, '');
}
