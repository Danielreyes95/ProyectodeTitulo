const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function enviarCorreo(destinatarios, asunto, html) {
  try {
    await transporter.sendMail({
      from: `"Escuela de Fútbol" <${process.env.EMAIL_USER}>`,
      to: destinatarios,
      subject: asunto,
      html
    });

    console.log("📧 Correo enviado a:", destinatarios);
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
  }
}

module.exports = { enviarCorreo };
