export interface UserPermission {
    [path: string]: boolean;
}

export interface UserProfileWithPermission {
    id: string;
    email: string;
    display_name: string;
    permissions: UserPermission;
}
