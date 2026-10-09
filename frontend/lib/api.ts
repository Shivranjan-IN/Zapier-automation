import axios from "axios";

export const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
export const HOOKS_BASE =
    process.env.NEXT_PUBLIC_HOOKS_URL ?? "http://localhost:3002";

export const api = axios.create({
    baseURL: API_BASE
});

api.interceptors.request.use(config => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (
            axios.isAxiosError(error) &&
            error.response?.status === 403 &&
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/login") &&
            !window.location.pathname.startsWith("/signup")
        ) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export function getErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;
        if (typeof message === "string") {
            return message;
        }
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return fallback;
}
