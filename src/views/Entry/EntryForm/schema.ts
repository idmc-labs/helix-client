import {
    arrayCondition,
    requiredStringCondition,
    requiredCondition,
    urlCondition,
    idCondition,
    nullCondition,
    integerCondition,
    greaterThanOrEqualToCondition,
    ObjectSchema,
    Schema,
    ArraySchema,
} from '@togglecorp/toggle-form';

import { PartialForm } from '#types';
import {
    AgeFormProps,
    GeoLocationFormProps,
    AnalysisFormProps,
    DetailsFormProps,
    FigureFormProps,
    FormValues,
    CategoryOptions,
    TermOptions,
} from './types';
import {
    Unit,
    FigureCategoryType,
} from '#generated/types';

const household: Unit = 'HOUSEHOLD';
const flow: FigureCategoryType = 'FLOW';

type Details = ObjectSchema<PartialForm<DetailsFormProps>>;
type DetailsField = ReturnType<Details['fields']>;
const details: Details = {
    fields: (value): DetailsField => {
        let basicFields: DetailsField = {
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

            documentUrl: [nullCondition],
        };
        if (value?.document) {
            basicFields = {
                ...basicFields,
                documentUrl: [urlCondition],
            };
        }

        return basicFields;
    },
};

type Analysis = ObjectSchema<PartialForm<AnalysisFormProps>>;
type AnalysisField = ReturnType<Analysis['fields']>;
const analysisLogic: Analysis = {
    fields: (): AnalysisField => ({
        idmcAnalysis: [],
        calculationLogic: [requiredStringCondition],
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
        category: [requiredCondition],
        sex: [],
        value: [requiredCondition, integerCondition, greaterThanOrEqualToCondition(0)],
    }),
};

type Ages = ArraySchema<PartialForm<AgeFormProps>>;
type AgesField = ReturnType<Ages['member']>;
const ages: Ages = {
    keySelector: (a) => a.uuid,
    member: (): AgesField => age,
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
    // FIXME: the typings is not correct. need to update library
    validation: (value) => {
        if ((value?.length ?? 0) <= 0) {
            return 'At least one location should be added.';
        }
        return undefined;
    },
};

type Figure = ObjectSchema<PartialForm<FigureFormProps>>;
type FigureField = ReturnType<Figure['fields']>;
const figure = (categories: CategoryOptions, terms: TermOptions): Figure => ({
    fields: (value): FigureField => {
        let basicFields: FigureField = {
            uuid: [],
            shadow: [],
            id: [idCondition],
            excerptIdu: [],
            includeIdu: [],
            isDisaggregated: [],
            // TODO: identify if it is housing related term
            quantifier: [requiredCondition],
            reported: [requiredCondition, integerCondition, greaterThanOrEqualToCondition(0)],
            role: [requiredCondition],
            startDate: [requiredStringCondition],
            startDateAccuracy: [],
            country: [requiredCondition],
            term: [requiredCondition],
            category: [requiredCondition],
            unit: [requiredCondition],
            geoLocations,

            endDate: [requiredCondition],
            endDateAccuracy: [nullCondition],
            householdSize: [nullCondition],

            disaggregationLocationCamp: [nullCondition],
            disaggregationLocationNonCamp: [nullCondition],
            disaggregationDisability: [nullCondition],
            disaggregationIndigenousPeople: [nullCondition],
            disaggregationDisplacementRural: [nullCondition],
            disaggregationDisplacementUrban: [nullCondition],
            disaggregationAgeJson: [nullCondition, arrayCondition],

            isHousingDestruction: [nullCondition],
            displacementOccurred: [nullCondition],

            // The fields below are hidden on client (don't know what to do)
            disaggregationConflict: [nullCondition],
            disaggregationConflictCommunal: [nullCondition],
            disaggregationConflictCriminal: [nullCondition],
            disaggregationConflictOther: [nullCondition],
            disaggregationConflictPolitical: [nullCondition],
            disaggregationSexFemale: [nullCondition],
            disaggregationSexMale: [nullCondition],
            disaggregationLgbtiq: [nullCondition],
        };

        if (value?.category) {
            const category = categories?.find((cat) => (
                cat.id === value.category && cat.type === flow
            ));
            if (category) {
                basicFields = {
                    ...basicFields,
                    endDateAccuracy: [],
                };
            }
        }

        if (value?.unit === household) {
            basicFields = {
                ...basicFields,
                householdSize: [requiredCondition],
            };
        }

        if (value?.isDisaggregated) {
            basicFields = {
                ...basicFields,
                disaggregationAgeJson: ages,
                disaggregationDisplacementRural: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationDisplacementUrban: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationLocationCamp: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationLocationNonCamp: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationDisability: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationIndigenousPeople: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],

                // The fields below are hidden on client
                disaggregationConflict: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationConflictCommunal: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationConflictCriminal: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationConflictOther: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationConflictPolitical: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationSexFemale: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationSexMale: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
                disaggregationLgbtiq: [
                    integerCondition, greaterThanOrEqualToCondition(0),
                ],
            };
        }

        if (value?.term) {
            const selectedTerm = terms?.find((item) => (
                item.id === value.term
            ));
            if (selectedTerm && selectedTerm.isHousingRelated) {
                basicFields = {
                    ...basicFields,
                    isHousingDestruction: [],
                };
            }
            if (selectedTerm && selectedTerm.displacementOccur) {
                basicFields = {
                    ...basicFields,
                    displacementOccurred: [],
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
        analysis: analysisLogic,
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
