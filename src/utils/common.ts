import {
    BasicEntity,
    EnumEntity,
} from '#types';

export const basicEntityKeySelector = (d: BasicEntity) => d.id;
export const basicEntityLabelSelector = (d: BasicEntity) => d.name;

export const enumKeySelector = <T extends string | number>(d: EnumEntity<T>) => d.name;
export const enumLabelSelector = (d: EnumEntity<string>) => d.description;
