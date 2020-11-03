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

export type ExtractKeys<T, M> = {
    [K in keyof Required<T>]: Required<T>[K] extends M ? K : never
}[keyof T];

export interface ListEntity {
    uuid: string;
}

export interface EnumEntity<T extends string | number> {
    name: T;
    description?: string;
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
    email: string;
    id: string;
    // FIXME: role?: 'ADMIN' | 'IT_HEAD' | 'EDITOR' | 'REVIEWER' | 'GUEST';
    role?: string;
}

export interface ContactFormFields {
    designation: string;
    firstName: string;
    lastName: string;
    gender: string;
    jobTitle:string;
    organization: string;
    countriesOfOperation?: CountryFields['id'][];
    comment?: string;
    country: CountryFields['id'];
    email: string;
    phone: string;
}

export interface OrganizationEntity {
    id: string;
    title: string;
}

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type Designation = 'MR' | 'MS';

export interface ContactEntity {
    id: string;
    lastName: string;
    phone: string;
    organization: {
      id: string;
      title: string;
    };
    jobTitle: string;
    gender: Gender;
    firstName: string;
    email?: string;
    designation: Designation;
    createdAt: string;
    country: BasicEntity;
    countriesOfOperation: BasicEntity[];
}

export interface CommunicationFormFields {
    contact: ContactEntity['id'];
    title?: string;
    subject: string;
    content: string;
    dateTime?: string;
    medium: BasicEntity;
}

export interface CommunicationEntity {
    id: string;
    content: string;
    dateTime?: string;
    medium: BasicEntity;
    subject: string;
    title?: string;
    contact: {
        id: ContactEntity['id'];
    };
    createdAt: string;
}
