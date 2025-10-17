// Define la interfaz DtoDeviceInfo para el envío inicial del login
export interface DtoDeviceInfo {
    // Campos obligatorios para el registro inicial del dispositivo
    Identificador: string;       // ¡OBLIGATORIO! (Quitamos el ?)
    Nombre: string;              // ¡OBLIGATORIO!
    Modelo: string;              // ¡OBLIGATORIO!
    Plataforma: string;          // ¡OBLIGATORIO!
    SistemaOperativo: string;    // ¡OBLIGATORIO!
    VersionOs: string;           // ¡OBLIGATORIO!
    VersionSdkAndroid: string;   // ¡OBLIGATORIO!
    Fabricante: string;          // ¡OBLIGATORIO!
    EsDispositivoVirtual: boolean; // ¡OBLIGATORIO!
    VersionApp: string;          // ¡OBLIGATORIO!
    
    // Campos de medición (aunque pueden ser 0, deben estar presentes)
    MemoriaUsada: number;
    EspacioLibreDisco: number;
    EspacioTotalDisco: number;

    // Estos campos generalmente los maneja el backend o son opcionales para la llamada inicial:
    IdDispositivoApp?: number; 
    IdSistema?: number;
    // ... (otros campos de fecha/asignación)
}