// Configurações da API do Google
const API_KEY = 'AIzaSyB5sE1VR5GAJtbOlQdZfNXvCRvwFamBbHI';
const CLIENT_ID = '1021928456661-prts92qouqnfsjaiml1jb0csi0g9jbnb.apps.googleusercontent.com';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive";

// IDs do Google Sheets
const CLIENTS_SHEET_ID = '1C9F1BZVjPcW2diPDd0JsgGiHQ_33JYBbskTsKAXGkxU';
const SERVICES_SHEET_ID = '1hziWBSwPGCuU7mKzgU7-bwwNQ36kavYuP5mBjF0N4oU';

// Variáveis globais
let clients = [];
let services = [];
let tokenClient;
let gisLoaded = false;
let gisInited = false;

// Inicialização do aplicativo
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    setupEventListeners();
    loadGoogleAuthAPI();
}

// Configuração de manipuladores de eventos
function setupEventListeners() {
    // Botões de navegação
    document.getElementById('dashboard-btn').addEventListener('click', () => showContent('dashboard'));
    document.getElementById('clients-btn').addEventListener('click', () => showContent('clients'));
    document.getElementById('services-btn').addEventListener('click', () => showContent('services'));
    document.getElementById('reports-btn').addEventListener('click', () => showContent('reports'));
    document.getElementById('settings-btn').addEventListener('click', () => showContent('settings'));
    
    // Botões de ação
    document.getElementById('add-client-btn').addEventListener('click', showAddClientForm);
    document.getElementById('add-service-btn').addEventListener('click', showAddServiceForm);
    document.getElementById('logout-btn').addEventListener('click', handleSignOut);
    
    // Filtros e pesquisa
    document.getElementById('client-search').addEventListener('input', filterClients);
    document.getElementById('service-search').addEventListener('input', filterServices);
    document.getElementById('status-filter').addEventListener('change', filterServices);
    document.getElementById('brand-filter').addEventListener('change', filterServices);
    document.getElementById('order-by').addEventListener('change', filterServices);
}

// Carrega a API de autenticação do Google
function loadGoogleAuthAPI() {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
        gisLoaded = true;
        maybeEnableButtons();
    };
    document.head.appendChild(script);
    
    initializeGapiClient();
}

// Inicializa o cliente GAPI
async function initializeGapiClient() {
    await new Promise((resolve, reject) => {
        gapi.load('client', { callback: resolve, onerror: reject });
    });
    
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
    });
    
    gisInited = true;
    maybeEnableButtons();
}

// Habilita os botões de autenticação quando as APIs estiverem carregadas
function maybeEnableButtons() {
    if (gisLoaded && gisInited) {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // Será definido depois
        });
        
        setupGoogleSignIn();
    }
}

// Configura o botão de login do Google
function setupGoogleSignIn() {
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
    });
    
    google.accounts.id.renderButton(document.getElementById('g-signin'), {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 250
    });
    
    google.accounts.id.prompt();
}

// Manipulador de resposta de credencial
function handleCredentialResponse(response) {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw resp;
        }
        
        await loadData();
        showApp();
    };
    
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

// Função de logout
function handleSignOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.id.disableAutoSelect();
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        hideApp();
    }
}

// Mostra a interface principal após o login
function showApp() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    const userInfo = document.getElementById('user-info');
    userInfo.classList.remove('hidden');
    
    // Obter informações do usuário
    fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
            'Authorization': `Bearer ${gapi.client.getToken().access_token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('user-name').textContent = data.name;
    });
    
    updateDashboard();
}

// Esconde a interface principal e mostra a tela de login
function hideApp() {
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('user-info').classList.add('hidden');
}

// Carrega os dados do Google Sheets
async function loadData() {
    await Promise.all([
        loadClients(),
        loadServices()
    ]);
}

// Carrega os clientes do Google Sheets
async function loadClients() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: CLIENTS_SHEET_ID,
            range: 'Clientes!A2:E',
        });
        
        clients = response.result.values || [];
        clients = clients.map((row, index) => ({
            id: index + 1,
            name: row[0] || '',
            email: row[1] || '',
            phone: row[2] || '',
            services: parseInt(row[3] || 0)
        }));
        
        renderClientsTable();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Carrega os serviços do Google Sheets
async function loadServices() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SERVICES_SHEET_ID,
            range: 'Serviços!A2:K',
        });
        
        services = response.result.values || [];
        services = services.map((row, index) => ({
            id: index + 1,
            clientName: row[0] || '',
            serviceType: row[1] || '',
            imei: row[2] || '',
            brand: row[3] || '',
            model: row[4] || '',
            value: parseFloat(row[5]) || 0,
            paymentMethod: row[6] || '',
            date: row[7] || '',
            status: row[8] || 'Pendente',
            notes: row[9] || ''
        }));
        
        renderServicesTable();
        updateDashboard();
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
    }
}

// Atualiza o dashboard com estatísticas
function updateDashboard() {
    const pendingCount = services.filter(service => service.status !== 'Concluído').length;
    const completedCount = services.filter(service => service.status === 'Concluído').length;
    const totalRevenue = services
        .filter(service => service.status === 'Concluído')
        .reduce((sum, service) => sum + service.value, 0);
    
    document.getElementById('pending-count').textContent = pendingCount;
    document.getElementById('completed-count').textContent = completedCount;
    document.getElementById('total-revenue').textContent = `R$ ${totalRevenue.toFixed(2)}`;
    
    // Renderizar tabela de serviços recentes
    const recentServices = [...services]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    const recentServicesTable = document.getElementById('recent-services-table');
    recentServicesTable.innerHTML = '';
    
    recentServices.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-4">${service.clientName}</td>
            <td class="py-3 px-4">${service.brand} ${service.model}</td>
            <td class="py-3 px-4">${service.serviceType}</td>
            <td class="py-3 px-4">R$ ${service.value.toFixed(2)}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded text-xs font-semibold ${getStatusClass(service.status)}">
                    ${service.status}
                </span>
            </td>
            <td class="py-3 px-4">${formatDate(service.date)}</td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800" onclick="viewServiceDetails(${service.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        recentServicesTable.appendChild(row);
    });
}

// Exibe/oculta diferentes seções de conteúdo
function showContent(contentType) {
    // Ocultar todos os conteúdos
    document.getElementById('dashboard-content').classList.add('hidden');
    document.getElementById('clients-content').classList.add('hidden');
    document.getElementById('services-content').classList.add('hidden');
    
    // Remover a classe active de todos os botões
    document.querySelectorAll('.active-menu').forEach(el => {
        el.classList.remove('active-menu');
    });
    
    // Mostrar o conteúdo selecionado
    document.getElementById(`${contentType}-content`).classList.remove('hidden');
    document.getElementById(`${contentType}-btn`).classList.add('active-menu');
    
    // Atualizar o conteúdo específico
    if (contentType === 'dashboard') {
        updateDashboard();
    } else if (contentType === 'clients') {
        renderClientsTable();
    } else if (contentType === 'services') {
        renderServicesTable();
    }
}

// Renderiza a tabela de clientes
function renderClientsTable() {
    const tableBody = document.getElementById('clients-table');
    tableBody.innerHTML = '';
    
    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-4">${client.name}</td>
            <td class="py-3 px-4">${client.email}</td>
            <td class="py-3 px-4">${client.phone}</td>
            <td class="py-3 px-4">${client.services}</td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800 mr-2" onclick="editClient(${client.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="text-blue-600 hover:text-blue-800" onclick="viewClientServices(${client.id})">
                    <i class="fas fa-history"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Renderiza a tabela de serviços
function renderServicesTable() {
    const tableBody = document.getElementById('services-table');
    tableBody.innerHTML = '';
    
    const filteredServices = filterServicesList();
    
    filteredServices.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-4">${service.clientName}</td>
            <td class="py-3 px-4">${service.brand} ${service.model}</td>
            <td class="py-3 px-4">${service.imei}</td>
            <td class="py-3 px-4">${service.serviceType}</td>
            <td class="py-3 px-4">R$ ${service.value.toFixed(2)}</td>
            <td class="py-3 px-4">${service.paymentMethod}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 rounded text-xs font-semibold ${getStatusClass(service.status)}">
                    ${service.status}
                </span>
            </td>
            <td class="py-3 px-4">${formatDate(service.date)}</td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800 mr-2" onclick="updateServiceStatus(${service.id})">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <button class="text-blue-600 hover:text-blue-800" onclick="viewServiceDetails(${service.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Funções auxiliares
function getStatusClass(status) {
    switch (status) {
        case 'Pendente':
            return 'bg-yellow-100 text-yellow-800';
        case 'Em Processo':
            return 'bg-blue-100 text-blue-800';
        case 'Concluído':
            return 'bg-green-100 text-green-800';
        case 'Rejeitado':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function formatDate(dateString) {
    return moment(dateString).format('DD/MM/YYYY');
}

// Filtra a lista de serviços baseado nos filtros aplicados
function filterServicesList() {
    const searchTerm = document.getElementById('service-search').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const brandFilter = document.getElementById('brand-filter').value;
    const orderBy = document.getElementById('order-by').value;
    
    let filtered = [...services];
    
    // Aplicar filtro de busca
    if (searchTerm) {
        filtered = filtered.filter(service => 
            service.clientName.toLowerCase().includes(searchTerm) || 
            service.imei.toLowerCase().includes(searchTerm) ||
            service.serviceType.toLowerCase().includes(searchTerm) ||
            service.brand.toLowerCase().includes(searchTerm) ||
            service.model.toLowerCase().includes(searchTerm)
        );
    }
    
    // Aplicar filtro de status
    if (statusFilter) {
        filtered = filtered.filter(service => service.status === statusFilter);
    }
    
    // Aplicar filtro de marca
    if (brandFilter) {
        filtered = filtered.filter(service => service.brand === brandFilter);
    }
    
    // Aplicar ordenação
    switch (orderBy) {
        case 'date-desc':
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date-asc':
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'value-desc':
            filtered.sort((a, b) => b.value - a.value);
            break;
        case 'value-asc':
            filtered.sort((a, b) => a.value - b.value);
            break;
    }
    
    return filtered;
}

// Filtra clientes
function filterClients() {
    renderClientsTable();
}

// Filtra serviços
function filterServices() {
    renderServicesTable();
}

// Funções de formulários
function showAddClientForm() {
    // Implementação do modal para adicionar cliente
    document.getElementById('add-client-modal').classList.remove('hidden');
}

function showAddServiceForm() {
    // Implementação do modal para adicionar serviço
    document.getElementById('add-service-modal').classList.remove('hidden');
}

// Funções para manipulação de dados
async function addClient(clientData) {
    try {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: CLIENTS_SHEET_ID,
            range: 'Clientes!A:E',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [
                    [clientData.name, clientData.email, clientData.phone, 0]
                ]
            }
        });
        
        await loadClients();
        return true;
    } catch (error) {
        console.error('Erro ao adicionar cliente:', error);
        return false;
    }
}

async function addService(serviceData) {
    try {
        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SERVICES_SHEET_ID,
            range: 'Serviços!A:K',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [
                    [
                        serviceData.clientName,
                        serviceData.serviceType,
                        serviceData.imei,
                        serviceData.brand,
                        serviceData.model,
                        serviceData.value,
                        serviceData.paymentMethod,
                        serviceData.date,
                        'Pendente',
                        serviceData.notes
                    ]
                ]
            }
        });
        
        // Atualizar o contador de serviços do cliente
        const clientIndex = clients.findIndex(c => c.name === serviceData.clientName);
        if (clientIndex >= 0) {
            const clientRow = clientIndex + 2; // +2 porque a primeira linha é o cabeçalho e as linhas começam em 1
            
            await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: CLIENTS_SHEET_ID,
                range: `Clientes!D${clientRow}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[clients[clientIndex].services + 1]]
                }
            });
        }
        
        await Promise.all([loadServices(), loadClients()]);
        return true;
    } catch (error) {
        console.error('Erro ao adicionar serviço:', error);
        return false;
    }
}

async function updateServiceStatus(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    // Rotacionar entre os estados
    const statusOrder = ['Pendente', 'Em Processo', 'Concluído', 'Rejeitado'];
    const currentIndex = statusOrder.indexOf(service.status);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    const newStatus = statusOrder[nextIndex];
    
    try {
        const serviceRow = serviceId + 1; // +1 porque as linhas começam em 1 (considerando que a linha 1 é o cabeçalho)
        
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: SERVICES_SHEET_ID,
            range: `Serviços!I${serviceRow}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[newStatus]]
            }
        });
        
        await loadServices();
        return true;
    } catch (error) {
        console.error('Erro ao atualizar status do serviço:', error);
        return false;
    }
}

// Funções para visualizar detalhes
function viewClientServices(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    // Filtrar serviços deste cliente
    const clientServices = services.filter(s => s.clientName === client.name);
    
    // Exibir modal com histórico de serviços
    alert(`Histórico de serviços para ${client.name}: ${clientServices.length} serviços`);
}

function viewServiceDetails(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    // Exibir modal com detalhes do serviço
    document.getElementById('service-details-modal').classList.remove('hidden');
    
    const detailsContent = document.getElementById('service-details-content');
    
    // Formatar os detalhes do serviço
    let statusClass = '';
    switch (service.status) {
        case 'Pendente':
            statusClass = 'bg-yellow-100 text-yellow-800';
            break;
        case 'Em Processo':
            statusClass = 'bg-blue-100 text-blue-800';
            break;
        case 'Concluído':
            statusClass = 'bg-green-100 text-green-800';
            break;
        case 'Rejeitado':
            statusClass = 'bg-red-100 text-red-800';
            break;
    }
    
    detailsContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <p class="text-sm text-gray-500">Cliente</p>
                <p class="font-medium">${service.clientName}</p>
            </div>
            <div>
                <p class="text-sm text-gray-500">Data do Pedido</p>
                <p class="font-medium">${formatDate(service.date)}</p>
            </div>
            <div>
                <p class="text-sm text-gray-500">Aparelho</p>
                <p class="font-medium">${service.brand} ${service.model}</p>
            </div>
            <div>
                <p class="text-sm text-gray-500">IMEI</p>
                <p class="font-medium">${service.imei}</p>
            </div>
            <div>
                <p class="text-sm text-gray-500">Tipo de Serviço</p>
                <p class="font-medium">${service.serviceType}</p>
            </div>
            <div>
                <p class="text-sm text-gray-500">Status</p>
                <p class="px-2 py-1 rounded text-xs font-semibold inline-block ${statusClass}">${service.status}</p>
            </div>
            <div>
                <p class="text-sm text-gray-500">Valor</p>
                <p class="font-medium">R$ ${service.value.toFixed(2)}</p>
            </div>
            <div>
                <p class="text-sm text-gray-500">Forma de Pagamento</p>
                <p class="font-medium">${service.paymentMethod}</p>
            </div>
        </div>
        
        <div class="mb-4">
            <p class="text-sm text-gray-500">Observações</p>
            <p class="p-3 bg-gray-50 rounded">${service.notes || 'Nenhuma observação registrada.'}</p>
        </div>
        
        <div class="flex justify-between">
            <button onclick="showStatusUpdateModal(${service.id})" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                <i class="fas fa-sync-alt mr-2"></i>Atualizar Status
            </button>
            <button onclick="createServiceInvoice(${service.id})" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                <i class="fas fa-file-invoice-dollar mr-2"></i>Gerar Recibo
            </button>
        </div>
    `
}

// Funções de envio de notificações
function sendStatusUpdateNotification(serviceId) {
    // Implementação do envio de notificações via e-mail ou SMS
    alert('Função de envio de notificações será implementada aqui');
}