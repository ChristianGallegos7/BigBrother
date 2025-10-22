// database.ts - Actualizado para expo-sqlite moderna
import * as SQLite from 'expo-sqlite';
import { environment } from '../../components/core/environment';
import { Cliente } from '../../models/clinte.interface';

// Abrir o crear la base de datos
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';

const DB_FILENAME = 'clientes.db';
const DB_PATH = (FileSystem as any).documentDirectory
  ? `${(FileSystem as any).documentDirectory}${DB_FILENAME}`
  : `${(FileSystem as any).cacheDirectory || ''}${DB_FILENAME}`;

const BACKUP_KEYS = {
  clientes: 'sqlite_backup_clientes',
  grabaciones: 'sqlite_backup_grabaciones',
};

let cachedDb: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const withRetries = async <T>(fn: () => Promise<T>, attempts = 2): Promise<T> => {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) { lastErr = e; await new Promise(r => setTimeout(r, 150 * (i + 1))); }
  }
  throw lastErr;
};

export const getDBConnection = async () => {
  if (cachedDb) return cachedDb;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = await withRetries(() => SQLite.openDatabaseAsync(DB_FILENAME), 2);
      await createClientesTable(db);
      await createGrabacionesTable(db);
      cachedDb = db;
      return db;
    } catch (err) {
      console.error('❌ Error abriendo la base de datos:', err);
      // Intentar eliminar la base dañada y recrear
      try {
        if ((FileSystem as any).deleteAsync && DB_PATH) {
          await (FileSystem as any).deleteAsync(DB_PATH, { idempotent: true });
        }
        console.warn('🧹 Base de datos dañada eliminada. Intentando recrear...');
        const db = await SQLite.openDatabaseAsync(DB_FILENAME);
        await createClientesTable(db);
        await createGrabacionesTable(db);
        cachedDb = db;
        return db;
      } catch (fatalErr) {
        console.error('❌ Error fatal al recrear la base de datos:', fatalErr);
        throw fatalErr;
      }
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
};

// Fallback backups when SQLite is unavailable
const pushBackup = async (key: string, payload: any) => {
  try {
    const current = (await SecureStore.getItemAsync(key)) || '[]';
    const arr = JSON.parse(current);
    arr.push({ payload, ts: Date.now() });
    // Keep last 300 entries max
    const trimmed = arr.slice(-300);
    await SecureStore.setItemAsync(key, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('No se pudo respaldar en SecureStore:', e);
  }
};

export const tryFlushSQLiteBacklog = async (): Promise<{ clientes: number; grabaciones: number } | null> => {
  try {
    const db = await getDBConnection();
    // clientes
    const clientesStr = (await SecureStore.getItemAsync(BACKUP_KEYS.clientes)) || '[]';
    const clientes = JSON.parse(clientesStr) as Array<{ payload: any; ts: number }>;
    let clientesOk = 0;
    for (const item of clientes) {
      try {
        // Inserción directa (similar a guardarClienteLocalEnSQLite pero evitando recursión)
        const c = item.payload;
        await createClientesTable(db);
        const localId = c.localId || `LOCAL_${Date.now()}`;
        await db.runAsync(
          `INSERT OR REPLACE INTO clientes_locales (
            localId, Identificacion, Nombres, Apellidos, NumeroOperacion, FechaCarga,
            Agencia, LineaCredito, TieneGrabacion, UsuarioAsignacion, Fuente,
            CodigoCedente, TipoIdentificacion, DatosAdicionales, IdClienteCarga,
            IdExterno, pais, sincronizado
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            localId,
            c.Identificacion || '',
            c.Nombres || '',
            c.Apellidos || '',
            c.NumeroOperacion || '',
            c.FechaCarga || new Date().toISOString(),
            c.Agencia || '',
            c.LineaCredito || '',
            c.TieneGrabacion ? 1 : 0,
            c.UsuarioAsignacion || '',
            c.Fuente || 'BIGBROTHER',
            c.CodigoCedente || 'MANUAL',
            c.TipoIdentificacion || 'CED',
            c.DatosAdicionales || '',
            c.IdClienteCarga || 0,
            c.IdExterno || '',
            environment.pais,
            0,
          ]
        );
        clientesOk++;
      } catch (e) {
        console.warn('No se pudo reinsertar cliente desde backup:', e);
      }
    }
    if (clientesOk === clientes.length) {
      await SecureStore.deleteItemAsync(BACKUP_KEYS.clientes);
    } else {
      await SecureStore.setItemAsync(BACKUP_KEYS.clientes, JSON.stringify([]));
    }

    // grabaciones
    const grabStr = (await SecureStore.getItemAsync(BACKUP_KEYS.grabaciones)) || '[]';
    const grabs = JSON.parse(grabStr) as Array<{ payload: any; ts: number }>;
    let grabsOk = 0;
    for (const item of grabs) {
      try {
        const g = item.payload;
        await createGrabacionesTable(db);
        await db.runAsync(
          `INSERT INTO grabaciones_pendientes 
          (Identificacion, audioPath, FechaInicio, FechaFin, Latitud, Longitud, Agencia, LineaCredito, NumeroOperacion, user, Duracion, TiempoDuracion, sincronizado, EsLocal) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
          [
            g.identificacion,
            g.audioPath,
            g.FechaInicio,
            g.FechaFin,
            g.Latitud,
            g.Longitud,
            g.Agencia || '',
            g.LineaCredito || '',
            g.NumeroOperacion || '',
            g.user,
            g.Duracion || 0,
            g.TiempoDuracion || '00:00:00',
          ]
        );
        grabsOk++;
      } catch (e) {
        console.warn('No se pudo reinsertar grabación desde backup:', e);
      }
    }
    if (grabsOk === grabs.length) {
      await SecureStore.deleteItemAsync(BACKUP_KEYS.grabaciones);
    } else {
      await SecureStore.setItemAsync(BACKUP_KEYS.grabaciones, JSON.stringify([]));
    }

    return { clientes: clientesOk, grabaciones: grabsOk };
  } catch (e) {
    console.warn('SQLite no disponible para flush. Se mantiene backup.', e);
    return null;
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
    // Backup a SecureStore para no perder datos
    await pushBackup(BACKUP_KEYS.clientes, cliente);
    return cliente.localId || `LOCAL_${Date.now()}`;
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
    await pushBackup(BACKUP_KEYS.grabaciones, grabacion);
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
  try {
    const db = await getDBConnection();
    const rows = await db.getAllAsync<Cliente>("SELECT * FROM lista_clientes WHERE EsArchivado = 0");
    return rows;
  } catch (e) {
    console.warn('SQLite no disponible. Devolviendo lista vacía.', e);
    return [] as Cliente[];
  }
};

// Archivar cliente de lista local
export const archivarClienteListaLocal = async (idClienteCarga: number) => {
  try {
    const db = await getDBConnection();
    await db.runAsync(
      "UPDATE lista_clientes SET EsArchivado = 1 WHERE IdClienteCarga = ?",
      [idClienteCarga]
    );
    console.log(`✅ Cliente con IdClienteCarga ${idClienteCarga} archivado localmente.`);
  } catch (e) {
    console.warn('No se pudo archivar en SQLite (offline o no disponible).');
  }
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
