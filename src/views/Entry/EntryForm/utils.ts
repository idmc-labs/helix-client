import { v4 as uuidv4 } from 'uuid';
import { Error, removeNull } from '@togglecorp/toggle-form';

import { transformToFormError } from '#utils/errorTransform';
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

export function transformErrorForEntry(
    errors: NonNullable<CreateEntryMutation['createEntry']>['errors'],
) {
    const formError = transformToFormError(removeNull(errors)) as Error<FormType>;

    const detailsError = {
        $internal: undefined,
        fields: {
            associatedParkedItem: formError?.fields?.associatedParkedItem,
            articleTitle: formError?.fields?.articleTitle,
            publishDate: formError?.fields?.publishDate,
            publishers: formError?.fields?.publishers,
            sources: formError?.fields?.sources,
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
                const ageOrGeoFields = frags[1].split(kvs);

                if (ageOrGeoFields[0] === AGE_KEY) {
                    [, review.ageId] = ageOrGeoFields;
                } else if (ageOrGeoFields[0] === GEOLOCATION_KEY) {
                    [, review.geoLocation] = ageOrGeoFields;
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
    // FIXME: This is also unsafe. We need to first validate if each required field is present.
}

export function getReviewInputName({
    figure,
    ageId,
    geoLocation,
    field,
}: Omit<ReviewFields, 'value' | 'comment'>) {
    // FIXME: why is the return type not just string?
    let name;

    if (!figure) {
        name = field;
    } else if (ageId) {
        name = `${FIGURE_KEY}${kvs}${figure}${fs}${AGE_KEY}${kvs}${ageId}${fs}${field}`;
    } else if (geoLocation) {
        name = `${FIGURE_KEY}${kvs}${figure}${fs}${GEOLOCATION_KEY}${kvs}${geoLocation}${fs}${field}`;
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
            field,
            value,
            geoLocation,

            comment,
        } = review;

        const key = getReviewInputName({
            figure,
            ageId,
            field,
            geoLocation,
        });

        reviewMap[key] = { key, value, comment };
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
        comment: review[name]?.comment,
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
        comment: review[name]?.comment,
    };
}

export function getGeoLocationReviewProps(
    review: ReviewInputFields,
    figure: string,
    geoLocation: string,
    field: string,
) {
    const name = getReviewInputName({
        figure,
        field,
        geoLocation,
    });

    return {
        name,
        value: review[name]?.value,
        comment: review[name]?.comment,
    };
}

// Remove id and generate new uuid
export function ghost<T extends { id?: string; uuid: string }>(value: T): T {
    return {
        ...value,
        id: undefined,
        uuid: uuidv4(),
    };
}
