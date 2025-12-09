
//SUPABASE
const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLA_INVENTARIO = 'inventario';

//DOM
const loadingDiv = document.getElementById('loading');
const recordCountSpan = document.getElementById('record-count');
const countDescriptionSpan = document.getElementById('count-description');
const exportButton = document.getElementById('exportButton');
const exportMessage = document.getElementById('export-message');

//CONTEO INICIAL Y AUTENTICACION
async function fetchRecordCount() {
    loadingDiv.style.display = 'block';
    
    // 1. Verificar Autenticacion
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        loadingDiv.innerHTML = '<i class="fa-solid fa-lock"></i> Acceso denegado. Redirigiendo...';
        setTimeout(() => { window.location.href = 'index.html'; }, 1500); 
        return 0;
    }

    try {
        // contar rows
        const { count, error } = await supabaseClient
            .from(TABLA_INVENTARIO)
            .select('*', { count: 'exact', head: true }); // head

        if (error) throw error;

        recordCountSpan.textContent = count;
        
        if (count > 0) {
            countDescriptionSpan.textContent = `Registros listos para descargar.`;
            exportButton.disabled = false;
        } else {
            countDescriptionSpan.textContent = `No hay registros en la base de datos.`;
            exportButton.disabled = true;
        }
        
        return count;

    } catch (error) {
        console.error('Error al contar registros:', error.message);
        exportMessage.textContent = `Error al cargar: ${error.message}`;
        recordCountSpan.textContent = 'X';
        exportButton.disabled = true;
        return 0;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

// EXPORTAR DATOS Y DESCARGAR CSV
async function exportToCSV() {
    exportButton.disabled = true;
    exportButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando CSV...';
    exportMessage.textContent = '';
    
    try {
        // Select datos de bd
        const { data, error } = await supabaseClient
            .from(TABLA_INVENTARIO)
            .select('*');

        if (error) throw error;
        if (!data || data.length === 0) {
            exportMessage.textContent = 'Error: No se encontraron datos para exportar.';
            return;
        }
        
        const processedData = data.map(item => {
            let newItem = {};
            
            const excludedKeys = ['created_at']; 

            for (const key in item) {
                if (excludedKeys.includes(key)) {
                    continue; // Saltar columnas excluidas
                }

                let value = item[key];
                
                // 2. Transformar el booleano ACTIVO a 1 o 0
                if (key === 'ACTIVO' && value !== null) {
                    value = value === true ? 1 : 0;
                }
                
                newItem[key] = value;
            }
            return newItem;
        });

        // 4. Convertir datos JSON a  CSV
        const csv = Papa.unparse(processedData, {
            delimiter: ',', 
            quotes: true
        });

        // Crea el BLOB y URL
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Formatea el nombre del archivo: inventario_dd_mm_aaaa.csv
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const filename = `inventario_${day}_${month}_${year}.csv`;

        // 7. Crear enlace de descarga y simular click
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        exportMessage.textContent = `✅ ${data.length} registros descargados como ${filename}.`;

    } catch (error) {
        console.error('Error durante la exportación:', error.message);
        exportMessage.textContent = `Error al descargar: ${error.message}`;
    } finally {
        exportButton.disabled = false;
        exportButton.innerHTML = '<i class="fa-solid fa-download"></i> Descargar Inventario';
        fetchRecordCount(); 
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchRecordCount();
    exportButton.addEventListener('click', exportToCSV);
});