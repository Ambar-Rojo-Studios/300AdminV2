export interface createEtiquetasXCliente {
  id: 0,
  fkIdCliente: number, //Este foreign key se usa para obtner el nombre del cliente
  fkIdEtiqueta: number // Este foreign key se usa para obtner el nombre de la categoria
}

export interface listEtiquetasXCliente {
    id: number,
    fkIdCliente: number, //Este foreign key se usa para obtener el nombre del cliente
    fkIdCategoria: number, // Este foreign key se usa para obtener el nombre de la categoria
    fldCategoria: string,
    fkIdEtiqueta: number, // Este foreign key se usa para obtener el nombre de la etiqueta
    fldNombre: string
}

export interface ApiResponseEtiquetasXCliente<T> {
  codigoEstatus: number;
  mensaje: string;
  cuerpoDeRespuesta: T;
}