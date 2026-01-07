const BRAND_IMAGES = {
    'ACER': 'img/acer_logo.png', 'ASUS': 'img/asus_logo.png', 'DELL': 'img/dell_logo.png',
    'HP': 'img/hp_logo.png', 'LENOVO': 'img/lenovo_logo.png', 'MOTOROLA': 'img/motorola_logo.png',
    'MSI': 'img/msi_logo.png', 'SAMSUNG': 'img/samsung_logo.png', 'DEFAULT': 'img/default_logo.png'
};

let currentItemData = null;

function calculateDaysAgo(isoDateString) {
    if (!isoDateString || typeof isoDateString !== 'string') return 'SIN REGISTRO';
    const reviewDate = new Date(isoDateString);
    if (isNaN(reviewDate.getTime())) return 'FECHA INVÁLIDA';
    const today = new Date();
    reviewDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const timeDiff = today.getTime() - reviewDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff <= 0 ? 'HOY' : daysDiff === 1 ? '1 DÍA' : `${daysDiff} DÍAS`;
}

function closeGlobalModal() {
    const modal = document.getElementById('itemModal');
    if (modal) modal.style.display = 'none';
}

function initializeGlobalModalListeners() {
    const modal = document.getElementById('itemModal');
    if (!modal) return;
    const closeButton = modal.querySelector('.close-button');
    if (closeButton) closeButton.onclick = closeGlobalModal;
    window.onclick = (e) => { if (e.target === modal) closeGlobalModal(); };
}

function showGlobalModal(data) {
    currentItemData = data;
    const modal = document.getElementById('itemModal');
    if (!modal) return;

    renderFixedHeader(data);
    renderDetailsView();
    modal.style.display = 'block';
}

function renderFixedHeader(data) {
    const brand = String(data.MARCA || 'DEFAULT').toUpperCase();
    const activo = String(data['ACTIVO']).toUpperCase();

    document.getElementById('modal-image-container-brand').innerHTML = `<img src="${BRAND_IMAGES[brand] || BRAND_IMAGES['DEFAULT']}" class="modal-device-image">`;
    document.getElementById('modal-image-container-device').innerHTML = `<img src="img/disp/${(data.DISP || 'DEFAULT').toUpperCase()}.png" class="modal-device-image">`;
    document.getElementById('modal-title').textContent = `${data.MARCA || 'N/A'} ${data.MODELO || 'N/A'}`;
    document.getElementById('modal-subtitle').textContent = `S/N: ${data['NUMERO DE SERIE'] || 'N/A'}`;

    const modalActiveEl = document.getElementById('modal-active');
    modalActiveEl.innerHTML = activo === 'TRUE' ?
        '<i class="fa-solid fa-circle-check activo-si-icon"> ACTIVO</i>' :
        '<i class="fa-solid fa-circle-xmark activo-no-icon"> INACTIVO</i>';
}

function renderDetailsView() {
    const data = currentItemData;
    const infoUsuario = data.usuarios || {};
    const dynamicContainer = document.getElementById('modal-dynamic-content') || document.querySelector('.modal-body');

    // 1. Inyectamos la estructura primero
    dynamicContainer.innerHTML = `
        <div class="modal-general-info">
            <p><i class="fa-solid fa-user"></i> PERTENECE A: <strong id="modal-user"></strong> DEL DEPARTAMENTO <strong id="modal-dpto"></strong>.</p>
            <p><i class="fa-solid fa-calendar-check"></i> FECHA DE COMPRA: <strong id="modal-buy-date"></strong></p>
            <p><i class="fa-solid fa-clock-rotate-left"></i> COMPRADO HACE: <strong id="modal-buy-days-ago"></strong></p>
            <p><i class="fa-solid fa-calendar-check"></i> FECHA DE INVENTARIADO: <strong id="modal-date"></strong></p>
            <p><i class="fa-solid fa-clock-rotate-left"></i> INVENTARIADO HACE: <strong id="modal-days-ago"></strong></p>
            <hr>
            <h4><i class="fa-solid fa-circle-info"></i> ESTADO TÉCNICO</h4>
            <p>FUNCIONA: <strong id="modal-funciona"></strong></p>
            <p>DETALLES: <em id="modal-detalles-text"></em></p>
            <hr>
            <h4><i class="fa-solid fa-clock-rotate-left"></i> HISTORIAL DE DUEÑOS</h4>
            <div id="history-list" style="font-size: 0.85em; max-height: 120px; overflow-y: auto; background: #f9f9f9; padding: 10px; border-radius: 5px;">
                Cargando historial...
            </div>
        </div>
        <div id="modal-footer-actions" class="modal-footer-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;"></div>
    `;

    // 2. Llenamos los datos asegurando que los IDs existen
    document.getElementById('modal-user').textContent = infoUsuario['NOMBRE COMPLETO'] || data.USUARIO || 'SIN ASIGNAR';
    document.getElementById('modal-dpto').textContent = infoUsuario['LUGAR_DPTO'] || data['LUGAR_DPTO'] || 'N/A';
    document.getElementById('modal-buy-date').textContent = data['FECHA COMPRA'] || 'DESCONOCIDO';
    document.getElementById('modal-buy-days-ago').textContent = calculateDaysAgo(data['FECHA COMPRA']);
    document.getElementById('modal-date').textContent = data['FECHA REVISADO'] || 'DESCONOCIDO';
    document.getElementById('modal-days-ago').textContent = calculateDaysAgo(data['FECHA REVISADO']);
    document.getElementById('modal-funciona').textContent = data.FUNCIONA || 'N/A';
    document.getElementById('modal-detalles-text').textContent = data.DETALLES || 'SIN DETALLES';

    // 3. Render de botones
    const buttons = [
        { text: 'AGREGAR DETALLE', icon: 'fa-plus', color: '#E67E22', action: renderAddDetailForm },
        { text: 'CAMBIAR USUARIO', icon: 'fa-user-gear', color: '#3498DB', action: renderChangeUserForm },
        { text: 'ACTIVAR/DESACTIVAR', icon: 'fa-power-off', color: '#95A5A6', action: toggleActiveStatus },
        { text: 'EDITAR TODO', icon: 'fa-pen-to-square', color: '#2ECC71', action: () => window.location.href = `editar_equipo.html?serial=${encodeURIComponent(data['NUMERO DE SERIE'])}` }
    ];

    const footer = document.getElementById('modal-footer-actions');
    footer.innerHTML = '';
    buttons.forEach(btn => {
        const b = document.createElement('button');
        b.className = 'action-button';
        b.style.cssText = `background-color:${btn.color}; color:white; padding:10px; border:none; border-radius:5px; cursor:pointer; font-weight:bold;`;
        b.innerHTML = `<i class="fa-solid ${btn.icon}"></i> ${btn.text}`;
        b.onclick = btn.action;
        footer.appendChild(b);
    });

    fetchHistory(data.id);
}

async function fetchHistory(idEquipo) {
    const { data, error } = await supabaseClient
        .from('historial_asignaciones')
        .select(`
            fecha_cambio,
            usuarios!id_usuario_anterior ( "NOMBRE COMPLETO" )
        `)
        .eq('id_equipo', idEquipo)
        .order('fecha_cambio', { ascending: false });

    const container = document.getElementById('history-list');
    if (error || !data || data.length === 0) {
        container.innerHTML = "No hay dueños anteriores registrados.";
        return;
    }

    container.innerHTML = data.map(h => `
        <div style="border-bottom: 1px solid #ddd; padding: 4px 0; display: flex; justify-content: space-between;">
            <span>${h.usuarios ? h.usuarios["NOMBRE COMPLETO"] : 'Desconocido'}</span> 
            <span style="color: #888;">${new Date(h.fecha_cambio).toLocaleDateString()}</span>
        </div>
    `).join('');
}

function renderChangeUserForm() {
    const dynamicContainer = document.getElementById('modal-dynamic-content') || document.querySelector('.modal-body');
    dynamicContainer.innerHTML = `
        <div class="quick-form" style="padding: 15px; position: relative;">
            <h4 style="color:#3498DB;"><i class="fa-solid fa-user-plus"></i> REASIGNAR EQUIPO</h4>
            <label>BUSCAR NUEVO DUEÑO:</label>
            <input type="text" id="modal-user-search" class="modal-input" placeholder="Escribe nombre..." style="width:100%; padding:8px; margin-top:5px; box-sizing: border-box;">
            <ul id="modal-user-results" style="display:none; position:absolute; background:white; border:1px solid #ccc; width:100%; z-index:100; list-style:none; padding:0; margin:0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></ul>
            <input type="hidden" id="new-user-id">
            <p id="new-user-preview" style="margin-top:10px; font-weight:bold; color:#2C3E50;"></p>
        </div>
        <div id="modal-footer-actions" class="modal-footer-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;"></div>
    `;

    const searchInput = document.getElementById('modal-user-search');
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.toUpperCase();
        if (query.length < 3) return;
        const { data } = await supabaseClient.from('usuarios').select('id, "NOMBRE COMPLETO"').ilike('"NOMBRE COMPLETO"', `%${query}%`).limit(5);
        const results = document.getElementById('modal-user-results');
        results.innerHTML = (data || []).map(u => `
            <li style="padding:8px; cursor:pointer; border-bottom:1px solid #eee;" onclick="selectModalUser(${u.id}, '${u['NOMBRE COMPLETO']}')">
                ${u['NOMBRE COMPLETO']}
            </li>
        `).join('');
        results.style.display = 'block';
    });

    const footer = document.getElementById('modal-footer-actions');
    const btnCancel = document.createElement('button');
    btnCancel.className = 'action-button';
    btnCancel.style.cssText = "background-color:#95A5A6; color:white; padding:10px; border:none; border-radius:5px;";
    btnCancel.innerHTML = '<i class="fa-solid fa-xmark"></i> CANCELAR';
    btnCancel.onclick = renderDetailsView;

    const btnConfirm = document.createElement('button');
    btnConfirm.className = 'action-button';
    btnConfirm.style.cssText = "background-color:#3498DB; color:white; padding:10px; border:none; border-radius:5px;";
    btnConfirm.innerHTML = '<i class="fa-solid fa-check"></i> CONFIRMAR';
    btnConfirm.onclick = saveNewUser;

    footer.appendChild(btnCancel);
    footer.appendChild(btnConfirm);
}

window.selectModalUser = (id, nombre) => {
    document.getElementById('new-user-id').value = id;
    document.getElementById('new-user-preview').textContent = "Seleccionado: " + nombre;
    document.getElementById('modal-user-results').style.display = 'none';
};

async function saveNewUser() {
    const newId = document.getElementById('new-user-id').value;
    if (!newId) return alert("Por favor, selecciona un usuario de la lista.");
    const { error } = await supabaseClient.from('inventario').update({ "id_usuario": newId }).eq('NUMERO DE SERIE', currentItemData['NUMERO DE SERIE']);
    if (!error) {
        alert("Usuario actualizado con éxito.");
        printResponsibilityLetter(currentItemData, newId);
        location.reload();
    }
}

function renderAddDetailForm() {
    const dynamicContainer = document.getElementById('modal-dynamic-content') || document.querySelector('.modal-body');
    dynamicContainer.innerHTML = `
        <div class="quick-form" style="padding: 15px;">
            <h4 style="color:#E67E22;"><i class="fa-solid fa-warning"></i> REGISTRAR NUEVO DETALLE</h4>
            <label>¿FUNCIONA?</label>
            <select id="quick-funciona" class="modal-input" style="width:100%; padding:8px; margin:10px 0;">
                <option value="SI" ${currentItemData.FUNCIONA === 'SI' ? 'selected' : ''}>SI</option>
                <option value="NO" ${currentItemData.FUNCIONA === 'NO' ? 'selected' : ''}>NO</option>
                <option value="DETALLE" ${currentItemData.FUNCIONA === 'DETALLE' ? 'selected' : ''}>DETALLE</option>
            </select>
            <label>NOTAS:</label>
            <textarea id="quick-detalles" class="modal-input" rows="4" style="width:100%; padding:8px; margin-top:10px; box-sizing: border-box;">${currentItemData.DETALLES || ''}</textarea>
        </div>
        <div id="modal-footer-actions" class="modal-footer-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;"></div>
    `;

    const footer = document.getElementById('modal-footer-actions');
    const btnCancel = document.createElement('button');
    btnCancel.style.cssText = "background-color:#95A5A6; color:white; padding:10px; border:none; border-radius:5px;";
    btnCancel.innerHTML = '<i class="fa-solid fa-xmark"></i> CANCELAR';
    btnCancel.onclick = renderDetailsView;

    const btnSave = document.createElement('button');
    btnSave.style.cssText = "background-color:#E67E22; color:white; padding:10px; border:none; border-radius:5px;";
    btnSave.innerHTML = '<i class="fa-solid fa-save"></i> GUARDAR';
    btnSave.onclick = saveQuickDetail;

    footer.appendChild(btnCancel);
    footer.appendChild(btnSave);
}

async function saveQuickDetail() {
    const funciona = document.getElementById('quick-funciona').value;
    const detalles = document.getElementById('quick-detalles').value.toUpperCase();
    const hoy = new Date().toISOString().split('T')[0];

    const { error } = await supabaseClient.from('inventario').update({
        "FUNCIONA": funciona,
        "DETALLES": detalles,
        "FECHA REVISADO": hoy
    }).eq('NUMERO DE SERIE', currentItemData['NUMERO DE SERIE']);

    if (!error) {
        alert("Detalle guardado correctamente.");
        location.reload();
    }
}

async function toggleActiveStatus() {
    const esActivoActual = String(currentItemData['ACTIVO']).toUpperCase() === 'TRUE';
    const hoy = new Date();

    // Formato manual para asegurar el DD/MM/YYYY
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    const fechaTexto = `${dia}/${mes}/${anio}`;
    const fechaISO = hoy.toISOString().split('T')[0];

    if (!esActivoActual) {
        if (confirm("Para reactivar este equipo, primero debes asignar un nuevo dueño. ¿Deseas continuar?")) {
            renderChangeUserForm();


            setTimeout(() => {
                const btnConfirm = document.querySelector('#modal-footer-actions button:last-child');
                if (btnConfirm) {
                    btnConfirm.onclick = async () => {
                        const newId = document.getElementById('new-user-id').value;
                        if (!newId) return alert("Selecciona un usuario.");

                        const { error } = await supabaseClient.from('inventario').update({
                            "id_usuario": newId,
                            "ACTIVO": true,
                            "FECHA REVISADO": fechaISO,
                            "FUNCIONA": "SI"
                        }).eq('NUMERO DE SERIE', currentItemData['NUMERO DE SERIE']);

                        if (!error) {
                            alert("Equipo reactivado y asignado con éxito.");
                            printResponsibilityLetter(currentItemData, newId);
                            location.reload();
                        }
                    };
                }
            }, 100);
        }
        return;
    }

    if (!confirm(`¡ADVERTENCIA! Vas a dar de BAJA este equipo.\n\n- Se asignará a 'SIN ASIGNAR'.\n- Se anotará 'BAJA EL ${fechaTexto}' en detalles.\n- Se actualizará la fecha de revisión.\n\n¿Proceder?`)) return;

    let datosActualizar = {
        "ACTIVO": false,
        "FECHA REVISADO": fechaISO
    };

    try {
        const { data: userBaja, error: userError } = await supabaseClient
            .from('usuarios')
            .select('id')
            .eq('NOMBRE COMPLETO', 'SIN ASIGNAR')
            .single();

        if (userError || !userBaja) throw new Error("No se encontró el registro 'SIN ASIGNAR'.");

        datosActualizar["id_usuario"] = userBaja.id;
        datosActualizar["USUARIO"] = "SIN ASIGNAR";

        const detalleAnterior = (currentItemData.DETALLES || "").trim();
        const separador = detalleAnterior ? " | " : "";
        datosActualizar["DETALLES"] = `${detalleAnterior}${separador}BAJA EL ${fechaTexto}`.toUpperCase();
        datosActualizar["FUNCIONA"] = "NO";

        const { error } = await supabaseClient
            .from('inventario')
            .update(datosActualizar)
            .eq('NUMERO DE SERIE', currentItemData['NUMERO DE SERIE']);

        if (!error) {
            alert("Equipo dado de baja correctamente.");
            location.reload();
        } else {
            throw error;
        }
    } catch (err) {
        alert("Error: " + err.message);
    }
}

/**
 * FUNCION PARA IMPRIMIR UNA CARTA RESPONSIVA
 * @param {Object} data - Datos completos del equipo
 * @param {Number|String} idUsuario - ID del nuevo usuario
 */

function printResponsibilityLetter(data, idUsuario) {
    const printWindow = window.open('', '_blank');
    const hoy = new Date();
    const fechaLarga = hoy.toLocaleDateString('es-ES');

    let nombreFirmante = "________________________";
    const previewElement = document.getElementById('new-user-preview');
    
    if (previewElement && previewElement.textContent.includes("Seleccionado: ")) {
        nombreFirmante = previewElement.textContent.replace("Seleccionado: ", "").trim();
    } else {
        nombreFirmante = data.USUARIO || "________________________";
    }

    const notaEstado = (data.DETALLES && data.DETALLES.trim() !== "") 
        ? "El equipo se entrega en estado de segundo uso y en óptimas condiciones." 
        : "El equipo se entrega en condiciones nuevas para su uso.";

    printWindow.document.write(`
        <html>
            <head>
                <title>CARTA RESPONSIVA - ${data.MARCA || 'EQUIPO'}</title>
                <style>
                    body { font-family: 'Helvetica', Arial, sans-serif; margin: 40px; color: #333; line-height: 1.4; }
                    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                    .logo { width: 120px; }
                    h2 { text-align: center; font-size: 18px; text-decoration: underline; margin-bottom: 20px; }
                    .content { text-align: justify; font-size: 11px; margin-bottom: 20px; }
                    
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11px; }
                    th, td { border: 1px solid black; padding: 8px; text-align: center; }
                    th { background-color: #f2f2f2; text-transform: uppercase; }
                    
                    .note-section { margin-top: 20px; font-size: 11px; }
                    .footer-sign { margin-top: 50px; text-align: center; font-size: 12px; }
                    .signature-line { margin-top: 40px; border-top: 1px solid black; width: 300px; display: inline-block; }
                    
                    .manual-input { border-bottom: 1px solid #000; width: 350px; display: inline-block; height: 15px; vertical-align: bottom; }

                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="img/logo_gp.png" class="logo"> 
                </div>

                <h2>CARTA RESPONSIVA DE EQUIPOS</h2>

                <div class="content">
                    <p>Por medio de la presente hago constar que recibí de <strong>GP MOBILITY</strong> el (los) siguientes (s) equipo (s) para uso exclusivo del desempeño de mis “Actividades laborales”, comprometiéndome a mantenerlo conforme al estado de recepción. Entendiendo y aceptando que, en caso de cualquier daño ocasionado por “dolo o negligencia” me haré responsable de su reparación y/o reposición.</p>
                    <p>En caso de que por causas inherentes al uso y desgaste normal del(los) equipo(s), el o los mismo(s) requieran cualquier reparación, es mi responsabilidad notificar a <strong>Cultura y Talento</strong>, vía correo electrónico (solicitando acuse de recepción), para que me notifique las condiciones de mantenimiento necesarias.</p>
                    <p>Reconozco que el(los) equipo(s) asignado(s) a mi persona sólo podrá(n) ser utilizado(s) para cumplir con las tareas que se me encomienden por parte de la empresa: <strong>GP MOBILITY</strong>, en calidad de patrón y que “no” podré hacer uso para cuestiones de carácter personal. Me Comprometo a “no” modificar ni en el Hardware ni en el Software, es decir no agregar ni suprimir programa(s) o aplicación(es) de los que se encuentren cargados originalmente, sin previo consentimiento por escrito de <strong>Cultura y Talento</strong>.</p>
                    <p>Reconozco que los derechos sobre el equipo objeto de la presente, corresponden exclusivamente a <strong>GP MOBILITY</strong>, en términos del contrato que se tiene celebrado con el proveedor de este y/o factura correspondiente. Por lo que a la simple solicitud de la empresa me comprometo a devolver el(los) equipo(s) asignado(s) indicando mi conformidad a la firma del presente y en todo caso, al terminar mi relación laboral con la empresa hare entrega al representante de Cultura y Talento o jefe inmediato, en el mismo estado en que lo haya recibido, salvo al deterioro normal por uso.</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 33%;">MARCA</th>
                            <th style="width: 33%;">MODELO</th>
                            <th style="width: 34%;">NUMERO DE SERIE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${data.MARCA || 'N/A'}</td>
                            <td>${data.MODELO || 'N/A'}</td>
                            <td>${data['NUMERO DE SERIE'] || 'N/A'}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="note-section">
                    <p><strong>NOTA:</strong> ${notaEstado}</p>
                    <p><strong>ESPECIFICACIONES Y ACCESORIOS:</strong> <span class="manual-input"></span></p>
                </div>

                <div class="footer-sign">
                    <p>Atentamente</p>
                    <p style="margin-top: 40px;">Nombre Completo: <strong>${nombreFirmante}</strong></p>
                    
                    <div class="signature-line"></div>
                    <p>Firma</p>
                    
                    <p style="margin-top: 20px;">Fecha: ${fechaLarga}</p>
                </div>
            </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('includes/modal_template.html');
        document.body.insertAdjacentHTML('beforeend', await response.text());
        initializeGlobalModalListeners();
    } catch (e) { console.error(e); }
});