import {
    CountryType,
} from '#generated/types';

interface Entity {
    id: string;
    name: string;
}

export type Group = Entity;

export interface Resource extends Entity {
    group?: Group;
    url: string;
    lastAccessedOn?: string;
    countries: CountryType[];
    createdAt: string;
}

export type Country = Entity;
