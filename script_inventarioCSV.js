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

// calcular "hace cuantos dias se inventario"
function calculateDaysAgo(dateString) {
    const parts = dateString.split('/');
    // DD/MM/AA
    const reviewDate = new Date(parts[2], parts[1] - 1, parts[0]); 
    const today = new Date();
    const timeDiff = today.getTime() - reviewDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (isNaN(daysDiff)) return 'Fecha inválida';
    if (daysDiff === 0) return 'Hoy';
    if (daysDiff === 1) return '1 día';
    return `${daysDiff} días`;
}

// --- MODAL
const modal = document.getElementById('itemModal');
const closeButton = document.querySelector('.close-button');

function showModal(data) {
    // Índices fijos
    const marcaIndex = 3;           //MARCA
    const modeloIndex = 4;          //MODELO
    const detallesIndex = 6;        //DETALLES
    const usuarioIndex = 7;         //USUARIO
    const dptoIndex = 8;            //DEPARTAMENTO
    const fechaIndex = 9;           //FECHA iNVENTARIADO
    const funcionaIndex = 5;        //FUNCIONA?

    //RUTA DE LA IMAGEN
    const brand = data[marcaIndex].toUpperCase();
    const imagePath = BRAND_IMAGES[brand] || BRAND_IMAGES['DEFAULT'];
    
    // Poblar contenedor de imagen
    const modalImageContainer = document.getElementById('modal-image-container');
    modalImageContainer.innerHTML = `<img src="${imagePath}" alt="${data[marcaIndex]} ${data[modeloIndex]}" class="modal-device-image">`;


    // Título y Subtítulo
    document.getElementById('modal-title').textContent = `${data[marcaIndex]} ${data[modeloIndex]} (${data[2]})`; // MARCA MODELO (DISP)
    document.getElementById('modal-subtitle').textContent = `S/N: ${data[1]}`; // NUMERO DE SERIE
    
    // Cuerpo
    document.getElementById('modal-user').textContent = data[usuarioIndex]; // USUARIO
    document.getElementById('modal-dpto').textContent = data[dptoIndex]; // LUGAR/DPTO
    document.getElementById('modal-date').textContent = data[fechaIndex]; // FECHA REVISADO
    document.getElementById('modal-days-ago').textContent = calculateDaysAgo(data[fechaIndex]); // Calculado

    // Detalles del estado
    document.getElementById('modal-funciona').textContent = data[funcionaIndex]; // FUNCIONA
    document.getElementById('modal-details-content').textContent = data[detallesIndex]; // DETALLES
    
    modal.style.display = 'block';
}
//CERRAR:

// AL HACER CLIC EN X
closeButton.onclick = function() {
    modal.style.display = 'none';
}

// AL HACER CLIC FUERA DEL MODAL
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

//REVISAR AUTENTICACION
async function checkAuthAndRedirect() {
    const messageElement = document.getElementById('message');
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (!session) {
        messageElement.innerHTML = '<i class="fa-solid fa-lock"></i> Debes iniciar sesión para subir datos. Redirigiendo...';
        // Deshabilitar botones para evitar subida
        if (uploadButton) uploadButton.disabled = true;
        if (loadButton) loadButton.disabled = true;

        setTimeout(() => window.location.href = 'index.html', 1500); 
        return false;
    }
    return true;
}

// MANEJO DE CSV Y TABLA
const csvFile = document.getElementById('csvFile');
const loadButton = document.getElementById('loadButton');
const uploadButton = document.getElementById('uploadButton');
let fileContent = null; 

// HABILITA EL BOTON AL SELECCIONAR UN CSV
csvFile.addEventListener('change', function(e) {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(evt) {
            fileContent = evt.target.result; 
            loadButton.disabled = false; 
            uploadButton.disabled = false;
        };
        reader.readAsText(file, 'UTF-8');
    } else {
        fileContent = null;
        loadButton.disabled = true;
        uploadButton.disabled = true;
    }
});

// CARGA LA TABLA CON EL BOTON
loadButton.addEventListener('click', function() {
    if (fileContent) {
        renderTable(fileContent);
    }
});

//RENDERIZA LA TABLA
function renderTable(csv) {
    const separator = ';'; // ';' como separador, CAMBIAR POR ',' EN CASO DE CSV DIFERENTE
    
    const rows = csv.split('\n').filter(Boolean);
    if (rows.length === 0) return;

    const headers = rows[0].split(separator).map(h => h.trim());
    const dataRows = rows.slice(1);

    const table = document.getElementById('inventoryTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // CABECERA
    let headerRow = '<tr>';
    headers.forEach(header => {
        headerRow += `<th>${header}</th>`;
    });
    headerRow += '</tr>';
    thead.innerHTML = headerRow;

    // INDICES
    const funcionaIndex = headers.indexOf('FUNCIONA');
    const detallesIndex = headers.indexOf('DETALLES');
    const activoIndex = headers.indexOf('ACTIVO');
    const marcaIndex = headers.indexOf('MARCA');
    const serieIndex = headers.indexOf('NUMERO DE SERIE')

    if (funcionaIndex === -1 || detallesIndex === -1 || activoIndex === -1 || marcaIndex === -1) {
        console.error("Faltan columnas clave para el formato condicional o la marca.");
        return;
    }

    // FILAS DE DATOS
    dataRows.forEach(rowData => {
        const cells = rowData.split(separator).map(c => c.trim());
        const numeroDeSerie = cells[serieIndex];
        
        // Si la columna NUMERO DE SERIE está vacia...
        if (!numeroDeSerie) {
            return;//salta esa columna
        }

        let bodyRow = document.createElement('tr');
        
        bodyRow.dataset.rowData = JSON.stringify(cells); 

        bodyRow.addEventListener('click', () => {
            showModal(cells);
        });

        cells.forEach((cellData, index) => {
            let className = '';
            let displayData = cellData;

            // IMAGEN MINIATURA EN TABLA
            if (index === marcaIndex) {
                const brand = cellData.toUpperCase();
                const imagePath = BRAND_IMAGES[brand] || BRAND_IMAGES['DEFAULT'];
            }

            // FUNCIONA
            if (index === funcionaIndex) {
                const value = cellData.toUpperCase();
                if (value === 'SI') {
                    className = 'funciona-si';
                } else if (value === 'DETALLE') {
                    className = 'funciona-detalle';
                } else if (value === 'NO') {
                    className = 'funciona-no';
                }
            }

            // DETALLES
            if (index === detallesIndex && cellData.length > 0) {
                className += ' detalles-presente';
            }

            // ACTIVO
            if (index === activoIndex) {
                const value = cellData.toUpperCase();
                if (value === '1') {               //ICONO PARA "SI"
                    displayData = '<i class="fa-solid fa-circle-check activo-si-icon"></i>';
                } else if (value === '0') {        //ICONO PARA "NO"
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

//AL PRESIONAR SUBIR LA TABLA A BASE DE DATOS
uploadButton.addEventListener('click', function() {
    if(fileContent){
        uploadDataToDataBase(fileContent);
    }
})

// FUNCIÓN DE SUBIDA (DAR DE ALTA A SUPABASE)
async function uploadDataToDataBase(csv) {
    if (!await checkAuthAndRedirect()) return;      //REVISA AUTENTICACION

    const separator = ';'; 
    const rows = csv.split('\n').filter(Boolean);
    if (rows.length === 0) return;

    const headers = rows[0].split(separator).map(h => h.trim());
    const dataRows = rows.slice(1);
    const dataToInsert = [];

    // 1. Procesamiento y Mapeo de Datos (CSV a Objeto)
    dataRows.forEach(rowData => {
        const cells = rowData.split(separator).map(c => c.trim());
        let rowObject = {};

        cells.forEach((cellData, index) => {
            const headerName = headers[index];
            let value = cellData;

            //IGNORAR la columna ID si existe, ya que es autoincremental en la DB 
            // Verificamos si el nombre de la cabecera es 'ID'....
            if (headerName.toUpperCase() === 'ID') {
                return; // No se incluye esta columna en el rowObject
            }

            //ACTIVO (1 y 0 a boolean)
            if (headerName.toUpperCase() === 'ACTIVO') {
                value = cellData === '1'; 
            }
            
            //FECHA REVISADO (DD/MM/AAAA a AAAA-MM-DD)
            if (headerName === 'FECHA REVISADO' && value && value.includes('/')) {
                const parts = value.split('/');
                value = `${parts[2]}-${parts[1]}-${parts[0]}`; 
            }

            // Si el valor es una cadena vacía, lo convertimos a null para la DB
            rowObject[headerName] = value === '' ? null : value;
        });

        // FILTRADO DE SEGURIDAD (Solo insertamos si el campo clave existe)
        if (rowObject["NUMERO DE SERIE"] !== null) {
            dataToInsert.push(rowObject);
        }
    });
    
    // 2. Subir los datos a Supabase
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

        alert(`✅ Datos de ${dataToInsert.length} equipos dados de alta/actualizados con éxito en la base de datos!`);
        
    } catch (error) {
        console.error('Error al subir a Supabase:', error.message);
        alert('❌ Error al subir los datos: ' + error.message);
    } finally {
        if (uploadButton) {
            uploadButton.disabled = false;
            uploadButton.textContent = 'Subir CSV a Base de Datos';
        }
    }
}