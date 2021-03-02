export interface Entity {
    id: string;
    name: string | undefined;
}

export type Entities = Array<Entity | null | undefined>;

export interface PaginatedEntities {
    results?: Entity[] | null | undefined;
    totalCount?: number | null | undefined;
}

/*
interface WithCount {
}
*/
export interface User {
    id: string;
    email: string;
    fullName: string;
}
