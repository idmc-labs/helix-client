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
} from './types';
import {
    isFlowCategory,
    isHousingCategory,
    isDisplacementCategory,
} from '#utils/selectionConstants';
import {
    Unit,
    Figure_Terms as FigureTerms,
    Figure_Category_Types as FigureCategoryTypes,
} from '#generated/types';

const household: Unit = 'HOUSEHOLD';

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
    }),
};

type Age = ObjectSchema<PartialForm<AgeFormProps>>;
type AgeField = ReturnType<Age['fields']>;
const age = {
    fields: (): AgeField => ({
        id: [idCondition],
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
const figure: Figure = {
    fields: (value): FigureField => {
        let basicFields: FigureField = {
            uuid: [],
            id: [idCondition],
            calculationLogic: [requiredStringCondition],
            tags: [arrayCondition],
            caveats: [],
            sourceExcerpt: [],
            excerptIdu: [],
            includeIdu: [],
            isDisaggregated: [],
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
            disaggregationAge: [nullCondition, arrayCondition],

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

        if (isFlowCategory(value?.category as (FigureCategoryTypes | undefined))) {
            basicFields = {
                ...basicFields,
                endDateAccuracy: [],
            };
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
                disaggregationAge: ages,
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

        if (isHousingCategory(value?.term as (FigureTerms | undefined))) {
            basicFields = {
                ...basicFields,
                isHousingDestruction: [],
            };
        }
        if (isDisplacementCategory(value?.term as (FigureTerms | undefined))) {
            basicFields = {
                ...basicFields,
                displacementOccurred: [],
            };
        }
        return basicFields;
    },
};

type Figures = ArraySchema<PartialForm<FigureFormProps>>;
type FiguresMember = ReturnType<Figures['member']>;
const figures:Figures = {
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
        analysis: analysisLogic,
        figures,
    }),
};

export const initialFormValues: PartialFormValues = {
    reviewers: [],
    details: {
        sources: [],
        publishers: [],
        isConfidential: false,
    },
    analysis: {},
    figures: [],
};
