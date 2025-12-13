const BRAND_IMAGES = {
    'ACER': 'img/acer_logo.png',
    'ASUS': 'img/asus_logo.png',
    'DELL': 'img/dell_logo.png',
    'HP': 'img/hp_logo.png',
    'LENOVO': 'img/lenovo_logo.png',
    'MOTOROLA': 'img/motorola_logo.png',
    'MSI': 'img/msi_logo.png',
    'SAMSUNG': 'img/samsung_logo.png',
    'DEFAULT': 'img/default_logo.png'
};

function calculateDaysAgo(isoDateString) {
    if (!isoDateString || typeof isoDateString !== 'string') return 'SIN REGISTRO';
    const reviewDate = new Date(isoDateString);
    if (isNaN(reviewDate.getTime())) return 'FECHA INVÁLIDA'; 
    const today = new Date();
    reviewDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const timeDiff = today.getTime() - reviewDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    if (daysDiff === 0) return 'HOY';
    if (daysDiff === 1) return '1 DÍA';
    if (daysDiff < 0) return 'FUTURO';
    return `${daysDiff} DÍAS`;
}

function closeGlobalModal() {
    const modal = document.getElementById('itemModal');
    if (modal) modal.style.display = 'none';
}

function initializeGlobalModalListeners() {
    const modal = document.getElementById('itemModal');
    if (!modal) return;
    const closeButton = modal.querySelector('.close-button');
    closeButton.addEventListener('click', closeGlobalModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) closeGlobalModal();
    });
}

function showGlobalModal(data) {
    const modal = document.getElementById('itemModal');
    if (!modal) return;

    const brand = String(data.MARCA || 'DEFAULT').toUpperCase();
    const imageBrandPath = BRAND_IMAGES[brand] || BRAND_IMAGES['DEFAULT'];
    const imageDevicePath = 'img/disp/' + (data.DISP ? String(data.DISP).toUpperCase() : 'DEFAULT') + '.png';
    const fechaInventariado = data['FECHA REVISADO']; 
    const fechaCompra = data['FECHA COMPRA']; 
    const serialNumber = data['NUMERO DE SERIE'];
    const activo = String(data['ACTIVO']).toUpperCase();

    const infoUsuario = data.usuarios || {};
    const nombreUsuario = infoUsuario['NOMBRE COMPLETO'] || data.USUARIO || 'SIN ASIGNAR';
    const dptoUsuario = infoUsuario['LUGAR_DPTO'] || data['LUGAR_DPTO'] || 'N/A';

    document.getElementById('modal-image-container-brand').innerHTML = 
        `<img src="${imageBrandPath}" alt="${data.MARCA}" class="modal-device-image">`;
    document.getElementById('modal-image-container-device').innerHTML = 
        `<img src="${imageDevicePath}" alt="${data.DISP}" class="modal-device-image">`;
    document.getElementById('modal-title').textContent = 
        `${data.MARCA || 'N/A'} ${data.MODELO || 'N/A'} (${data.DISP || 'N/A'})`;

    const modalActiveEl = document.getElementById('modal-active');
    const modalGeneralInfo = modal.querySelector('.modal-general-info');

    if (activo === 'TRUE') {
        if (modalActiveEl) modalActiveEl.innerHTML = '<i class="fa-solid fa-circle-check activo-si-icon"> ACTIVO</i>';
        if (modalGeneralInfo) {
            modalGeneralInfo.classList.remove('inactivo');
            modalGeneralInfo.classList.add('activo');
        }
    } else {
        if (modalActiveEl) modalActiveEl.innerHTML = '<i class="fa-solid fa-circle-xmark activo-no-icon"> INACTIVO</i>';
        if (modalGeneralInfo) {
            modalGeneralInfo.classList.remove('activo');
            modalGeneralInfo.classList.add('inactivo');
        }
    }

    document.getElementById('modal-subtitle').textContent = `S/N: ${serialNumber || 'N/A'}`;
    document.getElementById('modal-user').textContent = nombreUsuario;
    document.getElementById('modal-dpto').textContent = dptoUsuario;
    document.getElementById('modal-buy-date').textContent = fechaCompra || 'DESCONOCIDO'; 
    document.getElementById('modal-buy-days-ago').textContent = calculateDaysAgo(fechaCompra);
    document.getElementById('modal-date').textContent = fechaInventariado || 'DESCONOCIDO';
    document.getElementById('modal-days-ago').textContent = calculateDaysAgo(fechaInventariado);
    document.getElementById('modal-funciona').textContent = data.FUNCIONA || 'N/A';
    document.getElementById('modal-details-content').textContent = data.DETALLES || 'SIN DETALLES';

    const editButton = document.getElementById('edit-equipo-button');
    if (editButton) {
        editButton.onclick = () => handleEditRedirect(serialNumber);
        editButton.disabled = false;
        editButton.style.display = 'inline-block';
    }

    modal.style.display = 'block';
}

function handleEditRedirect(serialNumber) {
    if (serialNumber) {
        closeGlobalModal();
        window.location.href = `editar_equipo.html?serial=${encodeURIComponent(serialNumber)}`;
    } else {
        alert("Error: Número de Serie no disponible.");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('includes/modal_template.html');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        initializeGlobalModalListeners();
    } catch (e) {
        console.error("Error cargando el template del modal:", e);
    }
});