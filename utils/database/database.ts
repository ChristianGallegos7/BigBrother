// database.ts - Actualizado para expo-sqlite moderna
import * as SQLite from 'expo-sqlite';
import { environment } from '../../components/core/environment';
import { Cliente } from '../../models/clinte.interface';

// Abrir o crear la base de datos
import * as FileSystem from 'expo-file-system/legacy';

const DB_FILENAME = 'clientes.db';
const DB_PATH = FileSystem.documentDirectory + DB_FILENAME;

export const getDBConnection = async () => {
  try {
    return await SQLite.openDatabaseAsync(DB_FILENAME);
  } catch (err) {
    console.error('❌ Error abriendo la base de datos:', err);
    // Intentar eliminar la base dañada y recrear
    try {
      await FileSystem.deleteAsync(DB_PATH, { idempotent: true });
      console.warn('🧹 Base de datos dañada eliminada. Intentando recrear...');
      const db = await SQLite.openDatabaseAsync(DB_FILENAME);
      // Recrear tablas principales
      await createClientesTable(db);
      await createGrabacionesTable(db);
      return db;
    } catch (fatalErr) {
      console.error('❌ Error fatal al recrear la base de datos:', fatalErr);
      throw fatalErr;
    }
  }
};

// Crear tabla de clientes locales
export const createClientesTable = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS clientes_locales (
      localId TEXT PRIMARY KEY NOT NULL,
      Identificacion TEXT,
      Nombres TEXT,
      Apellidos TEXT,
      NumeroOperacion TEXT,
      FechaCarga TEXT,
      Agencia TEXT,
      LineaCredito TEXT,
      TieneGrabacion INTEGER,
      UsuarioAsignacion TEXT,
      Fuente TEXT,
      CodigoCedente TEXT,
      TipoIdentificacion TEXT,
      DatosAdicionales TEXT,
      IdClienteCarga INTEGER,
      IdExterno TEXT,
      pais TEXT,
      sincronizado INTEGER
    );
  `);
};

// Crear tabla de grabaciones pendientes
export const createGrabacionesTable = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS grabaciones_pendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Identificacion TEXT,
      audioPath TEXT,
      FechaInicio TEXT,
      FechaFin TEXT,
      Latitud TEXT,
      Longitud TEXT,
      Agencia TEXT,
      LineaCredito TEXT,
      NumeroOperacion TEXT,
      user TEXT,
      Duracion REAL,
      TiempoDuracion TEXT,
      sincronizado INTEGER DEFAULT 0,
      EsLocal INTEGER DEFAULT 0
    );
  `);
};

// Guardar cliente local en SQLite
export const guardarClienteLocalEnSQLite = async (cliente: any) => {
  try {
    const db = await getDBConnection();

    // Crear tabla si no existe
    await createClientesTable(db);

    const localId = cliente.localId || `LOCAL_${Date.now()}`;
    const pais = environment.pais;

    console.log('📝 Datos del cliente a guardar:');
    console.log(`    LocalID: ${localId}`);
    console.log(`    Identificacion: ${cliente.Identificacion}`);
    console.log(`    Nombre Completo: ${cliente.Nombres} ${cliente.Apellidos}`);
    console.log(`    NumeroOperacion: ${cliente.NumeroOperacion}`);
    console.log(`    Pais: ${pais}`);
    console.log(`    TieneGrabacion: ${cliente.TieneGrabacion ? 1 : 0}`);

    await db.runAsync(
      `INSERT OR REPLACE INTO clientes_locales (
        localId, Identificacion, Nombres, Apellidos, NumeroOperacion, FechaCarga,
        Agencia, LineaCredito, TieneGrabacion, UsuarioAsignacion, Fuente,
        CodigoCedente, TipoIdentificacion, DatosAdicionales, IdClienteCarga,
        IdExterno, pais, sincronizado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        localId,
        cliente.Identificacion || '',
        cliente.Nombres || '',
        cliente.Apellidos || '',
        cliente.NumeroOperacion || '',
        cliente.FechaCarga || new Date().toISOString(),
        cliente.Agencia || '',
        cliente.LineaCredito || '',
        cliente.TieneGrabacion ? 1 : 0,
        cliente.UsuarioAsignacion || '',
        cliente.Fuente || 'BIGBROTHER',
        cliente.CodigoCedente || 'MANUAL',
        cliente.TipoIdentificacion || 'CED',
        cliente.DatosAdicionales || '',
        cliente.IdClienteCarga || 0,
        cliente.IdExterno || '',
        pais,
        0, // sincronizado
      ]
    );

    console.log(`✅ Cliente guardado correctamente en SQLite [${pais}]:`, localId);
    return localId;
  } catch (error) {
    console.error('❌ Error guardando cliente local en SQLite:', error);
    throw error;
  }
};

// Guardar grabación pendiente en SQLite
export const guardarGrabacionOfflineEnSQLite = async (grabacion: any) => {
  try {
    const db = await getDBConnection();
    await createGrabacionesTable(db);

    await db.runAsync(
      `INSERT INTO grabaciones_pendientes 
      (Identificacion, audioPath, FechaInicio, FechaFin, Latitud, Longitud, Agencia, LineaCredito, NumeroOperacion, user, Duracion, TiempoDuracion, sincronizado, EsLocal) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
      [
        grabacion.identificacion,
        grabacion.audioPath,
        grabacion.FechaInicio,
        grabacion.FechaFin,
        grabacion.Latitud,
        grabacion.Longitud,
        grabacion.Agencia || '',
        grabacion.LineaCredito || '',
        grabacion.NumeroOperacion || '',
        grabacion.user,
        grabacion.Duracion || 0,
        grabacion.TiempoDuracion || '00:00:00',
      ]
    );
    
    console.log(`✅ Grabación guardada en SQLite para cliente Identificacion: ${grabacion.identificacion}`);
  } catch (err) {
    console.error('❌ Error al guardar grabación en SQLite:', err);
  }
};

// Mostrar clientes locales en consola
export const mostrarClientesLocalesEnConsola = async () => {
  try {
    const db = await getDBConnection();
    const rows = await db.getAllAsync('SELECT localId, IdClienteCarga, sincronizado, Identificacion, Nombres, Apellidos FROM clientes_locales');
    
    console.log(`📋 Total de clientes: ${rows.length}`);
    rows.forEach((item: any, index) => {
      console.log(`🧾 Cliente ${index + 1}:`, item);
    });
  } catch (error) {
    console.error('❌ Error al consultar clientes_locales:', error);
  }
};

// Crear tabla de lista de clientes
export const createListaClientesTable = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS lista_clientes (
      IdClienteCarga INTEGER PRIMARY KEY NOT NULL,
      Identificacion TEXT,
      Nombres TEXT,
      Apellidos TEXT,
      NumeroOperacion TEXT,
      FechaCarga TEXT,
      Agencia TEXT,
      LineaCredito TEXT,
      TieneGrabacion INTEGER,
      UsuarioAsignacion TEXT,
      Fuente TEXT,
      CodigoCedente TEXT,
      TipoIdentificacion TEXT,
      DatosAdicionales TEXT,
      IdExterno TEXT,
      EsArchivado INTEGER DEFAULT 0,
      sincronizado INTEGER DEFAULT 0
    );
  `);
  console.log("✅ Tabla lista_clientes creada o ya existe.");
};

// Insertar lista de clientes
export const insertarListaClientes = async (clientes: any[]) => {
  const db = await getDBConnection();
  await createListaClientesTable(db);

  for (const cliente of clientes) {
    await db.runAsync(
      `INSERT OR REPLACE INTO lista_clientes 
      (IdClienteCarga, Identificacion, Nombres, Apellidos, TipoIdentificacion, NumeroOperacion, FechaCarga, Agencia, LineaCredito, CodigoCedente, TieneGrabacion, UsuarioAsignacion, Fuente, DatosAdicionales, IdExterno, EsArchivado, sincronizado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente.IdClienteCarga,
        cliente.Identificacion,
        cliente.Nombres,
        cliente.Apellidos,
        cliente.TipoIdentificacion,
        cliente.NumeroOperacion,
        cliente.FechaCarga,
        cliente.Agencia || '',
        cliente.LineaCredito || '',
        cliente.CodigoCedente,
        cliente.TieneGrabacion ? 1 : 0,
        cliente.UsuarioAsignacion,
        cliente.Fuente,
        cliente.DatosAdicionales,
        cliente.IdExterno,
        cliente.EsArchivado ? 1 : 0,
        0 // sincronizado localmente
      ]
    );
  }
  console.log("✅ Clientes insertados o actualizados.");
};

// Obtener clientes de lista locales
export const obtenerClientesListaLocales = async (): Promise<Cliente[]> => {
  const db = await getDBConnection();
  const rows = await db.getAllAsync<Cliente>("SELECT * FROM lista_clientes WHERE EsArchivado = 0");
  return rows;
};

// Archivar cliente de lista local
export const archivarClienteListaLocal = async (idClienteCarga: number) => {
  const db = await getDBConnection();
  await db.runAsync(
    "UPDATE lista_clientes SET EsArchivado = 1 WHERE IdClienteCarga = ?",
    [idClienteCarga]
  );
  console.log(`✅ Cliente con IdClienteCarga ${idClienteCarga} archivado localmente.`);
};

// Eliminar tablas SQLite
export const eliminarTablasSQLite = async () => {
  try {
    const db = await getDBConnection();
    await db.execAsync(`DROP TABLE IF EXISTS clientes_locales`);
    await db.execAsync(`DROP TABLE IF EXISTS grabaciones_pendientes`);
    console.log('🧨 Tablas eliminadas correctamente');
  } catch (err) {
    console.error('❌ Error al eliminar tablas:', err);
  }
};

// Eliminar tabla lista de clientes
export const eliminarTablaListaClientes = async () => {
  const db = await getDBConnection();
  await db.execAsync("DROP TABLE IF EXISTS lista_clientes");
  console.log("🧨 Tabla lista_clientes eliminada");
};

// Eliminar grabaciones antiguas/sincronizadas (caché)
export const eliminarGrabacionesSincronizadas = async (): Promise<number> => {
  try {
    const db = await getDBConnection();
    // Eliminar solo las grabaciones que ya fueron sincronizadas
    const result = await db.runAsync(
      'DELETE FROM grabaciones_pendientes WHERE sincronizado = 1'
    );
    console.log(`🧹 Se eliminaron ${result.changes} grabaciones sincronizadas`);
    return result.changes || 0;
  } catch (error) {
    console.error('❌ Error al eliminar grabaciones sincronizadas:', error);
    throw error;
  }
};

// Contar grabaciones pendientes
export const contarGrabacionesPendientes = async () => {
  try {
    const db = await getDBConnection();
    const result = await db.getFirstAsync<{total: number}>(
      'SELECT COUNT(*) as total FROM grabaciones_pendientes WHERE sincronizado = 0'
    );
    return result?.total || 0;
  } catch (error) {
    console.error('Error al contar grabaciones pendientes:', error);
    return 0;
  }
};

// Mostrar grabaciones locales en consola
export const mostrarGrabacionesLocalesEnConsola = async () => {
  try {
    const db = await getDBConnection();
    const rows = await db.getAllAsync(`
      SELECT id, audioPath, FechaInicio, FechaFin, Latitud, Longitud, 
             Agencia, LineaCredito, user, sincronizado 
      FROM grabaciones_pendientes
    `);
    
    console.log(`🎙️ Total de grabaciones locales: ${rows.length}`);
    rows.forEach((grabacion: any, index) => {
      console.log(`🎧 Grabación ${index + 1}:`, grabacion);
    });
  } catch (error) {
    console.error('❌ Error mostrando grabaciones locales:', error);
  }
};
