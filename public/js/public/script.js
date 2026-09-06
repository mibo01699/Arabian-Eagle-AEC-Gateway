document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('service-list');
  try {
    const response = await fetch('/api/apps');
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();

    container.innerHTML = '';
    for (const [key, service] of Object.entries(data)) {
      const statusClass = `status-${service.status.toLowerCase().replace('_', '')}`;
      const div = document.createElement('div');
      div.className = 'service-item';
      div.innerHTML = `
        <div class="info">
          <span class="name">${service.name}</span>
          <span class="desc">${service.description}</span>
        </div>
        <span class="status ${statusClass}">${service.status}</span>
      `;
      container.appendChild(div);
    }
  } catch (error) {
    container.innerHTML = `<div class="loading">⚠️ حدث خطأ في تحميل البيانات: ${error.message}</div>`;
  }
});