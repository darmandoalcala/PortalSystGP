const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLA_USUARIOS = 'usuarios';
let todosLosUsuarios = []; 

function renderTableFromObjects(data) {
    const table = document.getElementById('usuariosTable');
    if (!table) return;
    
    const tableBody = table.querySelector('tbody');
    tableBody.innerHTML = '';  
    
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay registros para mostrar</td></tr>';
        return;
    }

    data.forEach(item => {
        const cantidadEquipos = item.inventario ? item.inventario[0].count : 0;
        const iconLaptop = item.TIENE_LAPTOP ? '<i class="fa-solid fa-check" style="color:green"></i>' : '<i class="fa-solid fa-xmark" style="color:red"></i>';
        const iconCelular = item.TIENE_CELULAR ? '<i class="fa-solid fa-check" style="color:green"></i>' : '<i class="fa-solid fa-xmark" style="color:red"></i>';
        // Verificamos si el usuario es inactivo (ACTIVO no es true)
        const esInactivo = String(item['ACTIVO']).toUpperCase() !== 'TRUE';
        
        let bodyRow = document.createElement('tr');
        
        // Aplicamos la clase que definiste en tu CSS para rojos
        if (esInactivo) {
            bodyRow.classList.add('row-inactivo');
        }
        
        bodyRow.innerHTML = `
            <td>${item['NOMBRE COMPLETO'] || 'N/A'} ${esInactivo ? '<b style="font-size:0.8em;">(INACTIVO)</b>' : ''}</td>
            <td>${item['DEPARTAMENTO'] || 'N/A'}</td>
            <td>${item['LUGAR_DPTO'] || 'N/A'}</td>
            <td>${item['NUMERO EMPLEADO'] || 'N/A'}</td>
            <td style="text-align:center;">${cantidadEquipos}</td>
            <td style="text-align:center;">${iconLaptop}</td>
            <td style="text-align:center;">${iconCelular}</td>
        `;
        tableBody.appendChild(bodyRow);
    });
}

async function fetchAndRenderFromSupabase() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.style.display = 'block';

    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from(TABLA_USUARIOS)
            .select(`*, inventario(count)`);

        if (error) throw error;

        todosLosUsuarios = data; 
        renderTableFromObjects(todosLosUsuarios); 

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
}

// Filtros de botones
function filtrarUsuarios(tipo) {
    let filtrados = [];
    if (tipo === 'inventariados') {
        filtrados = todosLosUsuarios.filter(u => u.inventario && u.inventario[0].count > 0);
    } else {
        filtrados = todosLosUsuarios.filter(u => !u.inventario || u.inventario[0].count === 0);
    }
    renderTableFromObjects(filtrados);
}

document.getElementById('inventariados-button').addEventListener('click', () => {
    document.getElementById('inventariados-button').disabled = true;
    document.getElementById('sin-inventariar-button').disabled = false;
    filtrarUsuarios('inventariados');
});

document.getElementById('sin-inventariar-button').addEventListener('click', () => {
    document.getElementById('inventariados-button').disabled = false;
    document.getElementById('sin-inventariar-button').disabled = true;
    filtrarUsuarios('sin');
});

window.onload = fetchAndRenderFromSupabase;