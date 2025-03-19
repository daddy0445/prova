const appState = {
    attrezzature: []
};

async function loadAttrezzatureFromCSV() {
    try {
        const response = await fetch('./data/attrezzature.csv');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length <= 1) throw new Error('CSV file is empty or only contains headers');
        
        const data = lines.slice(1).map(line => {
            const [nome, codice] = line.split(',').map(item => item.trim());
            return { 
                nome: nome || 'N/A', 
                codice: codice || 'N/A'
            };
        });

        appState.attrezzature = data;
        localStorage.setItem('attrezzature', JSON.stringify(data));
        return data;
    } catch (error) {
        console.error('Errore nel caricamento CSV:', error);
        return JSON.parse(localStorage.getItem('attrezzature')) || [];
    }
}

function saveAttrezzatureToCSV() {
    const csvContent = ['Nome,CodiceNAV', ...appState.attrezzature.map(i => `${i.nome},${i.codice}`)].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attrezzature.csv';
    document.body.appendChild(a); // Append to body to work in Firefox
    a.click();
    document.body.removeChild(a); // Remove from body
    URL.revokeObjectURL(url);
}

// Funzioni per la gestione della tabella
function renderTable() {
    const tableBody = document.getElementById('attrezzatureTableBody');
    if (tableBody) {
        tableBody.innerHTML = appState.attrezzature
            .map(item => `
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-6 py-4">${item.nome}</td>
                    <td class="px-6 py-4">${item.codice || ''}</td>
                    <td class="px-6 py-4 text-center">
                        <button onclick="editItem('${item.nome}')" class="text-blue-600 hover:text-blue-800 mr-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteItem('${item.nome}')" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
    }
}

function editItem(nome) {
    const item = appState.attrezzature.find(i => i.nome === nome);
    if (item) {
        document.getElementById('itemName').value = item.nome;
        document.getElementById('itemCode').value = item.codice;
        document.getElementById('itemModal').classList.remove('hidden');
    }
}

function deleteItem(nome) {
    appState.attrezzature = appState.attrezzature.filter(i => i.nome !== nome);
    localStorage.setItem('attrezzature', JSON.stringify(appState.attrezzature));
    renderTable();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadAttrezzatureFromCSV();
    
    if (window.location.pathname.includes('data.html')) {
        // Gestione pagina dati
        renderTable();
        
        const exportCSVButton = document.getElementById('exportCSV');
        if (exportCSVButton) {
            exportCSVButton.addEventListener('click', saveAttrezzatureToCSV);
        }
        
        const itemForm = document.getElementById('itemForm');
        if (itemForm) {
            itemForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const nome = document.getElementById('itemName').value.trim();
                const codice = document.getElementById('itemCode').value.trim();
                
                const existingIndex = appState.attrezzature.findIndex(i => i.nome.toLowerCase() === nome.toLowerCase());
                
                if (existingIndex > -1) {
                    appState.attrezzature[existingIndex].codice = codice;
                } else {
                    appState.attrezzature.push({ nome, codice });
                }
                
                localStorage.setItem('attrezzature', JSON.stringify(appState.attrezzature));
                document.getElementById('itemModal').classList.add('hidden');
                renderTable();
            });
        }

    } else {
        // Gestione pagina richieste
        const updateDatalist = () => {
            const datalist = document.getElementById('attrezzatureDatalist');
            if (datalist) {
                datalist.innerHTML = appState.attrezzature
                    .map(item => `<option value="${item.nome}">${item.nome} (${item.codice})</option>`)
                    .join('');
            }
        };
        updateDatalist();
        
        const addRowButton = document.getElementById('addRow');
        if (addRowButton) {
            addRowButton.addEventListener('click', () => {
                const newRow = document.createElement('div');
                newRow.className = 'attrezzatura-row grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md';
                newRow.innerHTML = `
                    <div>
                        <input type="text" class="attrezzatura-input w-full px-3 py-2 border rounded-md"
                            placeholder="Inizia a digitare..." list="attrezzatureDatalist" required>
                    </div>
                    <div>
                        <input type="number" min="1" class="quantita w-full px-3 py-2 border rounded-md"
                            placeholder="Quantità" required>
                    </div>
                    <div>
                        <input type="text" class="codice-nav w-full px-3 py-2 border rounded-md" readonly>
                    </div>
                `;
                document.getElementById('attrezzatureList').appendChild(newRow);
            });
        }

        // Gestione aggiornamento codice NAV in tempo reale
        const attrezzatureList = document.getElementById('attrezzatureList');
        if (attrezzatureList) {
            attrezzatureList.addEventListener('input', (e) => {
                if (e.target.classList.contains('attrezzatura-input')) {
                    const input = e.target;
                    const row = input.closest('.attrezzatura-row');
                    const codiceNavField = row.querySelector('.codice-nav');
                    
                    const attrezzatura = input.value.trim().toLowerCase();
                    const foundItem = appState.attrezzature.find(item => 
                        item.nome.trim().toLowerCase() === attrezzatura
                    );
                    
                    codiceNavField.value = foundItem ? foundItem.codice : '';
                }
            });
        }

        const requestForm = document.getElementById('requestForm');
        if (requestForm) {
            requestForm.addEventListener('submit', function(event) {
                event.preventDefault();
            
                const commessa = document.getElementById('commessa').value;
                const dataNecessita = document.getElementById('data').value;
                const commento = document.getElementById('commento').value;
            
                const wb = XLSX.utils.book_new();
                const wsData = [
                    ['COMMESSA', 'DATA', 'COMMENTO'],
                    [commessa, dataNecessita, commento],
                    [],
                    ['ATTREZZATURA', 'QUANTITÀ', 'CODICE NAV', 'mag.Marrubiu', 'mag.Mairano', 'Altro']
                ];
            
                document.querySelectorAll('.attrezzatura-row').forEach(row => {
                    const attrezzatura = row.querySelector('.attrezzatura-input').value;
                    const quantita = row.querySelector('.quantita').value;
                    
                    // Ricerca case-insensitive con trim
                    const codiceNav = appState.attrezzature.find(item => 
                        item.nome.trim().toLowerCase() === attrezzatura.trim().toLowerCase()
                    )?.codice || '';
                    
                    if (attrezzatura && quantita) {
                        wsData.push([attrezzatura, quantita, codiceNav, '', '', '']);
                    }
                });
            
                const ws = XLSX.utils.aoa_to_sheet(wsData);
                ws['!cols'] = [
                    {wch: 40},
                    {wch: 12},
                    {wch: 15},
                    {wch: 15},
                    {wch: 15},
                    {wch: 15}
                ];
            
                XLSX.utils.book_append_sheet(wb, ws, 'Richiesta');
                XLSX.writeFile(wb, `Richiesta_${commessa}_${dataNecessita}.xlsx`);
            });
        }
    }
});

// Gestione modale
const closeModalButton = document.getElementById('closeModal');
if (closeModalButton) {
    closeModalButton.addEventListener('click', () => {
        document.getElementById('itemModal').classList.add('hidden');
    });
}
