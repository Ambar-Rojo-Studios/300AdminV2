type MostrarMensajeFn = (mensaje: string, tipo: 'error' | 'success') => void;

/**
 * Procesa una imagen desde un File, la redimensiona y la convierte a Base64.
 * Retorna null si ocurre un error o si el archivo no cumple con las validaciones.
 */
export const procesarYComprimirImagen = (file: File, mostrarMensaje: MostrarMensajeFn): Promise<string | null> => {
  return new Promise((resolve) => {
    // Validar el tipo y tamaño del archivo antes de intentar procesarlo.
    const tiposValidos = ['image/jpeg', 'image/png'];
    const tamanoMaximoMB = 5;

    if (!tiposValidos.includes(file.type)) {
      mostrarMensaje('❌ Solo se permiten imágenes JPEG o PNG.', 'error');
      return resolve(null);
    }
    if (file.size > tamanoMaximoMB * 1024 * 1024) {
      mostrarMensaje(`❌ El archivo excede el tamaño máximo de ${tamanoMaximoMB}MB.`, 'error');
      return resolve(null);
    }

    // Leer el archivo como Data URL para poder cargarlo en un elemento Image.
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar la imagen respetando el aspecto.
        const canvas = document.createElement('canvas');
        const ANCHO_MAXIMO = 300;
        const escala = ANCHO_MAXIMO / img.width;
        canvas.width = ANCHO_MAXIMO;
        canvas.height = img.height * escala;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          mostrarMensaje('❌ Error al procesar la imagen.', 'error');
          return resolve(null);
        }

        // Dibujar la imagen redimensionada en el canvas.
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convertir el contenido del canvas a una cadena Base64 en formato JPEG.
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64 = dataUrl.split('base64,')[1];
        resolve(base64);
      };
      img.onerror = () => {
        mostrarMensaje('❌ Error al cargar la imagen.', 'error');
        resolve(null);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      mostrarMensaje('❌ Error al leer el archivo.', 'error');
      resolve(null);
    };
    reader.readAsDataURL(file);
  });
};