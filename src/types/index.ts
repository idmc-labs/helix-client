export interface BasicEntity {
    id: string;
    name: string;
}

export interface EnumEntity {
    name: string & number;
    description: string;
}

export interface BasicEntityWithSubTypes extends BasicEntity {
    subTypes: BasicEntity[];
}

export interface BasicEntityWithSubCategories extends BasicEntity {
    subCategories: BasicEntity[];
}

export interface CrisisTypeFields extends EnumEntity {
}

export interface CountryFields extends BasicEntity {
}

export interface ActorFields extends BasicEntity {
}

export interface EventTypeFields extends EnumEntity {
}

export interface DisasterTypeFields extends BasicEntity {
}

export interface DisasterSubTypeFields extends BasicEntity {
}

export interface DisasterCategoryFields extends BasicEntity {
}

export interface DisasterSubCategoryFields extends BasicEntity {
}

export interface TriggerFields extends BasicEntity {
}

export interface TriggerSubTypeFields extends BasicEntity {
}

export interface ViolenceFields extends BasicEntity {
}

export interface ViolenceSubTypeFields extends BasicEntity {
}

export interface CrisisFormFields {
    name?: string;
    countries: CountryFields['id'][];
    crisisType: CrisisTypeFields['name'];
    crisisNarrative?: string;
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

export interface AgeFields {
    ageFrom?: number;
    ageTo?: number;
    uuid: string;
    value?: number;
}

export interface AgeFormProps extends AgeFields {}

export interface StrataFields {
    date?: string;
    uuid: string;
    value?: number;
}

export interface StrataFormProps extends StrataFields {}

export interface FigureFormProps {
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
    quantifier: number & undefined;
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
    uuid: string;
}
