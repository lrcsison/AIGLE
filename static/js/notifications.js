import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

document.addEventListener('DOMContentLoaded', async () => {
    // ✅ Supabase setup
    const supabaseUrl = 'https://xqcvwnimuldnehgciivo.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxY3Z3bmltdWxkbmVoZ2NpaXZvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjE0ODg5NCwiZXhwIjoyMDcxNzI0ODk0fQ.yPAQdjX7dNKaoe6AzVqh6YGCJxj0OSULO9q45lm6Gjg';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ✅ DOM elements
    const panel = document.getElementById('notifications-panel');
    const notificationsList = document.getElementById('notifications-list');
    const bell = document.getElementById('notifications-bell');
    const closeBtn = document.getElementById('close-notifications');

    // ✅ Color mapping for alert types
    const colorMap = {
        'low stock': '#FFD700',
        'expiring soon': '#FF69B4',
        'expired': '#9370DB'
    };

    // ✅ Toggle panel open/close
    bell?.addEventListener('click', () => panel.classList.toggle('open'));
    closeBtn?.addEventListener('click', () => panel.classList.remove('open'));

    // ✅ Fetch alerts with related medicine info
    async function fetchAlerts() {
        const { data, error } = await supabase
            .from('alerts')
            .select(`
                alert_id,
                alert_type,
                status,
                threshold,
                created_at,
                resolved_at,
                synced,
                medicine_id,
                medicines (
                    medicine_id,
                    name,
                    quantity,
                    expiry_date
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching alerts:', error);
            return [];
        }
        return data;
    }

    // ✅ Render notifications (only active ones)
    function renderNotifications(alerts) {
        notificationsList.innerHTML = '';

        const activeAlerts = alerts.filter(a => a.status === 'active');

        if (activeAlerts.length === 0) {
            notificationsList.innerHTML = `<div class="no-alerts">No active alerts</div>`;
            bell?.removeAttribute('data-count');
            return;
        }

        activeAlerts.forEach(alert => {
            const med = alert.medicines;
            const medName = med?.name || 'Unknown medicine';
            const medQty = med?.quantity ?? 'N/A';
            const medId = med?.medicine_id || alert.medicine_id;

            const card = document.createElement('div');
            card.className = 'notification-card';
            card.style.borderLeftColor = colorMap[alert.alert_type?.toLowerCase()] || 'gray';

            card.innerHTML = `
                <div class="title">${alert.alert_type}</div>
                <div class="subtitle">
                    <strong>Medicine ID:</strong> ${medId}<br>
                    <strong>Name:</strong> ${medName}<br>
                    <strong>Quantity:</strong> ${medQty}
                </div>
                <span class="material-icons dismiss">close</span>
            `;

            // Handle dismiss
            const dismissBtn = card.querySelector('.dismiss');
            dismissBtn.addEventListener('click', async () => {
                card.classList.add('dismissed');

                const { error } = await supabase
                    .from('alerts')
                    .update({
                        status: 'dismissed',
                        resolved_at: new Date().toISOString().split('T')[0]
                    })
                    .eq('alert_id', alert.alert_id);

                if (error) {
                    console.error('❌ Error dismissing alert:', error);
                    return;
                }

                setTimeout(() => card.remove(), 300);
            });

            notificationsList.appendChild(card);
        });

        // Update bell badge
        bell?.setAttribute('data-count', activeAlerts.length);
    }

    // ✅ Initial load
    const alerts = await fetchAlerts();
    renderNotifications(alerts);

    // ✅ Real-time listener
    supabase
        .channel('alerts-realtime')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'alerts' },
            async () => {
                const updated = await fetchAlerts();
                renderNotifications(updated);
            }
        )
        .subscribe();

    // ✅ Fallback refresh
    setInterval(async () => {
        const updated = await fetchAlerts();
        renderNotifications(updated);
    }, 30000);
});
