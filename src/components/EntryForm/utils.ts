import type { Error } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';
import { removeNull } from '#utils/schema';

import {
    CreateEntryMutation,
} from '#generated/types';
import {
    PartialForm,
} from '#types';
import {
    FormType,
    FormValues,
    ReviewFields,
    ReviewInputFields,
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

const fs = ','; // field separator
const kvs = ':'; // key-value separator

const FIGURE_KEY = 'fig';
const AGE_KEY = 'age';
const STRATA_KEY = 'strata';
const GEOLOCATION_KEY = 'geoLocation';

// [...'ram:12;shyam:14,kiran:12'.matchAll(/(\w+):([\d\w-]+)/g)]

export function getReviewList(reviewMap: NonNullable<ReviewInputFields[string]>[]) {
    const reviewList = reviewMap.map((item) => {
        const review: Partial<ReviewFields> = {
            value: item.value,
        };

        const frags = item.key.split(fs);

        if (frags.length > 1) {
            const figureFields = frags[0].split(kvs);
            [, review.figure] = figureFields;

            if (frags.length === 3) {
                const ageOrStrataOrGeoFields = frags[1].split(kvs);

                if (ageOrStrataOrGeoFields[0] === AGE_KEY) {
                    [, review.ageId] = ageOrStrataOrGeoFields;
                } else if (ageOrStrataOrGeoFields[0] === STRATA_KEY) {
                    [, review.strataId] = ageOrStrataOrGeoFields;
                } else if (ageOrStrataOrGeoFields[0] === STRATA_KEY) {
                    [, review.geoLocationId] = ageOrStrataOrGeoFields;
                }

                [, , review.field] = frags;
            } else {
                [, review.field] = frags;
            }
        } else {
            review.field = item.key;
        }

        return review;
    });

    return reviewList as ReviewFields[];
    // FIXME: Thiis is also unsafe. We need to first validate if each required field is present.
}

export function getReviewInputName({
    figure,
    ageId,
    strataId,
    geoLocationId,
    field,
}: Omit<ReviewFields, 'value'>) {
    // FIXME: why is the return type not just string?
    let name;

    if (!figure) {
        name = field;
    } else if (ageId) {
        name = `${FIGURE_KEY}${kvs}${figure}${fs}${AGE_KEY}${kvs}${ageId}${fs}${field}`;
    } else if (strataId) {
        name = `${FIGURE_KEY}${kvs}${figure}${fs}${STRATA_KEY}${kvs}${strataId}${fs}${field}`;
    } else if (geoLocationId) {
        name = `${FIGURE_KEY}${kvs}${figure}${fs}${GEOLOCATION_KEY}${kvs}${geoLocationId}${fs}${field}`;
    } else {
        name = `${FIGURE_KEY}${kvs}${figure}${fs}${field}`;
    }
    // FIXME: We should also add a key for field. It becomes a lot easier

    return name;
}

export function getReviewInputMap(reviewList: ReviewFields[] | undefined = []) {
    const reviewMap: ReviewInputFields = {};

    // FIXME: Why not use listToMap or reduce?
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
        });

        reviewMap[key] = { key, value };
    });

    return reviewMap;
}

export function getFigureReviewProps(
    review: ReviewInputFields,
    figure: string,
    field: string,
) {
    const name = getReviewInputName({
        figure,
        field,
    });

    return {
        name,
        value: review[name]?.value,
    };
}

export function getAgeReviewProps(
    review: ReviewInputFields,
    figure: string,
    ageId: string,
    field: string,
) {
    const name = getReviewInputName({
        figure,
        field,
        ageId,
    });

    return {
        name,
        value: review[name]?.value,
    };
}

export function getStrataReviewProps(
    review: ReviewInputFields,
    figure: string,
    strataId: string,
    field: string,
) {
    const name = getReviewInputName({
        figure,
        field,
        strataId,
    });

    return {
        name,
        value: review[name]?.value,
    };
}

export function getGeoLocationReviewProps(
    review: ReviewInputFields,
    figure: string,
    geoLocationId: string,
    field: string,
) {
    const name = getReviewInputName({
        figure,
        field,
        geoLocationId,
    });

    return {
        name,
        value: review[name]?.value,
    };
}
