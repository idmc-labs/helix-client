import {
    BasicEntity,
    EnumEntity,
} from '#types';

export const basicEntityKeySelector = (d: BasicEntity) => d.id;
export const basicEntityLabelSelector = (d: BasicEntity) => d.name;

export const enumKeySelector = (d: EnumEntity) => d.name;
export const enumLabelSelector = (d: EnumEntity) => d.description;
