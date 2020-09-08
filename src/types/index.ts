export interface BasicEntity {
    id: string;
    name: string;
}

export interface EnumEntity {
    name: string;
    description: string;
}

export interface CrisisTypeFields extends EnumEntity {
}

export interface CountryFields extends BasicEntity {
}

export interface CrisisFormFields {
    name: string;
    countries: CountryFields['id'][];
    crisisType: CrisisTypeFields['name'];
    crisisNarrative: string;
}
