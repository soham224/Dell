// Determine protocol based on environment
const protocol = process.env.NODE_ENV === 'production' ? 'http' : 'http';
const baseUrl = `${protocol}://${window.location.hostname}:8000`;

export const REACT_APP_IP_Config = `${baseUrl}/docs`;

export const REACT_APP_API_HOST_IP_Config = `${baseUrl}/api/v1`;