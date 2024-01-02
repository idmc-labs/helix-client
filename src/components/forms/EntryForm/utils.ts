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
function getReviewInputName({
    figure,
    age,
    geoLocation,
    field,
}: {
    field: string;
    figure?: string;
    age?: string;
    geoLocation?: string;
}) {
    let name: string;

    if (!figure) {
        name = field;
    } else if (age) {
        name = `${FIGURE_KEY}${kvs}${figure}${fs}${AGE_KEY}${kvs}${age}${fs}${field}`;
    } else if (geoLocation) {
        name = `${FIGURE_KEY}${kvs}${figure}${fs}${GEOLOCATION_KEY}${kvs}${geoLocation}${fs}${field}`;
    } else {
        name = `${FIGURE_KEY}${kvs}${figure}${fs}${field}`;
    }
    // FIXME: We should also add a key for field. It becomes a lot easier

    return name;
}

export function getFigureReviewProps(
    figure: string,
    field: string,
) {
    const name = getReviewInputName({
        figure,
        field,
    });

    return {
        name,
    };
}

export function getAgeReviewProps(
    figure: string,
    age: string,
    field: string,
) {
    const name = getReviewInputName({
        figure,
        field,
        age,
    });

    return {
        name,
    };
}

export function getGeoLocationReviewProps(
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
