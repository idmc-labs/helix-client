// FIXME: merge with types/index.ts
export interface User {
    username: string;
    email: string;
    id: number;
    // isSuperuser: boolean;
    // FIXME: should be enumed
    role?: 'ADMIN' | 'IT_HEAD' | 'EDITOR' | 'REVIEWER' | 'GUEST';
}
