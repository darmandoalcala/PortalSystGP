const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const columnMapping = {
    'NUMERO DE SERIE': 'NUMERO DE SERIE', 
    'MARCA': 'MARCA',
    'MODELO': 'MODELO',
    'DISP': 'DISP',
    'USUARIO': 'USUARIO',
    'LUGAR_DPTO': 'LUGAR_DPTO',
    'FECHA COMPRA': 'FECHA COMPRA',
    'FECHA REVISADO': 'FECHA REVISADO',
    'FUNCIONA': 'FUNCIONA',
    'DETALLES': 'DETALLES',
    'ACTIVO': 'ACTIVO' 
};

function calculateDaysAgo(dateString) {
    if (!dateString || typeof dateString !== 'string' || dateString.length < 8) return 'Sin Registro';

    let dateParts;
    let reviewDate;

    if (dateString.includes('/')) {
        dateParts = dateString.split('/');
        reviewDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    } else {
        reviewDate = new Date(dateString);
    }

    if (isNaN(reviewDate.getTime())) return 'Fecha inválida'; 

    const today = new Date();
    reviewDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const timeDiff = today.getTime() - reviewDate.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) return 'Fecha futura';
    if (daysDiff === 0) return 'Hoy';
    if (daysDiff === 1) return '1 día';
    return `${daysDiff} días`;
}

async function checkAuthAndRedirect() {
    const messageElement = document.getElementById('message');
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        if (messageElement) messageElement.innerHTML = '<i class="fa-solid fa-lock"></i> Debes iniciar sesión para subir datos. Redirigiendo...';
        if (uploadButton) uploadButton.disabled = true;
        if (loadButton) loadButton.disabled = true;

        setTimeout(() => window.location.href = 'index.html', 1500); 
        return false;
    }
    return true;
}

const csvFile = document.getElementById('csvFile');
const loadButton = document.getElementById('loadButton');
const uploadButton = document.getElementById('uploadButton');
let fileContent = null; 

csvFile.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        
        Papa.parse(file, {
            complete: function(results) {
                if (results.errors.length) {
                    console.error('Error al pre-parsear el archivo:', results.errors);
                    alert('Error al leer el archivo. Revisa el formato.');
                    fileContent = null;
                    loadButton.disabled = true;
                    uploadButton.disabled = true;
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(evt) {
                    fileContent = evt.target.result; 
                    loadButton.disabled = false;
                };
                reader.readAsText(file, 'UTF-8');
            },
            download: true,
            preview: 1, 
            header: true 
        });
    } else {
        fileContent = null;
        loadButton.disabled = true;
        uploadButton.disabled = true;
    }
});

loadButton.addEventListener('click', function() {
    if (fileContent) {
        renderTable(fileContent);
        loadButton.disabled = true;
        uploadButton.disabled = false;
        uploadButton.textContent = 'SUBIR TABLA A BASE DE DATOS';
    }
});

function renderTable(csv) {
    const results = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        delimiter: ',', 
        trimHeaders: true,
        dynamicTyping: true, 
    });

    if (results.errors.length) {
        console.error('Errores al parsear para mostrar:', results.errors);
        alert('Hubo errores al procesar el CSV para la tabla. Revisar consola.');
        return;
    }

    const headers = results.meta.fields;
    const data = results.data;

    const table = document.getElementById('inventoryTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    let headerRow = '<tr>';
    headers.forEach(header => {
        headerRow += `<th>${header}</th>`;
    });
    headerRow += '</tr>';
    thead.innerHTML = headerRow;

    data.forEach(rowDataObject => {
        const serialNumber = rowDataObject['NUMERO DE SERIE'];
        if (!serialNumber || String(serialNumber).trim() === '') {
            return;
        }

        let bodyRow = document.createElement('tr');
        
        const diasRevisado = calculateDaysAgo(rowDataObject['FECHA REVISADO']);
        if (diasRevisado.includes('días')) {
            const days = parseInt(diasRevisado.replace(' días', ''), 10);
            if (days > 730) {
                bodyRow.classList.add('status-antiguo'); 
            } else if (days > 365) {
                bodyRow.classList.add('status-medio'); 
            }
        } else if (diasRevisado.includes('Hoy') || diasRevisado.includes('1 día')) {
            bodyRow.classList.add('status-reciente');
        }

        // Se eliminó el eventListener de click a la fila.

        headers.forEach(header => {
            let cellData = rowDataObject[header] || '';
            let className = '';
            let displayData = cellData;

            // Se eliminó la lógica de imágenes de MARCA. La marca se mostrará como texto plano.
            
            if (header === 'FUNCIONA') {
                const rawValue = String(cellData).toUpperCase().trim();
                let normalizedValue = '';
                
                if (rawValue.includes('SI') || rawValue === '1' || rawValue === 'TRUE') {
                    normalizedValue = 'SI';
                } else if (rawValue.includes('NO') || rawValue === '0' || rawValue === 'FALSE') {
                    normalizedValue = 'NO';
                } else if (rawValue.includes('DETALLE') || rawValue.includes('AVERIA')) {
                    normalizedValue = 'DETALLE';
                }

                if (normalizedValue === 'SI') {
                    className = 'funciona-si'; 
                } else if (normalizedValue === 'DETALLE') {
                    className = 'funciona-detalle'; 
                } else if (normalizedValue === 'NO') {
                    className = 'funciona-no'; 
                }
            }

            if (header === 'DETALLES' && String(cellData).length > 0) {
                className += ' detalles-presente';
            }

            if (header === 'ACTIVO') {
                const value = String(cellData);
                if (value === '1' || value.toLowerCase() === 'true') {
                    displayData = '<i class="fa-solid fa-circle-check activo-si-icon"></i>';
                } else if (value === '0' || value.toLowerCase() === 'false') {
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

uploadButton.addEventListener('click', function() {
    if(fileContent){
        uploadDataToDataBase(fileContent);
        uploadButton.disabled = true;
    }
})

async function uploadDataToDataBase(csv) {
    if (!await checkAuthAndRedirect()) return;

    const results = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        delimiter: ',', 
        trimHeaders: true,
        dynamicTyping: false
    });

    if (results.errors.length) {
        console.error('Errores al parsear para subir a BD:', results.errors);
        alert('Hubo errores al procesar el CSV para la subida. Revisar consola.');
        return;
    }

    const parsedData = results.data;
    const dataToInsert = [];

    parsedData.forEach(rowObject => {
        let cleanObject = {};
        
        for (const csvHeader in columnMapping) {
            const dbColumn = columnMapping[csvHeader];
            let value = rowObject[csvHeader]; 
            
            if (value === undefined || value === null || (typeof value === 'string' && String(value).trim() === '')) {
                value = null;
            } else if (typeof value === 'string') {
                value = value.trim();
            }

            if (dbColumn === 'ACTIVO' && value !== null) { 
                value = (String(value) === '1' || String(value).toLowerCase() === 'true'); 
            }

            if ((dbColumn === 'FECHA REVISADO' || dbColumn === 'FECHA COMPRA') && value && typeof value === 'string' && value.includes('/')) {
                const parts = value.split('/');
                if (parts.length === 3) {
                    value = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`; 
                } else {
                    value = null; 
                }
            }

            cleanObject[dbColumn] = value;
        }

        const serial = cleanObject['NUMERO DE SERIE'];
        if (serial !== null && String(serial).trim() !== '') {
            dataToInsert.push(cleanObject);
        }
    });
    
    try {
        const uploadButton = document.getElementById('uploadButton'); 
        if (uploadButton) {
            uploadButton.disabled = true; 
            uploadButton.textContent = 'Subiendo...';
        }
        
        if (dataToInsert.length === 0) {
            alert('No hay datos válidos para subir (revisa que el "NUMERO DE SERIE" no esté vacío).');
            return;
        }

        const { error } = await supabaseClient
            .from('inventario')
            .upsert(dataToInsert, {
                onConflict: 'NUMERO DE SERIE' 
            });

        if (error) throw error;

        alert(`Base de datos actualizada: ${dataToInsert.length} Equipos actualizados o dados de alta.`);
        
    } catch (error) {
        console.error('Error al subir a Supabase:', error.message);
        alert('Error al subir los datos: ' + error.message);
    } finally {
        if (uploadButton) {
            uploadButton.disabled = false;
            uploadButton.textContent = 'SUBIR TABLA A BASE DE DATOS';
        }
    }
}