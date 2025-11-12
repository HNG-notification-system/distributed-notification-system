// Service Worker for Web Push Notifications

self.addEventListener('push', event => {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (err) {
            console.error('Error parsing push data:', err);
        }
    }

    const title = data.title || 'New Notification';
    const options = {
        body: data.body || '',
        icon: data.icon || '/icon.png',
        badge: data.badge || '/badge.png',
        data: data.data || {},
        actions: data.actions || []
    };

    console.log('[SW] Push received:', data);

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    const actionUrl = event.notification.data.action_url || '/';
    console.log('[SW] Notification click, opening URL:', actionUrl);

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url === actionUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(actionUrl);
            }
        })
    );
});

self.addEventListener('notificationclose', event => {
    console.log('[SW] Notification closed:', event.notification.data);
});
