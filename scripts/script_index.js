async function loadDashboardStats() {
    // Selección de elementos basada en las clases del Grid
    const statDivs = {
        totalEquipos: document.querySelector('.div8'),
        laptops: document.querySelector('.div16'),
        monitores: document.querySelector('.div15'),
        sucursalMax: document.querySelector('.div9'),
        detallesRevisar: document.querySelector('.div10'),
        inactivos: document.querySelector('.div7')
    };

    // Mostrar spinner de carga en cada tarjeta
    for (const key in statDivs) {
        if (statDivs[key]) {
            const valEl = statDivs[key].querySelector('.stat-value');
            if (valEl) valEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        }
    }

    try {
        // Consultas paralelas a Supabase
        const [total, laptops, monitores, inactivos, detalles, sucursales] = await Promise.all([
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('DISP', 'LAPTOP'),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('DISP', 'MONITOR'),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('ACTIVO', false),
            supabaseClient.from(TABLA_INVENTARIO).select('*', { count: 'exact', head: true }).eq('FUNCIONA', 'DETALLE'),
            supabaseClient.from(TABLA_USUARIOS).select('LUGAR_DPTO').not('LUGAR_DPTO', 'is', null) 
        ]);

        // Cálculo del departamento con más equipos
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
            // Limpieza de cadena (formato Sucursal/Depto)
            maxSucursalValue = maxSucursalValue.replace(/^[^/]*\//, '').trim();
        }

        // Actualización de la interfaz
        updateStatDiv(statDivs.totalEquipos, total.count || 0, 'REGISTRADOS');
        updateStatDiv(statDivs.laptops, laptops.count || 0, 'LAPTOPS');
        updateStatDiv(statDivs.monitores, monitores.count || 0, 'MONITORES');
        updateStatDiv(statDivs.detallesRevisar, detalles.count || 0, 'POR REVISAR');
        updateStatDiv(statDivs.inactivos, inactivos.count || 0, 'INACTIVOS');
        updateStatDiv(statDivs.sucursalMax, maxSucursalValue, 'MAYOR DEPTO');

    } catch (e) {
        console.error("Error al cargar estadísticas:", e);
        Object.values(statDivs).forEach(div => {
            if (div && div.querySelector('.stat-value')) {
                div.querySelector('.stat-value').textContent = 'ERR';
            }
        });
    }
}

function updateStatDiv(divElement, value, description) {
    if (divElement) {
        const valueSpan = divElement.querySelector('.stat-value');
        const descSpan = divElement.querySelector('.stat-description');
        if (valueSpan) valueSpan.textContent = value;
        if (descSpan) descSpan.textContent = description;
    }
}