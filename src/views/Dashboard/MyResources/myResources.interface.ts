export interface Group {
    id: string,
    name: string,
}

export interface Resource {
    id?: string,
    group?: Group,
    url: string,
    name: string,
    lastAccessedOn?: string,
    countries: Country[],
}

export interface Country {
    id: string,
    name: string,
}