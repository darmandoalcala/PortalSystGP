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
const mainMenu = document.querySelector('.parent'); 
const headerParagraph = document.getElementById('header-paragraph');
const authError = document.getElementById('auth-error');

const statDivs = {
    totalEquipos: document.querySelector('.div8'),    
    laptops: document.querySelector('.div16'),        
    monitores: document.querySelector('.div15'),      
    sucursalMax: document.querySelector('.div9'),     
    detallesRevisar: document.querySelector('.div10'),
    inactivos: document.querySelector('.div7')        
}

function updateStatDiv(divElement, value, description) {
    if (divElement) {
        const valueSpan = divElement.querySelector('.stat-value');
        const descSpan = divElement.querySelector('.stat-description');
        if (valueSpan) valueSpan.textContent = value;
        if (descSpan) descSpan.textContent = description;
    }
}

async function loadDashboardStats() {
    // Spinner de carga inicial en las tarjetas de datos
    for (const key in statDivs) {
        if (statDivs[key] && statDivs[key].querySelector('.stat-value')) {
            statDivs[key].querySelector('.stat-value').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        }
    }

    try {
        // Consultas paralelas para optimizar velocidad
        const [total, laptops, monitores, inactivos, detalles, sucursales] = await Promise.all([
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('DISP', 'LAPTOP'),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('DISP', 'MONITOR'),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('ACTIVO', false),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('FUNCIONA', 'DETALLE'),
            supabaseClient.from(TABLA_USUARIOS).select('LUGAR_DPTO').not('LUGAR_DPTO', 'is', null) 
        ]);

        let maxSucursalValue = 'N/A';
        if (sucursales.data && sucursales.data.length > 0) {
            const counts = sucursales.data.reduce((acc, item) => {
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
            maxSucursalValue = maxSucursalValue.replace(/^[^/]*\//, '').trim();
        }

        // Inyección de datos con etiquetas cortas para el diseño Bento
        updateStatDiv(statDivs.totalEquipos, total.count || 0, 'REGISTRADOS');
        updateStatDiv(statDivs.laptops, laptops.count || 0, 'LAPTOPS');
        updateStatDiv(statDivs.monitores, monitores.count || 0, 'MONITORES');
        updateStatDiv(statDivs.detallesRevisar, detalles.count || 0, 'POR REVISAR');
        updateStatDiv(statDivs.inactivos, inactivos.count || 0, 'INACTIVOS');
        updateStatDiv(statDivs.sucursalMax, maxSucursalValue, 'MAYOR DEPTO');

    } catch (e) {
        console.error("Error Dashboard:", e);
    }
}

async function handleAuthStatus(session) {
    const loginSection = document.getElementById('login-section');
    const mainMenu = document.querySelector('.parent');

    if (session) {
        const userEmail = session.user.email;

        if (userEmail !== EMAIL_AUTORIZADO) {
            await supabaseClient.auth.signOut();
            if (authError) authError.textContent = 'ACCESO DENEGADO';
            return;
        }

        if (window.location.pathname.includes('login.html')) {
            window.location.href = 'new_index.html';
            return;
        }

        if (loginSection) loginSection.style.display = 'none';
        if (mainMenu) mainMenu.style.display = 'grid'; 
        
        if (document.querySelector('.stat-value')) {
            loadDashboardStats(); 
        }

    } else {
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.endsWith('/')) {
            window.location.href = 'login.html';
            return;
        }

        if (loginSection) loginSection.style.display = 'block';
        if (mainMenu) mainMenu.style.display = 'none';
    }
}

// Listeners de Formulario
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const btn = loginForm.querySelector('button');
        
        btn.disabled = true;
        btn.textContent = 'ACCEDIENDO...';

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            await handleAuthStatus(data.session);
        } catch (error) {
            authError.textContent = 'Credenciales inválidas.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'ACCEDER';
        }
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        handleAuthStatus(null);
    });
}

async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    await handleAuthStatus(session);
    supabaseClient.auth.onAuthStateChange((_event, session) => handleAuthStatus(session));
}

window.onload = checkSession;