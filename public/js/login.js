document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const rut = document.getElementById("rut").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rut, password }),
    });

    const data = await res.json();
    console.log("RESPUESTA LOGIN:", data);

    // Si hay error de backend
    if (!res.ok || data.error) {
      mostrarNotificacion(data.error || "Credenciales incorrectas");
      return;
    }

    // Guardar token y rol
    localStorage.setItem("token", data.token);
    localStorage.setItem("rol", data.rol);

    /* ===========================================
       🟢 DIRECTOR
    =========================================== */
    if (data.rol === "director") {
      window.location.href = "./director/director.html";
      return;
    }

    /* ===========================================
       🟢 ENTRENADOR
    =========================================== */
    if (data.rol === "entrenador") {

      localStorage.setItem("idEntrenador", data.usuario.id);

      if (data.usuario.categoria) {
        localStorage.setItem("categoria", data.usuario.categoria);
      }

      if (data.usuario.categoriaNombre) {
        localStorage.setItem("categoriaNombre", data.usuario.categoriaNombre);
      }

      localStorage.setItem("nombreEntrenador", data.usuario.nombre);
      localStorage.setItem("correoEntrenador", data.usuario.correo);

      window.location.href = "./entrenador/entrenador.html";
      return;
    }

    /* ===========================================
       🟢 APODERADO → PANEL JUGADOR
    =========================================== */
    if (data.rol === "apoderado" && data.panel === "jugador") {

      console.log("LOGIN APODERADO DETECTADO → Redirigiendo panel jugador");

      // Datos del apoderado
      localStorage.setItem("idApoderado", data.usuario.id);
      localStorage.setItem("nombreApoderado", data.usuario.nombre);
      localStorage.setItem("correoApoderado", data.usuario.correo);

      // Datos del jugador
      localStorage.setItem("idJugador", data.jugador._id);
      localStorage.setItem("nombreJugador", data.jugador.nombre);
      localStorage.setItem("rutJugador", data.jugador.rut);
      localStorage.setItem("categoriaJugador", data.jugador.categoria);
      localStorage.setItem("categoriaNombreJugador", data.jugador.categoriaNombre);

      window.location.href = "./jugador/jugador.html";
      return;
    }

    /* ===========================================
       ❌ Si ningún caso coincide
    =========================================== */
    mostrarNotificacion("Rol de usuario no reconocido.");

  } catch (err) {
    console.error(err);
    mostrarNotificacion("Error al intentar iniciar sesión");
  }
});
