export declare const ROLES: {
    readonly ADMIN: "admin";
    readonly EDITOR: "editor";
};
export type UserRole = (typeof ROLES)[keyof typeof ROLES];
