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

async function checkAuthAndRedirect() {
    const messageElement = document.getElementById('message');
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        messageElement.innerHTML = '<i class="fa-solid fa-lock"></i> Debes iniciar sesión para subir datos. Redirigiendo...';
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
        const reader = new FileReader();
        reader.onload = function(evt) {
            fileContent = evt.target.result; 
            loadButton.disabled = false;
        };
        reader.readAsText(file, 'UTF-8');
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
        uploadButton.textContent = 'Subir CSV a Base de Datos';
    }
});

function renderTable(csv) {
    const results = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        delimiter: ';',
        trimHeaders: true
    });

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
        if (!rowDataObject['NUMERO DE SERIE']) {
            return;
        }

        let bodyRow = document.createElement('tr');
        
        bodyRow.addEventListener('click', () => {
            showModal(rowDataObject);
        });

        headers.forEach(header => {
            let cellData = rowDataObject[header] || '';
            let className = '';
            let displayData = cellData;

            if (header === 'MARCA') {
                const brand = cellData.toUpperCase();
                const imagePath = BRAND_IMAGES[brand] || BRAND_IMAGES['DEFAULT'];
                displayData = `<img src="${imagePath}" class="brand-icon" alt="${cellData}"> ${cellData}`;
            }

            if (header === 'FUNCIONA') {
                const value = cellData.toUpperCase();
                if (value === 'SI') {
                    className = 'funciona-si';
                } else if (value === 'DETALLE') {
                    className = 'funciona-detalle';
                } else if (value === 'NO') {
                    className = 'funciona-no';
                }
            }

            if (header === 'DETALLES' && cellData.length > 0) {
                className += ' detalles-presente';
            }

            if (header === 'ACTIVO') {
                const value = cellData.toString();
                if (value === '1') {
                    displayData = '<i class="fa-solid fa-circle-check activo-si-icon"></i>';
                } else if (value === '0') {
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
        delimiter: ';',
        trimHeaders: true
    });

    const parsedData = results.data;
    const dataToInsert = [];

    parsedData.forEach(rowObject => {
        let cleanObject = {};

        for (const headerName in rowObject) {
            let value = rowObject[headerName];

            if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
                value = null;
            } else if (typeof value === 'string') {
                value = value.trim();
            }

            if (headerName.toUpperCase() === 'ID') {
                continue; 
            }

            if (headerName.toUpperCase() === 'ACTIVO') {
                value = value === '1'; 
            }
            
            if (headerName === 'FECHA REVISADO' && value && typeof value === 'string' && value.includes('/')) {
                const parts = value.split('/');
                value = `${parts[2]}-${parts[1]}-${parts[0]}`; 
            }

            if (headerName === 'FECHA COMPRA' && value && typeof value === 'string' && value.includes('/')) {
                const parts = value.split('/');
                value = `${parts[2]}-${parts[1]}-${parts[0]}`; 
            }

            cleanObject[headerName] = value;
        }

        if (cleanObject["NUMERO DE SERIE"] !== null) {
            dataToInsert.push(cleanObject);
        }
    });
    
    try {
        const uploadButton = document.getElementById('uploadButton'); 
        if (uploadButton) {
            uploadButton.disabled = true; 
            uploadButton.textContent = 'Subiendo...';
        }

        const { error } = await supabaseClient
            .from('inventario')
            .upsert(dataToInsert, {
                onConflict: 'NUMERO DE SERIE'
            });

        if (error) throw error;

        alert(`Base de datos actualizada: ${dataToInsert.length} Equipos actualizados o dados de alta!`);
        
    } catch (error) {
        console.error('Error al subir a Supabase:', error.message);
        alert('Error al subir los datos: ' + error.message);
    } finally {
        if (uploadButton) {
            uploadButton.disabled = true;
            uploadButton.textContent = 'Base de datos actualizada!';
        }
    }
}