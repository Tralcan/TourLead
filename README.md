# TourLead Connect - Project Documentation

## 1. Introducción

**TourLead Connect** es una aplicación web completa desarrollada para servir como un puente de conexión vital entre guías turísticos profesionales y las empresas que requieren sus servicios. La plataforma está diseñada para agilizar el proceso de búsqueda, contratación y gestión de trabajos, proporcionando un ecosistema centralizado y eficiente para ambas partes.

**Stack Tecnológico:**

*   **Framework:** Next.js (con App Router)
*   **Base de Datos y Autenticación:** Supabase
*   **Librería de UI:** ShadCN UI
*   **Estilos:** Tailwind CSS
*   **Notificaciones por Email:** Resend
*   **Exportación de Datos:** `xlsx`

---

## 2. Funcionalidades Principales

### 2.1. Roles de Usuario y Autenticación

La plataforma soporta dos roles de usuario distintos, cada uno con su propio panel y funcionalidades específicas:

*   **Guías:** Profesionales del turismo que ofrecen sus servicios.
*   **Empresas:** Operadores de tours que buscan contratar guías.

La autenticación se maneja a través de **Google OAuth** con Supabase. El sistema identifica el rol seleccionado por el usuario en la página de inicio de sesión y lo redirige automáticamente al panel correspondiente (`/guide` o `/company`).

### 2.2. Paneles de Control (Layouts)

Cada rol tiene un layout de panel dedicado y persistente, que incluye:

*   **Navegación Lateral:** Una barra de navegación con iconos que se expande al pasar el mouse (en escritorio) y se convierte en un menú deslizable en dispositivos móviles.
*   **Menú de Usuario:** Un menú desplegable en la esquina superior derecha que permite acceder al perfil, a la página de soporte y cerrar sesión.
*   **Diseño Responsivo:** Toda la interfaz está diseñada para ser completamente funcional en dispositivos móviles y de escritorio.

---

## 3. Panel de Empresa

Funcionalidades diseñadas para que las empresas gestionen la contratación de talento.

*   **Perfil de la Empresa:** Las empresas pueden crear y editar su perfil público, incluyendo nombre, detalles, especialidades e información de contacto.
*   **Búsqueda de Guías:** Una potente funcionalidad (accesible solo con suscripción activa) que permite buscar guías filtrando por:
    *   Rango de fechas de disponibilidad.
    *   Especialidades (ej. Historia, Senderismo).
    *   Idiomas hablados.
*   **Sistema de Ofertas:** Desde los resultados de búsqueda, las empresas pueden enviar ofertas de trabajo detalladas a los guías. Estas ofertas activan una **notificación por correo electrónico** al guía.
*   **Gestión de Guías Contratados:** Un panel para ver los guías con compromisos activos y las ofertas pendientes. Permite acceder rápidamente a los perfiles de los guías contratados.
*   **Historial de Contrataciones:** Revisa un registro de todos los trabajos finalizados, permite calificar a los guías (sistema de calificación mutua) y exportar el historial completo a un archivo **Excel**.
*   **Reputación de la Empresa:** Visualiza las calificaciones y comentarios recibidos de los guías. Las evaluaciones son visibles solo si ambas partes se han calificado mutuamente.
*   **Panel de Administración:** Una sección exclusiva para administradores de la plataforma.
    *   **Gestión de Suscripciones:** Permite a los administradores crear, renovar y cancelar suscripciones para las empresas.
    *   **Registro de Auditoría:** Un historial completo de todas las acciones de suscripción, con filtros por empresa y la capacidad de **exportar los datos a Excel**.

---

## 4. Panel de Guía

Un conjunto de herramientas para que los guías gestionen su carrera profesional.

*   **Perfil de Guía:** Los guías pueden personalizar su perfil público, incluyendo foto de perfil (almacenada en Supabase Storage), resumen profesional, información académica, especialidades, idiomas y su tarifa por día.
*   **Gestión de Disponibilidad:** Un calendario interactivo donde los guías pueden marcar sus días disponibles. Los días en los que tienen un compromiso aceptado se bloquean automáticamente.
*   **Gestión de Ofertas:** Un buzón donde los guías reciben las ofertas de trabajo de las empresas. Pueden revisar los detalles y **aceptar o rechazar** cada oferta. La aceptación de una oferta activa una notificación por correo a la empresa.
*   **Mis Compromisos:** Una vista de todos los trabajos futuros y en curso, con detalles sobre el trabajo y la empresa contratante.
*   **Historial de Compromisos:** Un registro de todos los trabajos pasados, con la opción de calificar a las empresas y exportar el historial a **Excel**.
*   **Mi Reputación:** Panel para ver las calificaciones y comentarios recibidos por parte de las empresas.

---

## 5. Mejoras Técnicas y Correcciones Clave

Durante el desarrollo se implementaron varias mejoras y se solucionaron errores críticos:

*   **Diseño Responsivo Total:** Se aplicó el patrón "Tabla a Tarjeta" en las páginas con alta densidad de datos (`Auditoría`, `Historial`, etc.) para garantizar una excelente experiencia en dispositivos móviles.
*   **Navegación Móvil Optimizada:** Se corrigió el menú lateral móvil para que funcione como un panel deslizable (`Sheet`) que se cierra automáticamente al seleccionar una opción, mejorando la fluidez de la navegación.
*   **Corrección de Errores Críticos:**
    *   Se solucionó un error persistente en la cancelación de suscripciones, identificando y corrigiendo una suposición incorrecta sobre el tipo de dato del ID (era `UUID`/`string`, no `number`).
    *   Se depuró y corrigió la lógica de cálculo de las estadísticas de la página de inicio para que el "número de guías" y los "días disponibles" reflejen cifras precisas y reales, filtrando perfiles incompletos y restando días ya comprometidos.
*   **Página de Soporte:** Se creó una página de soporte dedicada con preguntas frecuentes y datos de contacto, integrada en el menú de usuario para fácil acceso.
*   **Usabilidad del Botón "Volver":** Se cambió el comportamiento del botón de retorno en la página de soporte para usar el historial del navegador (`router.back()`) en lugar de redirigir a la página de inicio, creando una experiencia más intuitiva.

---

This documentation provides a comprehensive overview of the **TourLead Connect** project, its features, and the key development milestones.
