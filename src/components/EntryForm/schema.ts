import type { Schema, ArraySchema, ObjectSchema } from '#utils/schema';
import {
    requiredStringCondition,
    requiredCondition,
    urlCondition,
    idCondition,
    clearCondition,
} from '#utils/validation';

import { PartialForm } from '#types';
import {
    AgeFormProps,
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

type Figure = ObjectSchema<PartialForm<FigureFormProps>>;
type FigureField = ReturnType<Figure['fields']>;
const figure: Figure = {
    fields: (value): FigureField => {
        const basicFields: FigureField = {
            uuid: [],
            id: [idCondition],
            district: [requiredStringCondition],
            excerptIdu: [],
            householdSize: [requiredCondition],
            includeIdu: [],
            isDisaggregated: [],
            locationCamp: [],
            locationNonCamp: [],
            quantifier: [requiredCondition],
            reported: [requiredCondition],
            role: [requiredCondition],
            startDate: [requiredStringCondition],
            term: [requiredCondition],
            town: [requiredStringCondition],
            type: [requiredCondition],
            unit: [requiredCondition],

            ageJson: [clearCondition],
            strataJson: [clearCondition],
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

        if (value.isDisaggregated) {
            const completeFields: FigureField = {
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
            return completeFields;
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
