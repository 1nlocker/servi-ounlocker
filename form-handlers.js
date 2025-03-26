// Script para manipular os formulários modais

// Manipuladores para Modal de Clientes
function closeClientModal() {
    document.getElementById('add-client-modal').classList.add('hidden');
    document.getElementById('add-client-form').reset();
}

// Manipuladores para Modal de Serviços
function closeServiceModal() {
    document.getElementById('add-service-modal').classList.add('hidden');
    document.getElementById('add-service-form').reset();
}

// Manipuladores para Modal de Detalhes do Serviço
function closeServiceDetailsModal() {
    document.getElementById('service-details-modal').classList.add('hidden');
}

// Manipuladores para Modal de Atualização de Status
function showStatusUpdateModal(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    document.getElementById('status-service-id').value = serviceId;
    document.getElementById('status-select').value = service.status;
    document.getElementById('status-notes').value = '';
    document.getElementById('send-notification').checked = true;
    
    closeServiceDetailsModal();
    document.getElementById('status-update-modal').classList.remove('hidden');
}

function closeStatusUpdateModal() {
    document.getElementById('status-update-modal').classList.add('hidden');
}

// Manipuladores para Relatórios
function showFinancialReport() {
    const reportTitle = document.getElementById('report-title');
    reportTitle.textContent = 'Relatório Financeiro';
    
    // Dados para o gráfico - agrupa por mês
    const monthlyData = {};
    services.forEach(service => {
        const month = moment(service.date).format('MM/YYYY');
        if (!monthlyData[month]) {
            monthlyData[month] = {
                total: 0,
                count: 0,
                completed: 0,
                completedValue: 0
            };
        }
        
        monthlyData[month].count++;
        monthlyData[month].total += service.value;
        
        if (service.status === 'Concluído') {
            monthlyData[month].completed++;
            monthlyData[month].completedValue += service.value;
        }
    });
    
    // Criar tabela
    const tableContainer = document.getElementById('report-table-container');
    tableContainer.innerHTML = `
        <table class="min-w-full bg-white">
            <thead class="bg-gray-100">
                <tr>
                    <th class="text-left py-3 px-4 font-semibold text-sm">Mês</th>
                    <th class="text-left py-3 px-4 font-semibold text-sm">Total de Serviços</th>
                    <th class="text-left py-3 px-4 font-semibold text-sm">Serviços Concluídos</th>
                    <th class="text-left py-3 px-4 font-semibold text-sm">Valor Total</th>
                    <th class="text-left py-3 px-4 font-semibold text-sm">Valor Recebido</th>
                </tr>
            </thead>
            <tbody>
                ${Object.keys(monthlyData).map(month => `
                    <tr>
                        <td class="py-3 px-4">${month}</td>
                        <td class="py-3 px-4">${monthlyData[month].count}</td>
                        <td class="py-3 px-4">${monthlyData[month].completed}</td>
                        <td class="py-3 px-4">R$ ${monthlyData[month].total.toFixed(2)}</td>
                        <td class="py-3 px-4">R$ ${monthlyData[month].completedValue.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Mostrar a seção de relatório
    document.getElementById('report-content').classList.remove('hidden');
}

// Gerar recibo para serviço
function createServiceInvoice(serviceId) {
    alert('Função de gerar recibo será implementada aqui');
}

// Configurar eventos dos relatórios
document.addEventListener('DOMContentLoaded', function() {
    // Botões de relatórios
    document.getElementById('financial-report-btn').addEventListener('click', showFinancialReport);
    document.getElementById('services-report-btn').addEventListener('click', showServicesReport);
    document.getElementById('clients-report-btn').addEventListener('click', showClientsReport);
    
    // Botões de exportação
    document.getElementById('export-pdf-btn').addEventListener('click', exportToPDF);
    document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);
    
    // Formulários
    document.getElementById('add-client-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const clientData = {
            name: document.getElementById('client-name').value,
            email: document.getElementById('client-email').value,
            phone: document.getElementById('client-phone').value
        };
        
        addClient(clientData).then(success => {
            if (success) {
                closeClientModal();
                showContent('clients');
            }
        });
    });
    
    document.getElementById('add-service-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const serviceData = {
            clientName: document.getElementById('service-client').value,
            serviceType: document.getElementById('service-type').value,
            brand: document.getElementById('service-brand').value,
            model: document.getElementById('service-model').value,
            imei: document.getElementById('service-imei').value,
            value: parseFloat(document.getElementById('service-value').value),
            paymentMethod: document.getElementById('service-payment').value,
            date: document.getElementById('service-date').value,
            notes: document.getElementById('service-notes').value
        };
        
        addService(serviceData).then(success => {
            if (success) {
                closeServiceModal();
                showContent('services');
            }
        });
    });
});