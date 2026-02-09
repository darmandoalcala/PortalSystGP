(async function() {
    
    const SUPABASE_URL = 'https://oovzygalahromrinjffl.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vdnp5Z2FsYWhyb21yaW5qZmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MzQwMzgsImV4cCI6MjA3OTIxMDAzOH0.crTTU0mxDvGJ2n2_MrQ43BTSBseYRbh7P5Prh5T98Wg';

    const EMAIL_AUTORIZADO = "daguayo@gpmobility.mx"; 

    
    if (typeof supabase === 'undefined') return;

    const { createClient } = supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session || session.user.email !== EMAIL_AUTORIZADO) {
        
        window.location.href = 'login.html';
        return;
    }
    
    
})();