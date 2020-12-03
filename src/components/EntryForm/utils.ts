import type { Error } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';
import { removeNull } from '#utils/schema';

import {
    CreateEntryMutation,
} from '#generated/types';
import { PartialForm } from '#types';
import {
    FormType,
    FormValues,
} from './types';

type PartialFormValues = PartialForm<FormValues>;

export function transformErrorForEntry(errors: NonNullable<CreateEntryMutation['createEntry']>['errors']) {
    const formError = transformToFormError(removeNull(errors)) as Error<FormType>;

    const detailsError = {
        $internal: undefined,
        fields: {
            articleTitle: formError?.fields?.articleTitle,
            publishDate: formError?.fields?.publishDate,
            publisher: formError?.fields?.publisher,
            source: formError?.fields?.source,
            sourceExcerpt: formError?.fields?.sourceExcerpt,
            url: formError?.fields?.url,
            document: formError?.fields?.document,
            preview: formError?.fields?.preview,
            isConfidential: formError?.fields?.isConfidential,
        },
    };
    const analysisError = {
        $internal: undefined,
        fields: {
            idmcAnalysis: formError?.fields?.idmcAnalysis,
            calculationLogic: formError?.fields?.calculationLogic,
            tags: formError?.fields?.tags,
            caveats: formError?.fields?.caveats,
        },
    };

    const newError = {
        $internal: formError.$internal,
        fields: {
            reviewers: formError?.fields?.reviewers,
            figures: formError?.fields?.figures,
            event: formError?.fields?.event,
            details: detailsError,
            analysis: analysisError,
        },
    } as Error<PartialFormValues>;
    return newError;
}

interface ReviewFields {
    value?: string;
    figure?: string;
    ageId?: string;
    strataId?: string;
    field?: string;
}

const FIGURE_KEY = 'fig';
const AGE_KEY = 'age';
const STRATA_KEY = 'strata';

export function getReviewList(reviewMap: { [key: string]: string }) {
    const keys = Object.keys(reviewMap);

    const reviewList = keys.map((rk: string) => {
        const review: ReviewFields = {
            value: reviewMap[rk],
        };

        const frags = rk.split('-');

        if (frags.length > 1) {
            const figureFields = frags[0].split(':');
            review.figure = figureFields[1];

            if (frags.length === 3) {
                const ageOrStrataFields = frags[1].split(':');

                if (ageOrStrataFields[0] === AGE_KEY) {
                    review.ageId = ageOrStrataFields[1];
                } else if (ageOrStrataFields[0] === STRATA_KEY) {
                    review.strataId = ageOrStrataFields[1];
                }
            } else {
                review.field = frags[1];
            }
        } else {
            review.field = rk;
        }

        return review;
    });

    return reviewList;
}

export function getReviewInputName({ figure, ageId, strataId, field }: ReviewFields) {
    let name;

    if (!figure) {
        name = field;
    } else if (ageId) {
        name = `${FIGURE_KEY}:${figure}-${AGE_KEY}:${ageId}-${field}`;
    } else if (strataId) {
        name = `${FIGURE_KEY}:${figure}-${STRATA_KEY}:${strataId}-${field}`;
    } else {
        name = `${FIGURE_KEY}:${figure}-${field}`;
    }

    return name;
}

export function getReviewInputMap(reviewList: ReviewFields[]) {
    const reviewMap: {
        [key: string]: string;
    } = {};

    reviewList.forEach((review) => {
        const {
            figure,
            ageId,
            strataId,
            field,
            value,
        } = review;

        const key = getReviewInputName({
            figure,
            ageId,
            strataId,
            field,
        }) as string;

        reviewMap[key] = value as string;
    });

    return reviewMap;
}

export function getFigureReviewProps(
    review: {
        [key: string]: string;
    },
    figure: string,
    field: string,
) {
    const name = getReviewInputName({
        figure,
        field,
    }) as string;

    return {
        name,
        value: review[name],
    };
}
