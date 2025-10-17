 export interface Cliente {
    Id: number;
    Nombres: string;
    Apellidos?: string;
    TipoIdentificacion?: string;
    Identificacion?: string;
    Agencia?: string;
    LineaCredito?: string;
    NumeroOperacion?: string;
    CodigoCedente?: string;
    FechaCarga?: string;
  }