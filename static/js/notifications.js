import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

document.addEventListener('DOMContentLoaded', async () => {
    // Supabase setup
    const supabaseUrl = 'https://xqcvwnimuldnehgciivo.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxY3Z3bmltdWxkbmVoZ2NpaXZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE0ODg5NCwiZXhwIjoyMDcxNzI0ODk0fQ.yPAQdjX7dNKaoe6AzVqh6YGCJxj0OSULO9q45lm6Gjg';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // DOM elements
    const panel = document.getElementById('notifications-panel');
    const notificationsList = document.getElementById('notifications-list');
    const bell = document.getElementById('notifications-bell');
    const closeBtn = document.getElementById('close-notifications');

    panel.classList.remove('open');

    // Map alert types to colors
    const colorMap = {
        'low stock': 'yellow',
        'expiring soon': 'pink',
        'expired': 'purple'
    };

    // Toggle panel
    bell.addEventListener('click', () => panel.classList.toggle('open'));
    closeBtn.addEventListener('click', () => panel.classList.remove('open'));

    // Fetch alerts from Supabase
    async function fetchAlerts() {
        const { data, error } = await supabase
            .from('alerts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching alerts:', error);
            return [];
        }
        return data;
    }

    // Render notifications
    function renderNotifications(alerts) {
        notificationsList.innerHTML = '';
        alerts.forEach(alert => {
            const card = document.createElement('div');
            card.className = 'notification-card';
            card.style.borderLeftColor = colorMap[alert.alert_type] || 'gray';
            card.innerHTML = `
                <div class="title">${alert.alert_type}</div>
                <div class="body">${alert.body}</div>
                <span class="material-icons dismiss">close</span>
            `;
            card.querySelector('.dismiss').addEventListener('click', async () => {
                // Remove locally
                card.remove();
                // Optional: mark as dismissed in Supabase
                await supabase
                    .from('alerts')
                    .update({ dismissed: true })
                    .eq('id', alert.id);
            });
            notificationsList.appendChild(card);
        });

        // Update bell badge count
        const activeAlerts = alerts.filter(a => !a.dismissed).length;
        if (activeAlerts > 0) {
            bell.setAttribute('data-count', activeAlerts);
        } else {
            bell.removeAttribute('data-count');
        }
    }

    // Initial fetch and render
    const alerts = await fetchAlerts();
    renderNotifications(alerts);

    // Auto-refresh every 30 seconds
    setInterval(async () => {
        const newAlerts = await fetchAlerts();
        renderNotifications(newAlerts);
    }, 30000);
});
