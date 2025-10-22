Proyecto Método Estrellita
Aplicación web educativa desarrollada para apoyar el proceso de aprendizaje de la lectura inicial en niños de primer grado, basada en el enfoque fonético del Método Estrellita. El sistema integra reconocimiento de voz e inteligencia artificial para analizar la precisión de la lectura y registrar el progreso de los estudiantes.

Objetivo General
Facilitar el aprendizaje de la lectura mediante una plataforma interactiva que combine tecnología moderna, inteligencia artificial y metodologías fonéticas, permitiendo al docente monitorear el avance de sus estudiantes.

Descripción del Funcionamiento
El sistema cuenta con dos perfiles principales:
1. Estudiante: Accede mediante un código o QR, practica letras, sílabas, oraciones y textos. La aplicación reconoce su voz, analiza la precisión de lectura y genera retroalimentación automática.
2. Docente: Accede a un panel de control donde visualiza reportes individuales y grupales con gráficos de progreso.

Funciones de Inteligencia Artificial
	1. Reconocimiento de voz: Implementado con la API Web Speech Recognition, que convierte la voz del estudiante en texto. El sistema fue adaptado para evitar duplicaciones de palabras en dispositivos móviles.
	2. Evaluación automática de lectura: Compara la lectura esperada con la transcripción real mediante algoritmos de distancia de Levenshtein, calculando precisión en palabras (WER) y caracteres (CER).

3. Análisis de progreso: Cada intento de lectura se almacena con precisión, texto leído y fecha, guardado en Supabase (PostgreSQL en la nube) para ser consultado por el docente.


Tecnologías Principales
• Frontend: React + Vite
• Base de datos: Supabase (PostgreSQL, Auth y RPC)
• Inteligencia artificial: Web Speech API
• Gráficos: Chart.js / Recharts
• Códigos QR: qrcode.react


Indicadores (KPI)
1. Precisión promedio de lectura.
2. Número de sesiones activas por estudiante.
3. Avance semanal del rendimiento.
4. Porcentaje de alumnos activos.


Estructura Principal del Sistema
• /src/hooks/useWebSpeech.js → Control del reconocimiento de voz.
• /src/pages/SentencesPage.jsx → Evaluación automática y retroalimentación.
• /src/services/speechAssess.js → Registro de evaluaciones en Supabase.
• /src/pages/teacher/StudentReport.jsx → Panel de reportes y gráficos.
• /src/pages/LoginStudent.jsx → Acceso mediante código o QR.


DEPENDENCIAS 
• React / Vite: Interfaz moderna y rendimiento rápido.
• Supabase JS: Base de datos, autenticación y funciones RPC.
• React Router DOM: Navegación entre páginas (Login, Docente, Estudiante).
• QRCode.react: Generación de códigos QR para acceso rápido.
• SpeechRecognition API: Reconocimiento de voz y transcripción.
• Chart.js / Recharts (opcional): Gráficos en reportes docentes.

