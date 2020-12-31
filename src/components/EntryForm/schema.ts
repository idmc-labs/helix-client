import type { Schema, ArraySchema, ObjectSchema } from '#utils/schema';
import {
    arrayCondition,
    requiredStringCondition,
    requiredCondition,
    urlCondition,
    idCondition,
    clearCondition,
} from '#utils/validation';

import { PartialForm } from '#types';
import {
    AgeFormProps,
    GeoLocationFormProps,
    AnalysisFormProps,
    DetailsFormProps,
    FigureFormProps,
    FormValues,
    StrataFormProps,
} from './types';

type Details = ObjectSchema<PartialForm<DetailsFormProps>>;
type DetailsField = ReturnType<Details['fields']>;
const details: Details = {
    fields: (): DetailsField => ({
        articleTitle: [requiredStringCondition],
        publishDate: [requiredStringCondition],
        publisher: [requiredStringCondition],
        source: [requiredStringCondition],
        sourceExcerpt: [],
        url: [urlCondition],
        document: [],
        preview: [],
        isConfidential: [],
    }),
};

type Analysis = ObjectSchema<PartialForm<AnalysisFormProps>>;
type AnalysisField = ReturnType<Analysis['fields']>;
const analysis: Analysis = {
    fields: (): AnalysisField => ({
        idmcAnalysis: [requiredStringCondition],
        calculationLogic: [],
        tags: [],
        caveats: [],
    }),
};

type Age = ObjectSchema<PartialForm<AgeFormProps>>;
type AgeField = ReturnType<Age['fields']>;
const age = {
    fields: (): AgeField => ({
        // id: [idCondition],
        uuid: [],
        ageFrom: [requiredCondition],
        ageTo: [requiredCondition],
        value: [requiredCondition],
    }),
};

type Ages = ArraySchema<PartialForm<AgeFormProps>>;
type AgesField = ReturnType<Ages['member']>;
const ages: Ages = {
    keySelector: (a) => a.uuid,
    member: (): AgesField => age,
};

type Strata = ObjectSchema<PartialForm<StrataFormProps>>;
type StrataField = ReturnType<Strata['fields']>;
const strata = {
    fields: (): StrataField => ({
        // id: [idCondition],
        uuid: [],
        date: [requiredStringCondition],
        value: [requiredCondition],
    }),
};

type Stratas = ArraySchema<PartialForm<StrataFormProps>>;
type StratasField = ReturnType<Stratas['member']>;
const stratas: Stratas = {
    keySelector: (s) => s.uuid,
    member: (): StratasField => strata,
};

type GeoLocation = ObjectSchema<PartialForm<GeoLocationFormProps>>;
type GeoLocationField = ReturnType<GeoLocation['fields']>;
const geoLocation = {
    fields: (): GeoLocationField => ({
        // id: [idCondition],
        uuid: [],
        accuracy: [requiredCondition],
        identifier: [requiredCondition],
        reportedName: [requiredCondition],

        alternativeNames: [],
        boundingBox: [],
        city: [],
        className: [],
        country: [],
        countryCode: [],
        displayName: [],
        houseNumbers: [],
        importance: [],
        lat: [],
        lon: [],
        moved: [],
        name: [],
        nameSuffix: [],
        osmId: [],
        osmType: [],
        placeRank: [],
        rank: [],
        state: [],
        street: [],
        type: [],
        wikiData: [],
        wikipedia: [],
    }),
};

type GeoLocations = ArraySchema<PartialForm<GeoLocationFormProps>>;
type GeoLocationsField = ReturnType<GeoLocations['member']>;
const geoLocations: GeoLocations = {
    keySelector: (a) => a.uuid,
    member: (): GeoLocationsField => geoLocation,
};

type Figure = ObjectSchema<PartialForm<FigureFormProps>>;
type FigureField = ReturnType<Figure['fields']>;
const figure: Figure = {
    fields: (value): FigureField => {
        let basicFields: FigureField = {
            uuid: [],
            id: [idCondition],
            district: [requiredStringCondition],
            excerptIdu: [],
            includeIdu: [],
            isDisaggregated: [],
            locationCamp: [],
            locationNonCamp: [],
            quantifier: [requiredCondition],
            reported: [requiredCondition],
            role: [requiredCondition],
            startDate: [requiredStringCondition],
            country: [requiredCondition],
            endDate: [],
            term: [requiredCondition],
            town: [requiredStringCondition],
            type: [requiredCondition],
            unit: [requiredCondition],
            geoLocations,

            householdSize: [clearCondition],

            ageJson: [clearCondition, arrayCondition],
            strataJson: [clearCondition, arrayCondition],
            conflict: [clearCondition],
            conflictCommunal: [clearCondition],
            conflictCriminal: [clearCondition],
            conflictOther: [clearCondition],
            conflictPolitical: [clearCondition],
            displacementRural: [clearCondition],
            displacementUrban: [clearCondition],
            sexFemale: [clearCondition],
            sexMale: [clearCondition],
        };

        if (value.unit === 'HOUSEHOLD') {
            basicFields = {
                ...basicFields,
                householdSize: [requiredCondition],
            };
        }

        if (value.isDisaggregated) {
            basicFields = {
                ...basicFields,
                ageJson: ages,
                strataJson: stratas,
                conflict: [],
                conflictCommunal: [],
                conflictCriminal: [],
                conflictOther: [],
                conflictPolitical: [],
                displacementRural: [],
                displacementUrban: [],
                sexFemale: [],
                sexMale: [],
            };
        }

        return basicFields;
    },
};

type Figures = ArraySchema<PartialForm<FigureFormProps>>;
type FiguresMember = ReturnType<Figures['member']>;
const figures: Figures = {
    keySelector: (fig) => fig.uuid,
    member: (): FiguresMember => figure,
};

type PartialFormValues = PartialForm<FormValues>;
type Entry = ObjectSchema<PartialFormValues>;
type EntryFields = ReturnType<Entry['fields']>;

export const schema: Schema<PartialFormValues> = {
    fields: (): EntryFields => ({
        reviewers: [],
        event: [requiredStringCondition],
        details,
        analysis,
        figures,
    }),
};

export const initialFormValues: PartialFormValues = {
    event: '',
    reviewers: [],
    details: {
        url: '',
        document: '',
        preview: '',
        articleTitle: '',
        source: '',
        publisher: '',
        publishDate: '',
        isConfidential: false,
        sourceExcerpt: '',
    },
    analysis: {
        idmcAnalysis: '',
        calculationLogic: '',
        tags: [],
        caveats: '',
    },
    figures: [],
};
