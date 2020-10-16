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
    description: string;
}

export interface BasicEntity {
    id: string;
    name: string;
}

export interface BasicEntityWithSubTypes extends BasicEntity {
    subTypes: BasicEntity[];
}

export interface BasicEntityWithSubCategories extends BasicEntity {
    subCategories: BasicEntity[];
}

type CrisisTypeFields = EnumEntity<string>;
type EventTypeFields = EnumEntity<string>;

export type CountryFields = BasicEntity;
export type ActorFields = BasicEntity;
export type DisasterTypeFields = BasicEntity;
export type DisasterSubTypeFields = BasicEntity;
export type DisasterCategoryFields = BasicEntity;
export type DisasterSubCategoryFields = BasicEntity;
export type TriggerFields = BasicEntity;
export type TriggerSubTypeFields = BasicEntity;
export type ViolenceFields = BasicEntity;
export type ViolenceSubTypeFields = BasicEntity;

export interface CrisisFormFields {
    name?: string;
    countries: CountryFields['id'][];
    crisisType: CrisisTypeFields['name'];
    crisisNarrative?: string;
}

export interface EventFormFields {
    actor?: ActorFields['id'];
    countries: CountryFields['id'][];
    crisis: BasicEntity['id'];
    disasterCategory?: DisasterCategoryFields['id'];
    disasterSubCategory?: DisasterSubCategoryFields['id'];
    disasterSubType?: DisasterSubTypeFields['id'];
    disasterType?: DisasterTypeFields['id'];
    endDate?: string;
    eventNarrative?: string;
    eventType: EventTypeFields['name'];
    glideNumber?: string;
    name: string;
    startDate?: string;
    trigger?: TriggerFields['id'];
    triggerSubType?: TriggerSubTypeFields['id'];
    violence?: ViolenceFields['id'];
    violenceSubType?: ViolenceSubTypeFields['id'];
}

export interface AgeFormProps extends ListEntity{
    ageFrom?: number;
    ageTo?: number;
    value?: number;
}

export interface StrataFormProps extends ListEntity {
    date?: string;
    value?: number;
}

export interface FigureFormProps extends ListEntity {
    ageJson: AgeFormProps[];
    conflict?: number;
    conflictCommunal?: number;
    conflictCriminal?: number;
    conflictOther?: number;
    conflictPolitical?: number;
    displacementRural?: number;
    displacementUrban?: number;
    districts?: string;
    excerptIdu?: string;
    householdSize?: number;
    includeIdu: boolean;
    isDisaggregated: boolean;
    locationCamp?: number;
    locationNonCamp?: number;
    quantifier?: string;
    reported?: number;
    role: string;
    sexFemale?: number;
    sexMale?: number;
    startDate?: string;
    strataJson: StrataFormProps[];
    term: string;
    town?: string;
    type: string;
    unit: string;
}

export interface DetailsFormProps {
    articleTitle: string;
    excerptMethodology: string;
    publishDate: string;
    publisher: string;
    source: string;
    sourceBreakdown: string;
    sourceExcerpt: string;
    sourceMethodology: string;
    url: string;
}

export interface AnalysisFormProps {
    idmcAnalysis: string;
    methodology: string;
    tags: string[];
}

export interface EntryFormFields {
    event: string;
    details: DetailsFormProps;
    analysis: AnalysisFormProps;
    figures: FigureFormProps[];
}

export interface FieldErrorFields {
    fields: string;
    message: string;
}
