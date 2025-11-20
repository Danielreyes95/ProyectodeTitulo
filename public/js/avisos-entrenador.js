/* ============================================================
   CONFIG
============================================================ */
const API = `${BASE_URL}/api`;

const entrenadorId = localStorage.getItem("idEntrenador");
const categoriaId = localStorage.getItem("categoria");

if (!entrenadorId || !categoriaId) {
    alert("Error: Datos del entrenador no encontrados en localStorage.");
}

/* ============================================================
   LOGOUT
============================================================ */
function logout() {
    localStorage.clear();
    window.location.href = "../index.html";
}

/* ============================================================
   MOSTRAR / OCULTAR BLOQUE JUGADOR
============================================================ */
function mostrarJugador() {
    const dest = document.getElementById("avisoDestinatario").value;
    const bloque = document.getElementById("bloqueJugador");

    if (dest === "Jugador") {
        bloque.classList.remove("hidden");
        cargarJugadoresDeCategoria();
    } else {
        bloque.classList.add("hidden");
    }
}

/* ============================================================
   CARGAR JUGADORES SOLO DE ESA CATEGORÍA
============================================================ */
async function cargarJugadoresDeCategoria() {
    const select = document.getElementById("avisoJugadorId");
    select.innerHTML = `<option value="">Seleccione un jugador...</option>`;

    try {
        const res = await fetch(`${BASE_URL}/api/jugadores/listar`);
        const jugadores = await res.json();

        const filtrados = jugadores.filter(j => j.categoria?._id === categoriaId);

        filtrados.forEach(j => {
            select.innerHTML += `
                <option value="${j._id}">
                    ${j.nombre} (Apoderado: ${j.apoderado?.nombre || "—"})
                </option>`;
        });

    } catch (err) {
        console.error("Error cargando jugadores:", err);
    }
}

/* ============================================================
   CARGAR AVISOS CREADOS POR EL ENTRENADOR
============================================================ */
async function cargarAvisos() {
    try {
        const res = await fetch(`${BASE_URL}/api/avisos`);
        let avisos = await res.json();

        // Filtrar solo LOS avisos creados por este entrenador
        avisos = avisos.filter(a => String(a.creadorId) === String(entrenadorId));

        const tbody = document.getElementById("tbodyAvisos");
        const mensaje = document.getElementById("mensajeSinAvisos");
        tbody.innerHTML = "";

        if (avisos.length === 0) {
            mensaje.classList.remove("hidden");
            return;
        }

        mensaje.classList.add("hidden");

        avisos.forEach(a => {
            const fecha = a.createdAt
                ? new Date(a.createdAt).toLocaleDateString("es-CL")
                : "—";

            tbody.innerHTML += `
                <tr class="border-b">
                    <td class="p-2 font-bold">${a.titulo}</td>
                    <td class="p-2">${fecha}</td>
                    <td class="p-2">
                        ${a.destinatario === "Categoria"
                            ? "Toda la categoría"
                            : "Jugador específico"}
                    </td>
                    <td class="p-2 flex gap-2">
                        <button onclick="eliminarAviso('${a._id}')"
                            class="bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Error al cargar avisos:", err);
        alert("Error al cargar avisos.");
    }
}

/* ============================================================
   ABRIR MODAL
============================================================ */
function abrirModalAviso() {
    document.getElementById("avisoTitulo").value = "";
    document.getElementById("avisoContenido").value = "";
    document.getElementById("avisoDestinatario").value = "Categoria";
    document.getElementById("bloqueJugador").classList.add("hidden");

    document.getElementById("modalAviso").classList.remove("hidden");
}

/* ============================================================
   CERRAR MODAL
============================================================ */
function cerrarModalAviso() {
    document.getElementById("modalAviso").classList.add("hidden");
}

/* ============================================================
   GUARDAR AVISO
============================================================ */
async function guardarAviso() {
    const titulo = document.getElementById("avisoTitulo").value.trim();
    const contenido = document.getElementById("avisoContenido").value.trim();
    const destinatario = document.getElementById("avisoDestinatario").value;

    if (!titulo || !contenido)
        return alert("Debes ingresar título y contenido.");

    let destinatarioId = null;

    if (destinatario === "Jugador") {
        destinatarioId = document.getElementById("avisoJugadorId").value;
        if (!destinatarioId) return alert("Seleccione un jugador.");
    }

    const payload = {
        titulo,
        contenido,
        tipo: "General",
        categoriaId,               // SIEMPRE LA CATEGORÍA DEL ENTRENADOR
        creadorId: entrenadorId,   // <- Para filtrar luego
        destinatario: destinatario === "Categoria"
            ? "ApoderadosCategoria"
            : "ApoderadoEspecifico",
        destinatarioId
    };

    const res = await fetch(`${BASE_URL}/api/avisos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.error) return alert("❌ " + data.error);

    alert("✔ Aviso enviado correctamente");

    cerrarModalAviso();
    cargarAvisos();
}

/* ============================================================
   ELIMINAR AVISO
============================================================ */
async function eliminarAviso(id) {
    if (!confirm("¿Seguro que deseas eliminar este aviso?")) return;

    const res = await fetch(`${BASE_URL}/api/avisos/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (data.error) return alert("❌ " + data.error);

    alert("✔ Aviso eliminado.");
    cargarAvisos();
}

/* ============================================================
   SOCKET.IO (opcional)
============================================================ */
if (typeof io !== "undefined") {
    const socket = io();
    socket.on("nuevo-aviso", aviso => {
        console.log("📩 Aviso recibido:", aviso);
        cargarAvisos();
    });
}

/* ============================================================
   INICIO
============================================================ */
cargarAvisos();
