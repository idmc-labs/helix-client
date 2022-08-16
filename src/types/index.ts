import {
    Permission_Action, // eslint-disable-line camelcase
    Permission_Entity, // eslint-disable-line camelcase
    User_Role, // eslint-disable-line camelcase
} from '#generated/types';

export type MakeRequired<T, K extends string> = Omit<T, K> & Required<T>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type PartialForm<T> = T extends object ? (
    T extends (infer K)[] ? (
        PartialForm<K>[]
    ) : (
        T extends { uuid: string } ? (
            { [P in Exclude<keyof T, 'uuid'>]?: PartialForm<T[P]> }
            & Pick<T, 'uuid'>
        ) : (
            { [P in keyof T]?: PartialForm<T[P]> }
        )
    )
) : T;

type NoNull<T> = T extends null | undefined ? never : T;
export type ExtractKeys<T, M> = {
    [K in keyof Required<T>]: NoNull<T[K]> extends M ? K : never
}[keyof T];

export type PurgeNull<T> = (
    T extends (infer Z)[]
        ? PurgeNull<Z>[]
        : (
            // eslint-disable-next-line @typescript-eslint/ban-types
            T extends object
                ? { [K in keyof T]: PurgeNull<T[K]> }
                : (T extends null ? undefined : T)
        )
)
export type NonNullableRec<T> = (
    T extends (infer Z)[]
        ? NonNullableRec<Z>[]
        : (
            // eslint-disable-next-line @typescript-eslint/ban-types
            T extends object
                ? { [K in keyof T]-?: NonNullableRec<T[K]> }
                : (T extends null | undefined ? never : T)
        )
)

export interface ListEntity {
    uuid: string;
}

export interface EnumEntity<T extends string | number> {
    name: T;
    description?: string | null;
}

export interface BasicEntity {
    id: string;
    name: string;
}

export interface BasicEntityWithSubTypes extends BasicEntity {
    subTypes: BasicEntity[];
}

export interface User {
    fullName: string;
    id: string;
    // eslint-disable-next-line camelcase
    portfolioRole?: User_Role;
    permissions?: {
        // eslint-disable-next-line camelcase
        [entityKey in Permission_Entity]?: {
            // eslint-disable-next-line camelcase
            [key in Permission_Action]?: boolean;
        };
    };
}

export type NotificationVariant = 'default' | 'success' | 'error';

export interface Notification {
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    duration?: number;
    horizontalPosition?: 'start' | 'middle' | 'end';
    verticalPosition?: 'start' | 'middle' | 'end';
    variant?: NotificationVariant;
}
