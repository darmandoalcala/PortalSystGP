const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLA_INVENTARIO = 'inventario';
const TABLA_HISTORIAL = 'historial_revisiones';

function renderTableFromObjects(data) {
        console.log("¡Renderizando la tabla! Número de filas:", data.length);
        if (data.length === 0) return;

        const flatData = data.map(item => {
                // Extraemos la info del usuario si existe
                const usuarioInfo = item.usuarios || {};

                // Retornamos un nuevo objeto combinando todo
                return {
                        ...item,
                        "USUARIO": usuarioInfo['NOMBRE COMPLETO'] || 'SIN ASIGNAR',
                        "LUGAR_DPTO": usuarioInfo['LUGAR_DPTO'] || (usuarioInfo['DEPARTAMENTO'] ? `${usuarioInfo['DEPARTAMENTO']} - ${usuarioInfo['ZONA'] || ''}` : 'N/A'),

                        usuarios: undefined
                };
        });

        // Usamos los datos aplanados de aquí en adelante
        const allHeaders = Object.keys(flatData[0]).filter(k => k !== 'usuarios');

        // Columnas que NO queremos VER en la tabla
        const excludedHeaders = ['id', 'created_at', 'id_usuario', 'usuarios','MARCA','MODELO','LUGARDPTO','FECHA COMPRA'];

        const table = document.getElementById('inventoryTable');
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');

        thead.innerHTML = '';
        tbody.innerHTML = '';

        let headerRow = '<tr>';
        allHeaders.forEach(header => {
                if (!excludedHeaders.includes(header)) {
                        // Reemplazamos guiones bajos y limpiamos un poco
                        headerRow += `<th>${header.replace('_', ' ')}</th>`;
                }
        });
        headerRow += '</tr>';
        thead.innerHTML = headerRow;

        flatData.forEach(item => {
                const numeroDeSerie = item['NUMERO DE SERIE'];
                if (!numeroDeSerie) return;

                let bodyRow = document.createElement('tr');

                bodyRow.addEventListener('click', () => {
                        if (typeof showGlobalModal === 'function') {
                                // Pasamos el item original (o flatData) al modal
                                showGlobalModal(item);
                        } else {
                                console.error("showGlobalModal no está definida.");
                        }
                });

                allHeaders.forEach(key => {
                        if (excludedHeaders.includes(key)) return;

                        const cellData = item[key] || '';
                        let className = '';
                        let displayData = cellData;

                        // --- Lógica de Colores y Formatos ---

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

                        if (key === 'FECHA COMPRA' || key === 'FECHA REVISADO') {
                                if (cellData) {
                                        const parts = cellData.split('-');
                                        if (parts.length === 3) displayData = `${parts[2]}/${parts[1]}/${parts[0]}`;
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
                setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                return;
        }

        try {
                // --- CONSULTA CORREGIDA CON JOIN ---
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

                renderTableFromObjects(data);

        } catch (error) {
                console.error('Error al leer de Supabase:', error.message);
                loadingDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error al cargar: ${error.message}`;
        } finally {
                loadingDiv.style.display = 'none';
        }
}

window.onload = fetchAndRenderFromSupabase;

// --- LÓGICA DEL HISTORIAL (Sin cambios mayores, solo asegurando lectura) ---

const historialButton = document.getElementById('crear-historial-button');

function formatDateKey(dateString) {
        if (!dateString) return 'NODATE';
        return dateString.split('T')[0].replace(/-/g, '');
}

async function createIncidentHistory() {

        const { data: incidentData, error: fetchError } = await supabaseClient
                .from('inventario')
                .select(`
                "NUMERO DE SERIE", 
                DETALLES, 
                "FECHA REVISADO", 
                FUNCIONA,
                usuarios ("NOMBRE COMPLETO")
        `)
                .not('DETALLES', 'is', null)
                .neq('DETALLES', '');

        if (fetchError) {
                alert('Error al leer el inventario: ' + fetchError.message);
                return;
        }

        if (!incidentData || incidentData.length === 0) {
                alert('No se encontraron equipos con detalles para registrar historial.');
                return;
        }

        const upsertData = incidentData.map(item => {
                const dateKey = formatDateKey(item['FECHA REVISADO']);
                const serialKey = item['NUMERO DE SERIE'] ? item['NUMERO DE SERIE'].trim().toUpperCase() : 'NOSERIAL';

                // Obtenemos el nombre desde la relación
                const nombreUsuario = item.usuarios ? item.usuarios['NOMBRE COMPLETO'] : 'SIN USUARIO';

                return {
                        id_revision: `${dateKey}-${serialKey}`,
                        "NUMERO DE SERIE": item['NUMERO DE SERIE'],
                        DETALLES: item.DETALLES,
                        USUARIO: nombreUsuario, // Guardamos el texto del nombre en el historial
                        "FECHA REVISADO": item['FECHA REVISADO'],
                        FUNCIONA: item.FUNCIONA 
                };
        });

        const { error: upsertError } = await supabaseClient
                .from('historial_revisiones')
                .upsert(upsertData, {
                        onConflict: 'id_revision',
                        ignoreDuplicates: false
                });

        if (upsertError) {
                console.error("Error en Upsert:", upsertError);
                alert('Error al insertar historial: ' + upsertError.message);
        } else {
                alert(`Historial de ${upsertData.length} incidentes registrado con éxito.`);
        }
}

if (historialButton) {
        historialButton.addEventListener('click', async () => {
                const originalText = historialButton.innerHTML;
                historialButton.disabled = true;
                historialButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> REGISTRANDO...';
                await createIncidentHistory();
                historialButton.disabled = false;
                historialButton.innerHTML = originalText;
        });
}