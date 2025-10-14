// database.ts
import SQLite from 'react-native-sqlite-storage';
import { environment } from '../../components/core/environment';
import { Cliente } from '../../interfaces/Cliente';

SQLite.enablePromise(true);

export const getDBConnection = async () => {
  return await SQLite.openDatabase({ name: 'clientes.db', location: 'default' });
};

export const createClientesTable = async (db: SQLite.SQLiteDatabase) => {
  const query = `
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
    );`;
  await db.executeSql(query);
};

export const createGrabacionesTable = async (db: SQLite.SQLiteDatabase) => {
  const query = `
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
      user TEXT,
      sincronizado INTEGER DEFAULT 0
    );`;
  await db.executeSql(query);
};


export const mostrarClientesLocalesEnConsola = async () => {
  try {
    const db = await SQLite.openDatabase({ name: 'clientes.db', location: 'default' });

    db.transaction(tx => {
      tx.executeSql(
        'SELECT localId, IdClienteCarga, sincronizado, Identificacion, Nombres, Apellidos FROM clientes_locales',
        [],
        (_, results) => {
          const rows = results.rows;
          console.log(`📋 Total de clientes: ${rows.length}`);

          for (let i = 0; i < rows.length; i++) {
            const item = rows.item(i);
            console.log(`🧾 Cliente ${i + 1}:`, item);
          }
        },
        (_, error) => {
          console.error('❌ Error al consultar clientes_locales:', error);
          return true;
        }
      );
    });
  } catch (error) {
    console.error('❌ Error mostrando clientes locales:', error);
  }
};

export const guardarGrabacionEnSQLite = async (grabacion: any) => {
  try {
    const db = await getDBConnection();
    await db.executeSql(
      `INSERT INTO grabaciones_pendientes (
        Identificacion, user, audioPath, FechaInicio, FechaFin, Latitud, Longitud, Agencia, LineaCredito, NumeroOperacion, sincronizado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?, 0)`,
      [
        grabacion.Identificacion,
        grabacion.user,
        grabacion.audioPath,
        grabacion.FechaInicioGrabacion,
        grabacion.FechaFinGrabacion,
        grabacion.Latitud,
        grabacion.Longitud,
        grabacion.Agencia,
        grabacion.LineaCredito
      ]
    );
    console.log('✅ Grabación guardada en SQLite para cliente local:', grabacion.localClientId);
  } catch (error) {
    console.error('❌ Error guardando grabación en SQLite:', error);
  }
};

export const guardarClienteLocalEnSQLite = async (cliente: any) => {
  try {
    const db = await getDBConnection();

    // Crea tabla si no existe
    await db.executeSql(`
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

    const localId = cliente.localId || `LOCAL_${Date.now()}`;
    const pais = environment.pais;
    // const pais = cliente.pais || 'GT';

    console.log('📝 Datos del cliente a guardar:');
    console.log(`    LocalID: ${localId}`);
    console.log(`    Identificacion: ${cliente.Identificacion}`);
    console.log(`    Nombre Completo: ${cliente.Nombres} ${cliente.Apellidos}`);
    console.log(`    NumeroOperacion: ${cliente.NumeroOperacion}`);
    console.log(`    Pais: ${pais}`);
    console.log(`    TieneGrabacion: ${cliente.TieneGrabacion ? 1 : 0}`);

    await db.executeSql(
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


export const guardarGrabacionOfflineEnSQLite = async (grabacion: any) => {
  try {
    const db = await getDBConnection();

    // 👇 Asegura que la tabla esté actualizada antes de insertar
    await actualizarTablaGrabaciones();

    await db.executeSql(
      `INSERT INTO grabaciones_pendientes 
      (Identificacion, audioPath, FechaInicio, FechaFin, Latitud, Longitud, Agencia, LineaCredito, NumeroOperacion, user, Duracion, TiempoDuracion, sincronizado, EsLocal) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1);`,
      [
        grabacion.identificacion,
        grabacion.audioPath,
        grabacion.FechaInicio,
        grabacion.FechaFin,
        grabacion.Latitud,
        grabacion.Longitud,
        grabacion.Agencia,
        grabacion.LineaCredito,
        grabacion.NumeroOperacion ?? '',
        grabacion.user,
        grabacion.Duracion ?? 0,
        grabacion.TiempoDuracion ?? '00:00:00',
      ]
    );
    console.log(`✅ Grabación guardada en SQLite para cliente Identificacion: ${grabacion.identificacion}`);
  } catch (err) {
    console.error('❌ Error al guardar grabación en SQLite:', err);
  }
};




export const mostrarGrabacionesLocalesEnConsola = async () => {
  try {
    const db = await SQLite.openDatabase({ name: 'clientes.db', location: 'default' });

    db.transaction(tx => {
      tx.executeSql(
        `SELECT id, localClientId, audioPath, FechaInicio, FechaFin, Latitud, Longitud, 
                Agencia, LineaCredito, user, sincronizado 
         FROM grabaciones_pendientes`,
        [],
        (_, results) => {
          const rows = results.rows;
          console.log(`🎙️ Total de grabaciones locales: ${rows.length}`);

          for (let i = 0; i < rows.length; i++) {
            const grabacion = rows.item(i);
            console.log(`🎧 Grabación ${i + 1}:`, grabacion);
          }
        },
        (_, error) => {
          console.error('❌ Error al consultar grabaciones_pendientes:', error);
          return true;
        }
      );
    });
  } catch (error) {
    console.error('❌ Error mostrando grabaciones locales:', error);
  }
};

export const eliminarGrabacionesInvalidas = async () => {
  const db = await SQLite.openDatabase({ name: 'clientes.db', location: 'default' });
  await db.executeSql('DELETE FROM grabaciones_pendientes WHERE audioPath IS NULL');
  console.log('🧹 Grabaciones con audioPath nulo eliminadas.');
};

export const mostrarGrabacionesConCliente = async () => {
  const db = await SQLite.openDatabase({ name: 'clientes.db', location: 'default' });

  db.transaction(tx => {
    tx.executeSql(
      `SELECT g.*, c.IdClienteCarga, c.sincronizado, c.Identificacion, c.Nombres
       FROM grabaciones_pendientes g
       LEFT JOIN clientes_locales c ON g.localClientId = c.localId`,
      [],
      (_, results) => {
        const rows = results.rows;
        console.log(`🎙️ Total de grabaciones locales: ${rows.length}`);

        for (let i = 0; i < rows.length; i++) {
          const item = rows.item(i);
          console.log(`🎧 Grabación ${i + 1}:`, item);
        }
      },
      (_, error) => {
        console.error('❌ Error consultando grabaciones con cliente:', error);
        return true;
      }
    );
  });
};


export const eliminarTablasSQLite = async () => {
  try {
    const db = await getDBConnection();
    await db.executeSql(`DROP TABLE IF EXISTS clientes_locales`);
    await db.executeSql(`DROP TABLE IF EXISTS grabaciones_pendientes`);
    console.log('🧨 Tablas eliminadas correctamente');
  } catch (err) {
    console.error('❌ Error al eliminar tablas:', err);
  }
};

export const actualizarTablaGrabaciones = async () => {
  const db = await getDBConnection();

  // Verifica si la columna ya existe antes de agregarla (opcional pero seguro)
  const [result] = await db.executeSql(`PRAGMA table_info(grabaciones_pendientes)`);
  const columnas = result.rows.raw().map(r => r.name);

  if (!columnas.includes('NumeroOperacion')) {
    await db.executeSql(`ALTER TABLE grabaciones_pendientes ADD COLUMN NumeroOperacion TEXT`);
    console.log('✅ Columna NumeroOperacion agregada');
  }
  if (!columnas.includes('Duracion')) {
    await db.executeSql(`ALTER TABLE grabaciones_pendientes ADD COLUMN Duracion REAL`);
    console.log('✅ Columna Duracion agregada');
  }
  if (!columnas.includes('TiempoDuracion')) {
    await db.executeSql(`ALTER TABLE grabaciones_pendientes ADD COLUMN TiempoDuracion TEXT`);
    console.log('✅ Columna TiempoDuracion agregada');
  }

  if (!columnas.includes('EsLocal')) {
    await db.executeSql(`ALTER TABLE grabaciones_pendientes ADD COLUMN EsLocal INTEGER DEFAULT 0`);
    console.log('✅ Columna EsLocal agregada');
  }
};

export const createListaClientesTable = async (db: SQLite.SQLiteDatabase) => {
  const query = `
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
  `;
  await db.executeSql(query);
  console.log("✅ Tabla lista_clientes creada o ya existe.");
};


export const insertarListaClientes = async (clientes: any) => {
  const db = await getDBConnection();
  await db.transaction(tx => {
    clientes.forEach(cliente => {
      tx.executeSql(
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
          cliente.Agencia,
          cliente.LineaCredito,
          cliente.CodigoCedente,
          cliente.TieneGrabacion,
          cliente.UsuarioAsignacion,
          cliente.Fuente,
          cliente.DatosAdicionales,
          cliente.IdExterno,
          cliente.EsArchivado,
          0 // sincronizado localmente
        ]
      );
    });
  });
  console.log("✅ Clientes insertados o actualizados.");
};



export const obtenerClientesListaLocales = async (): Promise<Cliente[]> => {
  const db = await getDBConnection();
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        "SELECT * FROM lista_clientes WHERE EsArchivado = 0",
        [],
        (_, { rows }) => {
          const clientes: Cliente[] = [];
          for (let i = 0; i < rows.length; i++) {
            clientes.push(rows.item(i));
          }
          resolve(clientes);
        },
        (_, error) => {
          reject(error);
          return false;
        }
      );
    });
  });
};


export const archivarClienteListaLocal = async (idClienteCarga: number) => {
  const db = await getDBConnection();
  await db.transaction(tx => {
    tx.executeSql(
      "UPDATE lista_clientes SET EsArchivado = 1 WHERE IdClienteCarga = ?",
      [idClienteCarga]
    );
  });
  console.log(`✅ Cliente con IdClienteCarga ${idClienteCarga} archivado localmente.`);
};


export const actualizarTablaListaClientes = async () => {
  const db = await getDBConnection();

  // Verifica si la columna ya existe antes de agregarla (opcional pero seguro)
  const [result] = await db.executeSql(`PRAGMA table_info(lista_clientes)`);
  const columnas = result.rows.raw().map(r => r.name);

  if (!columnas.includes('NumeroOperacion')) {
    await db.executeSql(`ALTER TABLE lista_clientes ADD COLUMN IdClienteCarga INTEGER PRIMARY KEY NOT NULL`);
    console.log('✅ Columna NumeroOperacion agregada');
  }
  
};

export const eliminarTablaListaClientes = async () => {
  const db = await getDBConnection();
  await db.executeSql("DROP TABLE IF EXISTS lista_clientes");
  console.log("🧨 Tabla lista_clientes eliminada");
};


export const contarGrabacionesPendientes = async () => {
  try {
    const db = await getDBConnection();
    const [results] = await db.executeSql(
      'SELECT COUNT(*) as total FROM grabaciones_pendientes WHERE sincronizado = 0'
    );
    const total = results.rows.item(0).total;
    return total;
  } catch (error) {
    console.error('Error al contar grabaciones pendientes:', error);
    return 0;
  }
};
