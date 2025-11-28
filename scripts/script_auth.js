const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');
const loginSection = document.getElementById('login-section');
const mainMenu = document.getElementById('main-menu');
const authError = document.getElementById('auth-error');

function handleAuthStatus(session) {
    if (session) {
        // Usuario logueado
        loginSection.style.display = 'none';
        mainMenu.style.display = 'block';
    } else {
        // Usuario deslogueado
        loginSection.style.display = 'block';
        mainMenu.style.display = 'none';
    }
}

// =========================================================
// INICIO DE SESIÓN
// =========================================================

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        authError.textContent = '';
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Intenta iniciar sesión
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;
            
            // Si tiene éxito, llama al manejador de estado (handleAuthStatus)
            handleAuthStatus(data.session);

        } catch (error) {
            console.error('Error de autenticación:', error.message);
            authError.textContent = 'Error: Credenciales inválidas. Verifica tu correo y contraseña.';
        }
    });
}

// =========================================================
// CIERRE DE SESIÓN
// =========================================================

if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Error al cerrar sesión:', error.message);
        } else {
            // Vuelve a la vista de login
            handleAuthStatus(null);
        }
    });
}


// =========================================================
// VERIFICAR SESIÓN AL CARGAR LA PÁGINA
// =========================================================

async function checkSession() {
    // Revisa si ya hay una sesión activa en el navegador
    const { data: { session } } = await supabaseClient.auth.getSession();
    handleAuthStatus(session);

    // Opcional: Escuchar cambios de autenticación en tiempo real
    supabaseClient.auth.onAuthStateChange((event, session) => {
        handleAuthStatus(session);
    });
}

// Ejecutar la verificación al cargar la ventana
window.onload = checkSession;