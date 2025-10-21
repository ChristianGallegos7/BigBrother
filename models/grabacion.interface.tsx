export interface Grabacion {
    IdGrabacion: string;
    NombreArchivo: string;
    FechaCreacion: string;
    Duracion: number;
    Identificacion: string;
    Agencia?: string;
    LineaCredito?: string;
    NumeroOperacion?: string;
    EsLocal?: boolean;
    ClienteNombreCompleto?: string;
}