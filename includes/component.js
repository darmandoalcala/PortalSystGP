/**
 * Inserta el header y footer dinámicamente
 * @param {string} title - TITULO DE LA PAGINA
 * @param {string} subtitle - SUBTITULO
 */
function renderLayout(title = "GP MOBILITY", subtitle = "GESTIÓN DE INVENTARIO") {
    const headerHTML = `
        <header>
            <div id="header-left-actions">
                <a href="index.html" id="back-to-menu-btn">
                    <i class="fa-solid fa-arrow-left"></i> 
                </a>
            </div>

            <div id="header-titles">
                <h1>${title}</h1>
                <p>${subtitle}</p>
            </div>
            
            <div id="header-right-spacer"></div>
        </header>
    `;

    const footerHTML = `
        <footer>
            <p>BY @DARMANDOALCALA. DATABASE POWERED BY SUPABASE</p>
        </footer>
    `;

    // Inserción en el DOM
    const headerContainer = document.getElementById('header');
    const footerContainer = document.getElementById('footer');

    if (headerContainer) headerContainer.innerHTML = headerHTML;
    if (footerContainer) footerContainer.innerHTML = footerHTML;
}