async function registrarApoderado() {
    const msg = document.getElementById("msg");
    msg.classList.add("hidden");
    msg.innerText = "";

    // Capturar datos del formulario
    const data = {
        rutApoderado: document.getElementById("rutApoderado").value.trim(),
        nombreApoderado: document.getElementById("nombreApoderado").value.trim(),
        telefono: document.getElementById("telefono").value.trim(),
        correo: document.getElementById("correo").value.trim(),
        passwordApoderado: document.getElementById("passwordApoderado").value.trim(),

        rutJugador: document.getElementById("rutJugador").value.trim(),
        nombreJugador: document.getElementById("nombreJugador").value.trim(),
        fechaNacimiento: document.getElementById("fechaNacimiento").value
    };

    // Validación básica
    if (!data.rutApoderado || !data.nombreApoderado || !data.telefono || 
        !data.correo || !data.passwordApoderado ||
        !data.rutJugador || !data.nombreJugador || !data.fechaNacimiento) {

        msg.innerText = "Todos los campos son obligatorios.";
        msg.classList.remove("hidden");
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/api/auth/registro-apoderado", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });

        const json = await res.json();

        if (!res.ok) {
            msg.innerText = json.error || "Error al registrar la cuenta.";
            msg.classList.remove("hidden");
            return;
        }

        alert("Cuenta creada correctamente. Ahora puedes iniciar sesión.");
        window.location.href = "index.html";

    } catch (error) {
        console.error(error);
        msg.innerText = "Error al conectar con el servidor.";
        msg.classList.remove("hidden");
    }
}
