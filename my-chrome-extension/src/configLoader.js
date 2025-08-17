// configLoader.js
// Simula la carga de configuraciones desde la web/backend

export async function cargarConfiguracionSimulada() {
    // Simula un fetch a un backend remoto
    // En el futuro, reemplaza esto por un fetch real
    return new Promise(resolve => {
        setTimeout(() => {
            const categorias = [
                'Sitios de apuestas',
                'Contenido para adultos',
                'Redes sociales no permitidas',
                'Violencia explícita',
                'Desafíos peligrosos',
                'Fake news y desinformación'
            ];
            localStorage.setItem('categoriasFiltradas', JSON.stringify(categorias));
            resolve(categorias);
        }, 1000);
    });
}

// Ejemplo de uso (puedes llamarlo desde popup.js o background.js):
// cargarConfiguracionSimulada().then(categorias => console.log('Configuración cargada:', categorias));
