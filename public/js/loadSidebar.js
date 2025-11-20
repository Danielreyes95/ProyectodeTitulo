async function loadSidebar() {
    const rol = localStorage.getItem("rol");
    let sidebarFile = "";

    if (rol === "director") 
        sidebarFile = "../assets/css/sidebar-director.html";

    else if (rol === "entrenador") 
        sidebarFile = "../assets/css/sidebar-entrenador.html";

    else if (rol === "apoderado") 
        sidebarFile = "../assets/css/sidebar-jugador.html";

    else return;

    try {
        const res = await fetch(sidebarFile);
        const html = await res.text();
        document.getElementById("sidebar-container").innerHTML = html;

    } catch (error) {
        console.error("Error cargando sidebar:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadSidebar);
