export const environment = {
    //production: false,
    production: true,
    // https://appsqa.inventar-tech.com/BigBrother/Api/Ecuador
    //urlApi: 'http://10.10.14.74:75/Api',
    //urlApi: 'https://appsqa.inventar-tech.com/BigBrother/Api/Ecuador',
    // urlApi: {
    //     EC: "https://apibg.inventar-tech.com/BigBrother/Api/Ecuador",
    //     // EC: 'https://appsqa.inventar-tech.com/BigBrother/Api/Ecuador',
    //     PE: "https://apibg.inventar-tech.com/BigBrother/Api/Peru",
    //     GT: "https://claroapibg.inventar-tech.com/BigBrother/Api/Guatemala"
    // },
    urlApi: {
        // EC: "http://10.10.44.49:75/Api/Ecuador",
        EC: "http://10.10.44.49:75/Api/Ecuador",
        PE: "http://10.10.44.49:75/Api/Peru",
        GT: "http://10.10.44.49:75/Api/Guatemala"
    },
    /*       urlSignal: {
            'EC': 'http://10.10.92.120:75/Signal/Ecuador',
            'PE': 'http://10.10.92.120:75/Signal/Peru',
            'GT': 'http://10.10.92.120:75/Signal/Guatemala',
        },  */
    /*     urlSignal: 'https://appsqa.inventar-tech.com/BigBrother/SignalR', */
    urlSignal: 'https://apps.inventar-tech.com/BigBrother/SignalR',
    /* urlApi: 'https://apibg.inventar-tech.com/BigBrother/Api', */
    datosSesion: {},
    sistema: 'BigBrother',
    // pais: 'GT',
    pais: 'EC',
    ambiente: 'DES',
    // ambiente: 'QA',
    // ambiente: 'PROD',
    encryptSecretKey: 'BigBrother',
    apiGateway: {
        url: 'https://apicore.inventar-tech.com/MiCore/ApiGateway',
        /* url: 'http://10.10.14.74:70/ApiGateway', */
        /* user: 'LAHtZlOAiX6gsC+r/fhoYg==',
        key: 'GkVbAyLkZcagsC+r/fhoYg==', */
        user: 'USRADMIN',
        key: 'GkVbAyLkZcagsC+r/fhoYg==',
        token: '',
        pref: 'srv',
        conexion: {
            conectando: false,
            conectado: false,
            errorConexion: false,
            mensajeError: ''
        }
    },
    loading: {
        mostrar: false,
        texto: ''
    },
    perdidaConexion: {
        mostrar: false,
        activar: false
    },
    mensajes: {
        mostrar: false,
        titulo: '',
        mensaje: '',
        tipo: '',
        botones: []
    },
    notificaciones: {
        mostrar: false,
        tipo: '',
        texto: '',
        duracion: 3000
    },
    transaccionActual: null,
    azureConfig: {
        path: 'https://contact2botsa.blob.core.windows.net',
        container: {
            ec: 'c2b-img-des',
            pe: 'c2b-img-des',
            gt: 'c2b-img-des'
        }
    },
    cambioClave: {
        mostrar: false,
        userName: ''
    },
    olvidoClave: {
        mostrar: false
    },
    cambioPerfil: {
        mostrar: false
    },
    idConnectionSignal: '',
    version: '2.0.2'
}