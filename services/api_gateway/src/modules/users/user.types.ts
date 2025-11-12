// src/modules/users/user.types.ts
export interface UserPreferences {
    // modern / compact flags
    email?: boolean;
    push?: boolean;
    sms?: boolean;

    // keep common legacy names too so code that expects them still works
    emailNotifications?: boolean;
    pushNotifications?: boolean;
}

export interface UserDevice {
    id?: string;
    token?: string;
    platform?: string;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;

    // optional preferences and device/push fields
    preferences?: UserPreferences;
    pushToken?: string; // legacy single-token field
    devices?: UserDevice[]; // new multi-device support

    createdAt?: string;
    updatedAt?: string;
}
