let debounceTimer;
let fuse = null;
let allData = { pdv: [], producto: [] };
let fullData = [];


const PDV_URL = 'https://botai.smartdataautomation.com/api_backend_ai/dinamic-db/report/119/MideaPDVs';
const PRODUCTO_URL = 'https://botai.smartdataautomation.com/api_backend_ai/dinamic-db/report/119/MideaPortafolioProducts';
const AUTH_HEADERS = {
    'Authorization': 'Token 4e15396f99ae10dd5c195d81fb6a3722c0a44a10',
    'Content-Type': 'application/json'
};

async function loadData() {
    if (!allData.pdv.length) {
        const pdvResponse = await fetch(PDV_URL, { headers: AUTH_HEADERS });
        allData.pdv = (await pdvResponse.json()).result || [];
    }

    if (!allData.producto.length) {
        const productoResponse = await fetch(PRODUCTO_URL, { headers: AUTH_HEADERS });
        allData.producto = (await productoResponse.json()).result || [];
    }
}

function updatePlaceholder() {
    const searchType = document.getElementById('searchType').value;
    const searchInput = document.getElementById('searchInput');

    searchInput.placeholder = searchType === 'pdv' 
        ? 'Ingresa palabra clave del PDV' 
        : 'Ingresa palabra clave del producto';

    searchInput.value = '';
    document.getElementById('results').innerHTML = '';

    fullData = allData[searchType];
    initializeFuse(searchType);
}

function initializeFuse(type) {
    const options = {
        keys: type === 'pdv'
            ? ['SAP', 'REGION', 'CIUDAD', 'CADENA', 'PDV']
            : ['SAP', 'SUBCATEGORIA', 'REFERENCIA', 'NOM_PRODUCTOS'],
        threshold: 0.3,
    };
    fuse = new Fuse(fullData, options);
}

function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        const searchInput = document.getElementById('searchInput').value.toLowerCase();
        if (searchInput.trim()) {
            performSearch(searchInput);
        } else {
            document.getElementById('results').innerHTML = '';
        }
    }, 300);
}

function performSearch(query) {
    const results = fuse.search(query).map(result => result.item);
    renderResults(results);
}

function renderResults(results) {
    const type = document.getElementById('searchType').value;
    let output = `<h2>Resultados (${results.length} encontrados):</h2>`;

    if (results.length > 0) {
        results.forEach(result => {
            const nombre = result.PDV || result.NOM_PRODUCTOS;
            const claseTipo = result.PDV ? 'pdv' : 'producto';

            output += `
                <div class="result-item ${claseTipo}" role="region" aria-label="${nombre}">
                    <h3>
                        <i class="material-icons icon-tipo">${result.PDV ? 'store' : 'inventory_2'}</i>
                        ${nombre}
                    </h3>
                    <div class="tags">
                        ${result.CIUDAD ? `<span class="tag ciudad">${result.CIUDAD}</span>` : ''}
                        ${result.CADENA ? `<span class="tag cadena">${result.CADENA}</span>` : ''}
                        ${result.REGION ? `<span class="tag region">${result.REGION}</span>` : ''}
                        ${result.SUBCATEGORIA ? `<span class="tag subcategoria">${result.SUBCATEGORIA}</span>` : ''}
                    </div>
                    <ul>
                        <li><strong>SAP:</strong> ${result.SAP}
                            <i class="material-icons copy-icon" role="button" tabindex="0" aria-label="Copiar SAP" onclick="copyToClipboard('${result.SAP}')">content_copy</i>
                        </li>
                        ${result.CANAL ? `<li><strong>Canal:</strong> ${result.CANAL}</li>` : ''}
                        ${result.REFERENCIA ? `<li><strong>Referencia:</strong> ${result.REFERENCIA}</li>` : ''}
                    </ul>
                </div>
            `;
        });
    } else {
        output += '<p>No se encontraron resultados.</p>';
    }

    document.getElementById('results').innerHTML = output;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            alert('SAP copiado al portapapeles');
        })
        .catch(err => {
            alert('Error al copiar el SAP');
            console.error('Error:', err);
        });
}

function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('darkModeLabel').textContent = isDark ? '☀️ Modo claro' : '🌙 Modo oscuro';
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
}

window.onload = () => {
    const darkModeSetting = localStorage.getItem('darkMode');
    const isDark = darkModeSetting === 'enabled';
    document.body.classList.toggle('dark-mode', isDark);
    document.getElementById('darkModeToggle').checked = isDark;
    document.getElementById('darkModeLabel').textContent = isDark ? '☀️ Modo claro' : '🌙 Modo oscuro';
    document.getElementById('searchInput').focus();
};

loadData().then(() => updatePlaceholder());
