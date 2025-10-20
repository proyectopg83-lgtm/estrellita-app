// src/utils/aiMock.js
// Simula evaluación asíncrona. Devuelve {passed, score, feedback}
export async function evaluateReading({ expectedText, blobUrl }) {
  // Simulación: espera 1.2s y aprueba ~80%
  await new Promise((r) => setTimeout(r, 1200));
  const score = Math.floor(70 + Math.random() * 30); // 70..99
  const passed = score >= 75;
  const feedback = passed
    ? "¡Muy bien! Lectura clara y fluida."
    : "Intenta leer un poco más despacio y pronunciar mejor.";
  return { passed, score, feedback };
}
