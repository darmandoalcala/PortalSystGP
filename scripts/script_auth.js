const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';

const EMAIL_AUTORIZADO = "daguayo@gpmobility.mx"; 

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const TABLA_INVENTARIO = 'inventario';
const TABLA_USUARIOS = 'usuarios';

const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const loginSection = document.getElementById('login-section');
const mainMenu = document.getElementById('main-menu');
const headerParagraph = document.getElementById('header-paragraph');
const authError = document.getElementById('auth-error');

const statDivs = {
    totalEquipos: document.getElementById('div2'),
    laptops: document.getElementById('div3'),
    monitores: document.getElementById('div4'),
    sucursalMax: document.getElementById('div6'),
    detallesRevisar: document.getElementById('div7'),
    inactivos: document.getElementById('div8')
};

function updateStatDiv(divElement, value, description) {
    if (divElement) {
        const valueSpan = divElement.querySelector('.stat-value');
        const descSpan = divElement.querySelector('.stat-description');
        
        if (valueSpan) valueSpan.textContent = value;
        if (descSpan) descSpan.textContent = description;
    }
}

async function loadDashboardStats() {
    
    for (const key in statDivs) {
        if (statDivs[key]) {
            statDivs[key].querySelector('.stat-value').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        }
    }

    try {
        const [
            totalCountPromise,
            laptopsCountPromise,
            monitoresCountPromise,
            inactivosCountPromise,
            detallesCountPromise,
            maxSucursalDataPromise
        ] = [
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('DISP', 'LAPTOP'),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('DISP', 'MONITOR'),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('ACTIVO', false),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('FUNCIONA', 'DETALLE'),
            supabaseClient.from(TABLA_USUARIOS).select('LUGAR_DPTO').not('LUGAR_DPTO', 'is', null) 
        ];

        const results = await Promise.all([
            totalCountPromise,
            laptopsCountPromise,
            monitoresCountPromise,
            inactivosCountPromise,
            detallesCountPromise,
            maxSucursalDataPromise
        ]);

        const total = results[0].count || 0;
        const laptops = results[1].count || 0;
        const monitores = results[2].count || 0;
        const inactivos = results[3].count || 0;
        const detalles = results[4].count || 0;
        const sucursalesData = results[5].data; 

        let maxSucursalValue = 'N/A';
        
        if (sucursalesData && sucursalesData.length > 0) {
            const counts = sucursalesData.reduce((acc, item) => {
                const dpto = item.LUGAR_DPTO;
                acc[dpto] = (acc[dpto] || 0) + 1;
                return acc;
            }, {});

            let maxCount = 0;
            for (const dpto in counts) {
                if (counts[dpto] > maxCount) {
                    maxCount = counts[dpto];
                    maxSucursalValue = dpto;
                }
            }
        }

        if (maxSucursalValue !== 'N/A') {
            const regex = /^[^/]*\//;
            maxSucursalValue = maxSucursalValue.replace(regex, '').trim();
        }

        updateStatDiv(statDivs.totalEquipos, total, 'EQUIPOS REGISTRADOS');
        updateStatDiv(statDivs.laptops, laptops, 'LAPTOPS');
        updateStatDiv(statDivs.monitores, monitores, 'MONITORES');
        updateStatDiv(statDivs.detallesRevisar, detalles, 'DETALLES POR REVISAR');
        updateStatDiv(statDivs.inactivos, inactivos, 'EQUIPOS INACTIVOS');
        
        updateStatDiv(statDivs.sucursalMax, maxSucursalValue, 'ES EL DEPARTAMENTO CON MÁS EQUIPOS');


    } catch (e) {
        console.error("Error al cargar las estadísticas del dashboard:", e);
        for (const key in statDivs) {
            if (statDivs[key]) {
                statDivs[key].querySelector('.stat-value').innerHTML = 'Error';
            }
        }
    }
}


async function handleAuthStatus(session) {
    const statElements = [
        document.getElementById('div2'),
        document.getElementById('div3'),
        document.getElementById('div4'),
        document.getElementById('div6'),
        document.getElementById('div7'),
        document.getElementById('div8')
    ];

    if (session) {
        const userEmail = session.user.email;

        if (userEmail !== EMAIL_AUTORIZADO) {
            console.warn(`Acceso denegado para: ${userEmail}`);
            
            await supabaseClient.auth.signOut();
            
            authError.textContent = 'ACCESO DENEGADO: No tienes permisos para ver este sitio.';
            authError.style.color = '#e11d48'; 
            authError.style.fontWeight = 'bold';
            
            loginSection.style.display = 'block';
            mainMenu.style.display = 'none';
            headerParagraph.textContent = 'INICIA SESIÓN PARA ACCEDER A LAS HERRAMIENTAS.';
            statElements.forEach(div => { if (div) div.style.display = 'none'; });
            
            return; 
        }

        loginSection.style.display = 'none';
        mainMenu.style.display = 'flex'; 
        headerParagraph.textContent = 'BIENVENIDO';
        authError.textContent = ''; 
        
        statElements.forEach(div => { if (div) div.style.display = 'block'; });
        loadDashboardStats(); 

    } else {
        loginSection.style.display = 'block';
        mainMenu.style.display = 'none';
        headerParagraph.textContent = 'INICIA SESIÓN PARA ACCEDER A LAS HERRAMIENTAS.';
        
        statElements.forEach(div => { if (div) div.style.display = 'none'; });
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authError.textContent = '';
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const submitButton = loginForm.querySelector('button');
        submitButton.disabled = true;
        submitButton.textContent = 'ACCEDIENDO...';

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;
            
            await handleAuthStatus(data.session);

        } catch (error) {
            console.error('Error de autenticación:', error.message);
            authError.textContent = 'Error: Credenciales inválidas. Verifica tu correo y contraseña.';
            authError.style.color = 'red';
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'ACCEDER';
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Error al cerrar sesión:', error.message);
        } else {
            handleAuthStatus(null);
        }
    });
}


async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    await handleAuthStatus(session);

    supabaseClient.auth.onAuthStateChange((event, session) => {
        handleAuthStatus(session);
    });
}

window.onload = checkSession;