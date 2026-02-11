

# FitTrack — App de Seguimiento de Entrenamiento y Nutrición

## Visión General
Web app responsive (PWA) con diseño colorido y moderno (estilo Strava/Nike Training), con gradientes y colores vibrantes. Los datos se guardan en el navegador (localStorage) sin necesidad de crear cuenta. La app incluye IA integrada para análisis de alimentos.

---

## Estructura de la App

### Navegación Principal (barra inferior tipo app móvil)
- 🏋️ **Entrenamiento**
- 🍽️ **Alimentación**
- 📊 **Dashboard** (vista global)
- 👤 **Perfil**

---

## 1. Pantalla de Perfil y Configuración

- Formulario inicial (onboarding) para configurar: edad, peso, altura, sexo, nivel de actividad y objetivo (perder grasa / ganar músculo / mantenimiento)
- Cálculo automático de calorías objetivo diarias (fórmula Harris-Benedict/Mifflin-St Jeor) y distribución de macros recomendada
- Posibilidad de editar estos datos en cualquier momento
- Datos guardados en localStorage

---

## 2. Sección de Entrenamiento

- **Calendario interactivo** (vista semanal y mensual) mostrando los entrenamientos planificados y completados
- **Crear/editar entrenamiento**: tipo de ejercicio (gimnasio, correr, bici, yoga, natación, etc. con iconos), duración, intensidad (baja/media/alta), calorías quemadas (estimación automática según tipo+duración+intensidad o manual)
- **Entrenamientos recurrentes**: opción de repetir semanalmente una rutina
- Cards visuales con colores por tipo de actividad
- Vista de detalle del día seleccionado

---

## 3. Sección de Alimentación

- **Calendario diario** organizado por comidas: desayuno, almuerzo, cena, snacks
- **Registro manual por texto**: el usuario escribe lo que ha comido en lenguaje natural (ej: "dos huevos con tostadas y un café")
- **Registro por foto**: subir imagen del plato
- **IA integrada** (Lovable AI con Gemini) que analiza texto e imágenes para:
  - Detectar alimentos
  - Estimar calorías totales
  - Desglosar macronutrientes (proteínas, carbohidratos, grasas)
- **Edición de resultados**: el usuario puede corregir alimentos detectados, ajustar cantidades y modificar valores nutricionales manualmente
- Resumen nutricional del día visible en cada jornada

---

## 4. Dashboard — Vista Global

- **Timeline diario** combinando entrenamientos y comidas en orden cronológico
- **Balance calórico del día**: calorías ingeridas vs. quemadas, déficit o superávit
- **Barra de progreso de macros** (proteínas, carbos, grasas) vs. objetivo
- **Calendario mensual** con indicadores visuales de actividad (colores/iconos por día)
- Estadísticas rápidas: racha de días activos, promedio semanal

---

## 5. Diseño Visual

- Paleta vibrante con gradientes (naranjas, verdes, azules)
- Fondo oscuro con acentos de color brillante
- Tarjetas con bordes redondeados y sombras suaves
- Iconografía deportiva clara
- Tipografía bold para números y stats
- Animaciones sutiles en transiciones
- Layout optimizado para móvil (375px), usable en desktop

---

## Tecnologías Clave

- **Almacenamiento**: localStorage para todos los datos (sin backend)
- **IA**: Lovable AI (Gemini) vía Lovable Cloud para análisis de fotos y texto de comidas
- **Gráficos**: Recharts para visualizaciones de macros y calorías
- **Calendario**: Componente personalizado con navegación semanal/mensual

---

## Nota sobre IA y Backend

Aunque los datos se guardan localmente, la funcionalidad de IA para analizar comidas requiere Lovable Cloud (edge functions) para procesar las peticiones de forma segura. Se habilitará Lovable Cloud exclusivamente para esta funcionalidad.

