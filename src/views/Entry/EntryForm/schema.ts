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
    CategoryOptions,
    TermOptions,
} from './types';

type Details = ObjectSchema<PartialForm<DetailsFormProps>>;
type DetailsField = ReturnType<Details['fields']>;
const details: Details = {
    fields: (): DetailsField => ({
        associatedParkedItem: [],
        articleTitle: [requiredStringCondition],
        publishDate: [requiredStringCondition],
        sources: [requiredCondition, arrayCondition],
        publishers: [requiredCondition, arrayCondition],
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
        tags: [arrayCondition],
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
const figure = (categories: CategoryOptions, terms: TermOptions): Figure => ({
    fields: (value): FigureField => {
        let basicFields: FigureField = {
            uuid: [],
            id: [idCondition],
            excerptIdu: [],
            includeIdu: [],
            isDisaggregated: [],
            // TODO: identify if it is housing related term
            quantifier: [requiredCondition],
            reported: [requiredCondition],
            role: [requiredCondition],
            startDate: [requiredStringCondition],
            startDateAccuracy: [],
            country: [requiredCondition],
            term: [requiredCondition],
            category: [requiredCondition],
            unit: [requiredCondition],
            geoLocations,

            endDate: [clearCondition],
            endDateAccuracy: [clearCondition],
            householdSize: [clearCondition],

            disaggregationLocationCamp: [],
            disaggregationLocationNonCamp: [],
            disaggregationAgeJson: [clearCondition, arrayCondition],
            disaggregationStrataJson: [clearCondition, arrayCondition],
            disaggregationConflict: [clearCondition],
            disaggregationConflictCommunal: [clearCondition],
            disaggregationConflictCriminal: [clearCondition],
            disaggregationConflictOther: [clearCondition],
            disaggregationConflictPolitical: [clearCondition],
            disaggregationDisplacementRural: [clearCondition],
            disaggregationDisplacementUrban: [clearCondition],
            disaggregationSexFemale: [clearCondition],
            disaggregationSexMale: [clearCondition],
            isHousingDestruction: [clearCondition],
        };

        if (value.category) {
            const category = categories?.find((cat) => (
                cat.id === value.category && cat.type === 'FLOW'
            ));
            if (category) {
                basicFields = {
                    ...basicFields,
                    endDate: [requiredCondition],
                    endDateAccuracy: [],
                };
            }
        }

        if (value.unit === 'HOUSEHOLD') {
            basicFields = {
                ...basicFields,
                householdSize: [requiredCondition],
            };
        }

        if (value.isDisaggregated) {
            basicFields = {
                ...basicFields,
                disaggregationAgeJson: ages,
                disaggregationStrataJson: stratas,
                disaggregationConflict: [],
                disaggregationConflictCommunal: [],
                disaggregationConflictCriminal: [],
                disaggregationConflictOther: [],
                disaggregationConflictPolitical: [],
                disaggregationDisplacementRural: [],
                disaggregationDisplacementUrban: [],
                disaggregationSexFemale: [],
                disaggregationSexMale: [],
                disaggregationLocationCamp: [],
                disaggregationLocationNonCamp: [],
            };
        }

        if (value.term) {
            const selectedTerm = terms?.find((item) => (
                item.id === value.term && item.isHousingRelated === true
            ));
            if (selectedTerm) {
                basicFields = {
                    ...basicFields,
                    isHousingDestruction: [],
                };
            }
        }
        return basicFields;
    },
});

type Figures = ArraySchema<PartialForm<FigureFormProps>>;
type FiguresMember = ReturnType<Figures['member']>;
const figures = (categories: CategoryOptions, terms: TermOptions): Figures => ({
    keySelector: (fig) => fig.uuid,
    member: (): FiguresMember => figure(categories, terms),
});

type PartialFormValues = PartialForm<FormValues>;
type Entry = ObjectSchema<PartialFormValues>;
type EntryFields = ReturnType<Entry['fields']>;

export const schema = (
    categories: CategoryOptions,
    terms: TermOptions,
): Schema<PartialFormValues> => ({
    fields: (): EntryFields => ({
        reviewers: [],
        event: [requiredStringCondition],
        details,
        analysis,
        figures: figures(categories, terms),
    }),
});

export const initialFormValues: PartialFormValues = {
    event: '',
    reviewers: [],
    details: {
        url: '',
        document: '',
        preview: '',
        articleTitle: '',
        sources: [],
        publishers: [],
        publishDate: '',
        isConfidential: false,
        sourceExcerpt: '',
        associatedParkedItem: undefined,
    },
    analysis: {
        idmcAnalysis: '',
        calculationLogic: '',
        tags: [],
        caveats: '',
    },
    figures: [],
};
