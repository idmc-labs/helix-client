import type { Schema } from '#utils/schema';
import {
    requiredStringCondition,
    requiredCondition,
    urlCondition,
    idCondition,
} from '#utils/validation';

import { PartialForm } from '#types';
import {
    FormValues,
    StrataFormProps,
    AgeFormProps,
} from './types';

type PartialFormValues = PartialForm<FormValues>;

export const schema: Schema<PartialFormValues> = {
    fields: () => ({
        reviewers: [],
        event: [requiredStringCondition],
        details: {
            fields: () => ({
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
        },
        analysis: {
            fields: () => ({
                idmcAnalysis: [requiredStringCondition],
                calculationLogic: [],
                tags: [],
                caveats: [],
            }),
        },
        figures: {
            keySelector: (figure) => figure.uuid,
            member: () => ({
                fields: (value) => {
                    const basicFields = {
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
                    };

                    const disaggregatedFields = {
                        ageJson: {
                            keySelector: (age: AgeFormProps) => age.uuid,
                            member: () => ({
                                fields: () => ({
                                    id: [idCondition],
                                    uuid: [],
                                    ageFrom: [requiredCondition],
                                    ageTo: [requiredCondition],
                                    value: [requiredCondition],
                                }),
                            }),
                        },
                        strataJson: {
                            keySelector: (strata: StrataFormProps) => strata.uuid,
                            member: () => ({
                                fields: () => ({
                                    id: [idCondition],
                                    uuid: [],
                                    date: [requiredStringCondition],
                                    value: [requiredCondition],
                                }),
                            }),
                        },
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

                    if (value.isDisaggregated) {
                        return {
                            ...basicFields,
                            ...disaggregatedFields,
                        };
                    }

                    return basicFields;
                },
            }),
        },
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
