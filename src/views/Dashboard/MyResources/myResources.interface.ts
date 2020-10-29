interface Entity {
    id: string;
    name: string;
}

export type Group = Entity;

export interface Resource extends Entity {
    group?: Group,
    url: string,
    lastAccessedOn?: string,
    countries: Country[],
}

export type Country = Entity;
