async function loadSidebar() {
    const rol = localStorage.getItem("rol");
    let sidebarFile = "";

    // Selección del sidebar correcto
    if (rol === "director") {
        sidebarFile = "../components/sidebar-director.html";
    } 
    else if (rol === "entrenador") {
        sidebarFile = "../components/sidebar-entrenador.html";
    } 
    else if (rol === "apoderado") {
        sidebarFile = "../components/sidebar-jugador.html";
    } 
    else {
        console.warn("ROL no reconocido, sidebar no cargado.");
        return;
    }

    try {
        // Insertar sidebar
        const res = await fetch(sidebarFile);
        const html = await res.text();

        document.getElementById("sidebarContainer").innerHTML = html;

        // Reactivar botón del menú móvil
        activarMenuMovil();

    } catch (error) {
        console.error("Error cargando sidebar:", error);
    }
}

function activarMenuMovil() {
    const btnMenu = document.getElementById("btnMenu");
    const sidebar = document.getElementById("sidebar");

    if (!btnMenu || !sidebar) return;

    btnMenu.addEventListener("click", () => {
        sidebar.classList.toggle("active"); // ← usa responsive.css
    });
}

document.addEventListener("DOMContentLoaded", loadSidebar);
