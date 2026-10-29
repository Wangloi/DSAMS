const STORAGE_KEY = 'dsams_device_uuid';

function generateUuid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

export function getDeviceUuid(): string {
    if (typeof window === 'undefined') {
        return '';
    }

    try {
        let uuid = window.localStorage.getItem(STORAGE_KEY);

        if (!uuid) {
            uuid = generateUuid();
            window.localStorage.setItem(STORAGE_KEY, uuid);
        }

        return uuid;
    } catch {
        return generateUuid();
    }
}

export function getDeviceName(): string {
    if (typeof navigator === 'undefined') {
        return '';
    }

    const ua = navigator.userAgent;
    const os = /Windows/i.test(ua)
        ? 'Windows'
        : /Android/i.test(ua)
          ? 'Android'
          : /iPhone|iPad|iPod/i.test(ua)
            ? 'iOS'
            : /Mac/i.test(ua)
              ? 'macOS'
              : /Linux/i.test(ua)
                ? 'Linux'
                : 'Unknown OS';
    const browser = /Edg\//i.test(ua)
        ? 'Edge'
        : /Chrome\//i.test(ua)
          ? 'Chrome'
          : /Firefox\//i.test(ua)
            ? 'Firefox'
            : /Safari\//i.test(ua)
              ? 'Safari'
              : 'Browser';

    return `${browser} on ${os}`;
}

export function getDeviceBindingInfo(): {
    deviceUuid: string;
    deviceName: string;
} {
    return { deviceUuid: getDeviceUuid(), deviceName: getDeviceName() };
}
