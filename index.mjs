/*
Su pequeña empresa lleva ya un tiempo en el desarrollo de productos Front-End, pero
a partir de una solicitud de un cliente deciden expandir servicios que contemplen el
Back-End, pasando a ofrecer desarrollos Full-Stack.
La solicitud que nos llega es para el desarrollo de una pequeña aplicación de servidor
de uso interno, que permita realizar un reporte periódico del estado del servidor que
utiliza la empresa. Esta aplicación debe entregar un informe el cual debe ser
almacenado en un archivo a modo de historial o LOG.

Requerimientos
Desarrollar una aplicación del lado del servidor que permita, a partir de un endpoint
(URL), crear un LOG del estado del servidor. Este LOG debe incluir:
● Fecha completa del reporte.
● Inicio de actividad del servidor (momento de encendido).
● El tiempo que el servidor estuvo activo.
● Información sobre los CPU.
● Memoria RAM total y memoria RAM utilizada .
● Las interfaces de red.
*/ 

import { networkInterfaces, totalmem, freemem, cpus } from "os";
import { createServer } from "http";
import { writeFile } from "fs/promises";

async function generarArchivoDeRegistro() {
    const inicioActividadServidor = new Date();
    const interfacesRed = networkInterfaces();
    let informacionInterfaz = "";

    for (const nombreInterfaz in interfacesRed) {
        informacionInterfaz += `Nombre: ${nombreInterfaz}\n`;

        const direcciones = interfacesRed[nombreInterfaz];
        direcciones.forEach(direccion => {
            if (!direccion.internal) {
                informacionInterfaz += `  Tipo: ${direccion.family}\n`;
                informacionInterfaz += `  Dirección IP: ${direccion.address}\n`;
            }
        });
        informacionInterfaz += "\n";
    }

    const fechaActual = new Date();
    const fechaFormateada = fechaActual.toISOString().replace(/:/g, '-').replace(/\..+/, '').replace('T', '-'); // Formato: YYYY-MM-DD-HH-mm-ss

    const totalMemoria = totalmem();
    const totalMemoriaGB = totalMemoria / (1024 * 1024 * 1024);

    const memoriaUtilizada = totalmem() - freemem();
    const memoriaUtilizadaGB = memoriaUtilizada / (1024 * 1024 * 1024)

    const cpusInfo = cpus();
    const modeloCPU = cpusInfo[0].model;

    const contenido = `Fecha del reporte: ${fechaActual.toLocaleString()} 
    \nEncendido: ${inicioActividadServidor} 
    \nCPU: ${modeloCPU} 
    \nTotal RAM: ${totalMemoriaGB.toFixed(2)}GB 
    \nRAM Utilizada: ${memoriaUtilizadaGB.toFixed(2)}GB 
    \nInterfaz de red: \n ${informacionInterfaz}`;

    const nombreArchivo = `log-${fechaFormateada}.txt`; // Nombre con la fecha en formato ISO

    try {
        await writeFile(nombreArchivo, contenido);
        console.log(`Se ha escrito en el archivo ${nombreArchivo} correctamente.`);
    } catch (error) {
        console.error(`Error al escribir en el archivo ${nombreArchivo}:`, error);
    }
}

const server = createServer(async (peticion, respuesta) => {
    if (peticion.method === 'GET') {
        if (peticion.url === '/log') {
            try {
                await generarArchivoDeRegistro();
                respuesta.end('Se ha generado el archivo de registro correctamente.');
            } catch (error) {
                console.error('Error al generar el archivo de registro:', error);
                respuesta.statusCode = 500;
                respuesta.end('Error interno del servidor.');
            }
        } else {
            respuesta.statusCode = 404;
            respuesta.end('Error: Ruta no encontrada.');
        }
    }
});

server.listen(3001, () => {
    console.log(`Servidor escuchando en el puerto ${server.address().port}`);
});
