// API Configuration
// Set USE_GATEWAY to true to use API Gateway, false to call services directly
export const USE_GATEWAY = true;

// API Gateway URL (when USE_GATEWAY is true)
export const GATEWAY_URL = 'http://localhost:3000';

// Direct Service URLs (when USE_GATEWAY is false)
export const SERVICE_URLS = {
  auth: 'http://localhost:3001',
  order: 'http://localhost:3002',
  task: 'http://localhost:3003',
  file: 'http://localhost:3004',
  studio: 'http://localhost:3005',
  notification: 'http://localhost:3006'
};

// Get base URL based on configuration
export const getApiUrl = (service) => {
  if (USE_GATEWAY) {
    // API Gateway routes
    const gatewayRoutes = {
      auth: `${GATEWAY_URL}/api/auth`,
      order: `${GATEWAY_URL}/api/orders`,
      task: `${GATEWAY_URL}/api/tasks`,
      file: `${GATEWAY_URL}/api/files`,
      studio: `${GATEWAY_URL}/api/studios`,
      notification: `${GATEWAY_URL}/api/notifications`
    };
    return gatewayRoutes[service] || GATEWAY_URL;
  } else {
    // Direct service URLs
    return SERVICE_URLS[service] || SERVICE_URLS.auth;
  }
};

// Notification service Socket.IO URL
export const getNotificationSocketUrl = () => {
  if (USE_GATEWAY) {
    return GATEWAY_URL;
  } else {
    return SERVICE_URLS.notification;
  }
};

