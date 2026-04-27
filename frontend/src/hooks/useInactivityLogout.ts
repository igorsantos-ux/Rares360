import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../services/api';

const INACTIVITY_TIMEOUT_MS_DEFAULT = 20 * 60 * 1000;
const INACTIVITY_TIMEOUT_MS_ADMIN = 15 * 60 * 1000;

const ACTIVITY_EVENTS = [
    'mousemove',
    'mousedown',
    'keydown',
    'touchstart',
    'touchmove',
    'scroll',
    'click',
    'focus',
    'visibilitychange'
];

export const logoutUtil = async () => {
    try {
        await authApi.logout();
    } catch (e) {
        // ignore backend logout errors if network is down
    }

    // Cleanup local storage
    localStorage.removeItem('heath_finance_token');
    localStorage.removeItem('heath_finance_clinic_id');
    localStorage.removeItem('heath_finance_active_clinic_id');

    // Clear session storage
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(";").forEach((c) => {
        document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    sessionStorage.setItem('logoutReason', 'inactivity');
    window.location.href = '/login';
};

export const useInactivityLogout = () => {
    const { user, loading } = useAuth();
    // Using ReturnType<typeof setTimeout> because NodeJS.Timeout is not always available in browser TypeScript configs
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const channelRef = useRef<BroadcastChannel | null>(null);

    const getTimeoutMs = useCallback(() => {
        if (user?.role === 'ADMIN_GLOBAL') {
            return INACTIVITY_TIMEOUT_MS_ADMIN;
        }
        return INACTIVITY_TIMEOUT_MS_DEFAULT;
    }, [user?.role]);

    const performLogout = useCallback(() => {
        if (channelRef.current) {
            channelRef.current.postMessage({ type: 'LOGOUT', reason: 'inactivity' });
        }
        logoutUtil();
    }, []);

    const resetTimer = useCallback(() => {
        if (loading || !user) return; // Only active when authenticated

        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (document.visibilityState === 'visible') {
            timerRef.current = setTimeout(performLogout, getTimeoutMs());
        } else {
            // Keep timer running even if tab is hidden
            timerRef.current = setTimeout(performLogout, getTimeoutMs());
        }
    }, [loading, user, getTimeoutMs, performLogout]);

    useEffect(() => {
        if (loading || !user) return; // Hook logic only for authenticated users

        // BroadcastChannel initialization
        channelRef.current = new BroadcastChannel('rares360_auth');
        channelRef.current.onmessage = (event) => {
            if (event.data?.type === 'LOGOUT') {
                logoutUtil();
            }
        };

        // Initialize timer
        resetTimer();

        // Setup event listeners
        ACTIVITY_EVENTS.forEach((event) => {
            window.addEventListener(event, resetTimer, { passive: true });
        });

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            if (channelRef.current) {
                channelRef.current.close();
            }
            ACTIVITY_EVENTS.forEach((event) => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [loading, user, resetTimer]);
};
