import {
    Permission_Action, // eslint-disable-line camelcase
    Permission_Entity, // eslint-disable-line camelcase
    User_Role, // eslint-disable-line camelcase
    Entry_Review_Status, // eslint-disable-line camelcase
} from '#generated/types';

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

type NoNull<T> = T extends null ? never : T;

export type ExtractKeys<T, M> = {
    [K in keyof Required<T>]: NoNull<Required<T>[K]> extends M ? K : never
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
    username: string;
    fullName?: string;
    email: string;
    id: string;
    // eslint-disable-next-line camelcase
    role?: User_Role;
    permissions?: {
        // eslint-disable-next-line camelcase
        [key in Permission_Action]?: {
            // eslint-disable-next-line camelcase
            [entityKey in Permission_Entity]?: boolean;
        };
    };
}

export interface Notification {
    icons?: React.ReactNode;
    actions?: React.ReactNode;
    children?: React.ReactNode;
    duration?: number;
    horizontalPosition?: 'start' | 'middle' | 'end';
    verticalPosition?: 'start' | 'middle' | 'end';
    variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning';
}

export interface ReviewFields {
    field: string;
    // eslint-disable-next-line camelcase
    value: Entry_Review_Status;
    figure?: string;
    ageId?: string;
    strataId?: string;
}

export interface ReviewInputFields {
    // eslint-disable-next-line camelcase
    [key: string]: Entry_Review_Status;
}

export interface CommentFields {
    id: string;
    body: string;
}
