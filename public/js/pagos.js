/* =====================================================
   VARIABLES GLOBALES
===================================================== */
let jugadorSeleccionado = null;
let anioIns = null;
let mesIns = null;

/* =====================================================
   LOGOUT
===================================================== */
function logout() {
    localStorage.clear();
    window.location.href = "../index.html";
}

/* =====================================================
   CARGAR CATEGORÍAS PARA FILTRO
===================================================== */
async function cargarCategoriasFiltro() {
    const res = await fetch("http://localhost:3000/api/categorias");
    const categorias = await res.json();

    const select = document.getElementById("filtroCategoria");
    select.innerHTML = `<option value="">Todas</option>`;

    categorias.forEach(c => {
        select.innerHTML += `<option value="${c._id}">${c.nombre}</option>`;
    });
}

/* =====================================================
   CARGAR MES ACTUAL
===================================================== */
function cargarMesActual() {
    const hoy = new Date();
    const mes = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0");
    document.getElementById("filtroMes").value = mes;
}

/* =====================================================
   FORMATO CLP
===================================================== */
function clp(num) {
    return new Intl.NumberFormat("es-CL").format(num);
}

/* =====================================================
   CARGAR PAGOS
===================================================== */
async function cargarPagos() {

    const categoria = document.getElementById("filtroCategoria").value;
    const mes = document.getElementById("filtroMes").value;
    const estado = document.getElementById("filtroEstado").value;
    const search = document.getElementById("filtroBuscar").value.toLowerCase();

    if (!mes) return;

    const res = await fetch(
        `http://localhost:3000/api/pagos/resumen?mes=${mes}&categoriaId=${categoria}`
    );

    const data = await res.json();
    const tbody = document.getElementById("tbodyPagos");

    document.getElementById("bloqueResumen").classList.remove("hidden");
    document.getElementById("resPagados").innerText = data.pagados;
    document.getElementById("resPendientes").innerText = data.pendientes;
    document.getElementById("resAtrasados").innerText = data.atrasados;
    document.getElementById("resMonto").innerText = `$${clp(data.montoTotal)}`;

    tbody.innerHTML = "";

    const hoy = new Date();
    const mesActual = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0");

    let lista = data.jugadores.map(j => {
        let estadoReal = j.estadoPago.toLowerCase();

        if (estadoReal === "pendiente" && mes < mesActual)
            estadoReal = "atrasado";

        return { ...j, estadoPago: estadoReal };
    });

    lista = lista.filter(j =>
        (estado === "" || j.estadoPago === estado) &&
        (search === "" || j.nombre.toLowerCase().includes(search) || j.rut.includes(search))
    );

    lista.forEach(j => {

        const fechaInsc = j.inscripcion
            ? new Date(j.inscripcion).toLocaleDateString("es-CL", { year: "numeric", month: "2-digit" })
            : "—";

        tbody.innerHTML += `
            <tr class="border-b">
                <td class="p-2">${j.nombre}</td>
                <td class="p-2">${j.rut}</td>
                <td class="p-2">${fechaInsc}</td>

                <td class="p-2">
                    <span class="px-2 py-1 rounded text-white ${
                        j.estadoPago === "pagado"
                            ? "bg-green-600"
                            : j.estadoPago === "pendiente"
                            ? "bg-yellow-600"
                            : "bg-red-600"
                    }">
                        ${j.estadoPago}
                    </span>
                </td>

                <td class="p-2">$${clp(j.monto)}</td>

                <td class="p-2 flex flex-wrap gap-2">

                    <!-- REGISTRAR PAGO -->
                    <button onclick="abrirModalPago('${j.jugadorId}', '${mes}', '${j.nombre}')"
                        class="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-800">
                        Registrar
                    </button>

                    <!-- HISTORIAL -->
                    <button onclick="abrirHistorial('${j.jugadorId}', '${j.nombre}')"
                        class="bg-blue-600 text-white px-2 py-1 rounded text-sm hover:bg-blue-800">
                        Historial
                    </button>

                    <!-- EDITAR + ELIMINAR -->
                    ${j.pagoId ? `
                        <button onclick="abrirModalEditarPago('${j.pagoId}', '${j.jugadorId}', '${j.nombre}', '${mes}')"
                            class="bg-yellow-600 text-white px-2 py-1 rounded text-sm hover:bg-yellow-800">
                            Editar
                        </button>

                        <button onclick="eliminarPago('${j.pagoId}')"
                            class="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-800">
                            Eliminar
                        </button>
                    ` : `
                        <span class="text-gray-500 text-sm italic">Sin pago registrado</span>
                    `}
                </td>
            </tr>
        `;
    });
}

/* =====================================================
   MODAL REGISTRAR PAGO
===================================================== */
function abrirModalPago(idJugador, mes, nombre) {

    document.getElementById("pagoJugadorId").value = idJugador;
    document.getElementById("pagoMes").value = mes;
    document.getElementById("pagoJugadorNombre").innerText = nombre;

    document.getElementById("pagoMonto").value = "";

    const partes = mes.split("-");
    document.getElementById("pagoMesTexto").innerText = `${partes[1]}-${partes[0]}`;

    document.getElementById("modalPago").classList.remove("hidden");
}

function cerrarModalPago() {
    document.getElementById("modalPago").classList.add("hidden");
}

async function confirmarPago() {

    const jugadorId = document.getElementById("pagoJugadorId").value;
    const mes = document.getElementById("pagoMes").value;
    const metodo = document.getElementById("pagoMetodo").value;
    const obs = document.getElementById("pagoObservacion").value;

    let montoStr = document.getElementById("pagoMonto").value;
    montoStr = montoStr.replace(/\D/g, "");
    const monto = Number(montoStr);

    if (!monto || isNaN(monto) || monto <= 0) return alert("Debe ingresar un monto válido.");
    if (!metodo) return alert("Debe seleccionar un método.");

    const res = await fetch("http://localhost:3000/api/pagos/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            jugadorId,
            mes,
            monto,
            metodoPago: metodo,
            observacion: obs
        })
    });

    const data = await res.json();

    if (data.error) return alert("Error: " + data.error);

    alert("Pago registrado.");
    cerrarModalPago();
    cargarPagos();
}

/* =====================================================
   MODAL EDITAR PAGO
===================================================== */
async function abrirModalEditarPago(pagoId, jugadorId, nombre, mes) {

    jugadorSeleccionado = jugadorId;

    document.getElementById("editarJugadorNombre").innerText = nombre;
    document.getElementById("editarPagoId").value = pagoId;

    const partes = mes.split("-");
    document.getElementById("editarMesTexto").innerText = `${partes[1]}-${partes[0]}`;

    const res = await fetch(`http://localhost:3000/api/pagos/jugador/${jugadorSeleccionado}`);
    const data = await res.json();

    const pago = data.pagos.find(p => p._id === pagoId);

    if (!pago) {
        alert("No se pudo cargar la información del pago.");
        return;
    }

    document.getElementById("editarMetodo").value = pago.metodoPago;
    document.getElementById("editarMonto").value = pago.monto;
    document.getElementById("editarObservacion").value = pago.observacion || "";

    document.getElementById("modalEditar").classList.remove("hidden");
}

function cerrarModalEditar() {
    document.getElementById("modalEditar").classList.add("hidden");
}

async function confirmarEdicionPago() {

    const pagoId = document.getElementById("editarPagoId").value;
    const metodo = document.getElementById("editarMetodo").value;
    const monto = document.getElementById("editarMonto").value;
    const obs = document.getElementById("editarObservacion").value;

    const payload = {};

    if (metodo) payload.metodoPago = metodo;
    if (monto !== "") payload.monto = Number(monto);
    if (obs.trim() !== "") payload.observacion = obs;

    if (Object.keys(payload).length === 0)
        return alert("No hay cambios para guardar.");

    const res = await fetch(`http://localhost:3000/api/pagos/editar/${pagoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.error) return alert("Error: " + data.error);

    alert("Pago actualizado correctamente.");
    cerrarModalEditar();
    cargarPagos();
}

/* =====================================================
   ELIMINAR PAGO
===================================================== */
async function eliminarPago(pagoId) {

    if (!confirm("¿Eliminar pago definitivamente?")) return;

    const res = await fetch(`http://localhost:3000/api/pagos/eliminar/${pagoId}`, {
        method: "DELETE"
    });

    const data = await res.json();

    if (data.error) return alert("Error: " + data.error);

    alert("Pago eliminado correctamente.");
    cargarPagos();
}

/* =====================================================
   HISTORIAL
===================================================== */
async function abrirHistorial(idJugador, nombre) {

    jugadorSeleccionado = idJugador;
    document.getElementById("histJugadorNombre").innerText = nombre;

    await cargarAniosHistorial(idJugador);

    const anioActual = new Date().getFullYear();
    await cargarHistorial(anioActual);

    document.getElementById("modalHistorial").classList.remove("hidden");
}

function cerrarModalHistorial() {
    document.getElementById("modalHistorial").classList.add("hidden");
}

async function cargarAniosHistorial(idJugador) {

    const jugadorRes = await fetch(`http://localhost:3000/api/jugadores/${idJugador}`);
    const jugador = await jugadorRes.json();

    const pagosRes = await fetch(`http://localhost:3000/api/pagos/jugador/${idJugador}`);
    const pagosData = await pagosRes.json();

    const fecha = jugador.createdAt ? new Date(jugador.createdAt) : new Date();
    anioIns = fecha.getFullYear();
    mesIns = fecha.getMonth();

    let anioMaxPago = anioIns;
    pagosData.pagos.forEach(p => {
        const [anio] = p.mes.split("-");
        const n = Number(anio);
        if (n > anioMaxPago) anioMaxPago = n;
    });

    const select = document.getElementById("selectAnio");
    select.innerHTML = "";

    for (let a = anioIns; a <= anioMaxPago; a++) {
        select.innerHTML += `<option value="${a}">${a}</option>`;
    }

    select.onchange = e => cargarHistorial(Number(e.target.value));
}

async function cargarHistorial(anio) {

    const res = await fetch(`http://localhost:3000/api/pagos/jugador/${jugadorSeleccionado}`);
    const data = await res.json();

    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const tbody = document.getElementById("tbodyHistorial");

    tbody.innerHTML = "";

    for (let m = 0; m < 12; m++) {

        if (anio === anioIns && m < mesIns) continue;

        const mesStr = `${anio}-${String(m + 1).padStart(2, "0")}`;
        const pago = data.pagos.find(p => p.mes === mesStr);

        tbody.innerHTML += `
            <tr class="border-b">
                <td class="p-2">${meses[m]}</td>
                <td class="p-2">${pago ? "pagado" : "pendiente"}</td>
                <td class="p-2">${pago?.metodoPago || "—"}</td>
                <td class="p-2">${pago?.fechaPago ? new Date(pago.fechaPago).toLocaleDateString("es-CL") : "—"}</td>
                <td class="p-2">${pago?.observacion || "—"}</td>
            </tr>
        `;
    }
}

/* =====================================================
   EVENTOS
===================================================== */
document.getElementById("filtroCategoria").addEventListener("change", cargarPagos);
document.getElementById("filtroMes").addEventListener("change", cargarPagos);
document.getElementById("filtroEstado").addEventListener("change", cargarPagos);
document.getElementById("filtroBuscar").addEventListener("input", cargarPagos);

/* Inicializar */
cargarCategoriasFiltro();
cargarMesActual();
cargarPagos();

/* Cerrar modales con ESC */
document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        document.getElementById("modalPago").classList.add("hidden");
        document.getElementById("modalEditar").classList.add("hidden");
        document.getElementById("modalHistorial").classList.add("hidden");
    }
});

/* =====================================================
   FORMATEAR MONTO
===================================================== */
function formatearMonto(input) {
    let valor = input.value.replace(/\D/g, "");

    if (valor) {
        input.value = Number(valor).toLocaleString("es-CL");
    } else {
        input.value = "";
    }
}
