import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8040",
    withCredentials: false,
});

// Sensitive fields that should never be logged
const SENSITIVE_FIELDS = [
    'password',
    'currentPassword',
    'newPassword',
    'confirmPassword',
    'token',
    'Authorization',
    'spj'
];

// Sanitize sensitive data from logs
const sanitizeData = (data) => {
    if (!data || typeof data !== 'object') return data;

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
        if (SENSITIVE_FIELDS.some(field => field.toLowerCase() === key.toLowerCase())) {
            sanitized[key] = '***REDACTED***';
        } else if (typeof sanitized[key] === 'object') {
            sanitized[key] = sanitizeData(sanitized[key]);
        }
    }

    return sanitized;
};

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("spj");
    if (token && !config.headers?.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // NEVER log request data with passwords
    if (process.env.NODE_ENV === 'development') {
        const safeConfig = { ...config, data: sanitizeData(config.data) };
        console.debug('[API Request]', config.url, { method: config.method, data: safeConfig.data });
    }

    return config;
});

axiosInstance.interceptors.response.use(
    (response) => {
        if (process.env.NODE_ENV === 'development') {
            const safeData = sanitizeData(response.data);
            console.debug('[API Response]', response.config.url, { status: response.status, data: safeData });
        }
        return response;
    },
    (error) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
            window.dispatchEvent(new CustomEvent("auth:expired"));
        }

        // Log error without exposing sensitive data
        if (process.env.NODE_ENV === 'development') {
            const safeData = error.response?.data ? sanitizeData(error.response.data) : null;
            console.debug('[API Error]', error.response?.config.url, {
                status: error.response?.status,
                data: safeData,
                message: error.message
            });
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
