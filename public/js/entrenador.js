const token = localStorage.getItem("token");
if (!token) window.location.href = "../index.html";

function logout() {
  localStorage.clear();
  window.location.href = "../index.html";
}

document.getElementById("formEventoEntrenador").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    categoriaId: document.getElementById("categoriaId").value,
    tipoEvento: document.getElementById("tipoEvento").value,
    fecha: document.getElementById("fecha").value,
    lugar: document.getElementById("lugar").value
  };

  const res = await fetch("http://localhost:3000/api/notificaciones/evento", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  const json = await res.json();
  alert(json.mensaje || json.error);
});
