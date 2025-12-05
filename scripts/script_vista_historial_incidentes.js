const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLA_HISTORIAL = 'historial_revisiones';
const loadingDiv = document.getElementById('loading');
const historialTableBody = document.getElementById('historialTable').querySelector('tbody');


function formatDateDisplay(isoDateString) {
    if (!isoDateString) return 'N/A';
    const parts = String(isoDateString).split('-'); 
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`; 
    }
    return isoDateString;
}


function renderHistorialTable(data) {
    historialTableBody.innerHTML = '';
    
    if (!data || data.length === 0) {
        loadingDiv.textContent = 'No se encontraron registros de historial.';
        return;
    }

    data.forEach(item => {
        let bodyRow = document.createElement('tr');
        
        let tdFecha = document.createElement('td');
        tdFecha.textContent = formatDateDisplay(item['FECHA REVISADO']);
        bodyRow.appendChild(tdFecha);

        let tdSerial = document.createElement('td');
        tdSerial.textContent = item['NUMERO DE SERIE'] || 'N/A';
        bodyRow.appendChild(tdSerial);
        
        let tdEstado = document.createElement('td');
        tdEstado.textContent = item['FUNCIONA'] || 'N/A';
        const estadoText = tdEstado.textContent.toUpperCase();
        if (estadoText === 'SI'){tdEstado.classList.add('funciona-si');}
        else if (estadoText === 'NO'){tdEstado.classList.add('funciona-no');}
        else if (estadoText === 'DETALLE'){tdEstado.classList.add('funciona-detalle');}

        bodyRow.appendChild(tdEstado);

        let tdUsuario = document.createElement('td');
        tdUsuario.textContent = item.USUARIO || 'N/A';
        bodyRow.appendChild(tdUsuario);

        let tdDetalles = document.createElement('td');
        const detallesText = item.DETALLES || 'Sin comentarios';
        tdDetalles.textContent = detallesText; 
        if (detallesText !== 'Sin comentarios' && detallesText.length > 0) {
            tdDetalles.classList.add('detalles-presente'); 
        }
        bodyRow.appendChild(tdDetalles);

        historialTableBody.appendChild(bodyRow);
    });
    loadingDiv.textContent = `${data.length} registros cargados.`;
}

async function fetchHistorial() {
    loadingDiv.style.display = 'block';
    historialTableBody.innerHTML = ''; 

    try {
        const { data, error } = await supabaseClient
            .from(TABLA_HISTORIAL)
            .select('id_revision, "NUMERO DE SERIE", DETALLES, USUARIO, "FECHA REVISADO", FUNCIONA')
            .order('FECHA REVISADO', { ascending: false });

        if (error) throw error;
        
        renderHistorialTable(data);

    } catch (error) {
        console.error('Error al cargar historial:', error.message);
        loadingDiv.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error al cargar el historial: ${error.message}`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// --- 3. INICIALIZACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    fetchHistorial(); 
});