
import CryptoJS from 'crypto-js';


export class Encriptador {
    
    private keyRAW = new Uint8Array([245, 87, 124, 4, 123, 198, 122, 12, 71, 15, 134, 220, 59, 62, 131, 187, 76, 243, 65, 156, 191, 171, 114, 189]);
    private ivRAW = new Uint8Array([62, 81, 92, 156, 178, 142, 221, 199]);

    decrypt(input: any, isCompression: any) {
        try {
            // Convierte la clave y el IV a objetos WordArray
            const keyWordArray = CryptoJS.lib.WordArray.create(Array.from(this.keyRAW));
            const ivWordArray = CryptoJS.lib.WordArray.create(Array.from(this.ivRAW));

            // Decodifica la entrada desde base64 a WordArray
            const ciphertextWordArray = CryptoJS.enc.Base64.parse(input);

            // Crea el objeto CipherParams
            const params = CryptoJS.lib.CipherParams.create({
                ciphertext: ciphertextWordArray,
                key: keyWordArray,
                iv: ivWordArray,
            });

            // Descifrado 3DES-ECB
            const decrypted = CryptoJS.TripleDES.decrypt(params, keyWordArray, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7,
            });

            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

            if (isCompression) {
                return decryptedText;
            } else {
                return this.decodeUTF8(decryptedText);
            }
        } catch (e) {
            console.error(e);
            return null; // Manejo de errores apropiado aquí
        }
    }

    str2ab(str: any) {
        const buf = new ArrayBuffer(str.length * 2);
        const bufView = new Uint16Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buf;
    }

    str2ab_2(str: any) {
        const buf = new ArrayBuffer(str.length * Uint8Array.BYTES_PER_ELEMENT);
        const bufView = new Uint8Array(buf);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return bufView;
    }

    encodeUTF8(s: any) {
        let i = 0;
        const bytes = new Uint8Array(s.length * 4);
        for (let ci = 0; ci !== s.length; ci++) {
            let c = s.charCodeAt(ci);
            if (c < 128) {
                bytes[i++] = c;
                continue;
            }
            if (c < 2048) {
                // tslint:disable-next-line: no-bitwise
                bytes[i++] = c >> 6 | 192;
            } else {
                if (c > 0xd7ff && c < 0xdc00) {
                    if (++ci === s.length) {
                        throw new Error('UTF-8 encode: incomplete surrogate pair');
                    }
                    const c2 = s.charCodeAt(ci);
                    if (c2 < 0xdc00 || c2 > 0xdfff) {
                        // tslint:disable-next-line: max-line-length
                        throw new Error('UTF-8 encode: second char code 0x' + c2.toString(16) + ' at index ' + ci + ' in surrogate pair out of range');
                    }
                    // tslint:disable-next-line: no-bitwise
                    c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
                    // tslint:disable-next-line: no-bitwise
                    bytes[i++] = c >> 18 | 240;
                    // tslint:disable-next-line: no-bitwise
                    bytes[i++] = c >> 12 & 63 | 128;
                } else { // c <= 0xffff
                    // tslint:disable-next-line: no-bitwise
                    bytes[i++] = c >> 12 | 224;
                }
                // tslint:disable-next-line: no-bitwise
                bytes[i++] = c >> 6 & 63 | 128;
            }
            // tslint:disable-next-line: no-bitwise
            bytes[i++] = c & 63 | 128;
        }
        return bytes.subarray(0, i);
    }

    decodeUTF8(bytes: any) {
        let s = '';
        let i = 0;
        while (i < bytes.length) {
            let c = bytes[i++];
            if (c > 127) {
                if (c > 191 && c < 224) {
                    if (i >= bytes.length) {
                        throw new Error('UTF-8 decode: incomplete 2-byte sequence');
                    }
                    // tslint:disable-next-line: no-bitwise
                    c = (c & 31) << 6 | bytes[i] & 63;
                } else if (c > 223 && c < 240) {
                    if (i + 1 >= bytes.length) {
                        throw new Error('UTF-8 decode: incomplete 3-byte sequence');
                    }
                    // tslint:disable-next-line: no-bitwise
                    c = (c & 15) << 12 | (bytes[i] & 63) << 6 | bytes[++i] & 63;
                } else if (c > 239 && c < 248) {
                    if (i + 2 >= bytes.length) {
                        throw new Error('UTF-8 decode: incomplete 4-byte sequence');
                    }
                    // tslint:disable-next-line: no-bitwise
                    c = (c & 7) << 18 | (bytes[i] & 63) << 12 | (bytes[++i] & 63) << 6 | bytes[++i] & 63;
                } else {
                    throw new Error('UTF-8 decode: unknown multibyte start 0x' + c.toString(16) + ' at index ' + (i - 1));
                }
                ++i;
            }
            if (c <= 0xffff) {
                s += String.fromCharCode(c);
            } else if (c <= 0x10ffff) {
                c -= 0x10000;
                // tslint:disable-next-line: no-bitwise
                s += String.fromCharCode(c >> 10 | 0xd800);
                // tslint:disable-next-line: no-bitwise
                s += String.fromCharCode(c & 0x3FF | 0xdc00);
            } else {
                throw new Error('UTF-8 decode: code point 0x' + c.toString(16) + ' exceeds UTF-16 reach');
            }
        }
        return s;
    }

}

