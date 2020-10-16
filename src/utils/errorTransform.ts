import { listToMap, isDefined, isNotDefined } from '@togglecorp/fujs';

// eslint-disable-next-line @typescript-eslint/ban-types
type BaseError = object;

export interface ObjectError {
    field: string;
    messages?: string;
    objectErrors?: ObjectError[];
    arrayErrors?: ArrayError[];
}

interface ArrayError {
    key: string;
    messages?: string;
    objectErrors: ObjectError[];
}

function transformObject(errors: ObjectError[] | undefined): BaseError | undefined {
    if (isNotDefined(errors)) {
        return undefined;
    }

    const topLevelError = errors.find((error) => error.field === 'nonFieldErrors');
    const fieldErrors = errors.filter((error) => error.field !== 'nonFieldErrors');

    return {
        $internal: topLevelError?.messages,
        fields: listToMap(
            fieldErrors,
            (error) => error.field,
            (error) => {
                if (isDefined(error.messages)) {
                    return error.messages;
                }
                if (isDefined(error.objectErrors)) {
                    return transformObject(error.objectErrors);
                }
                if (isDefined(error.arrayErrors)) {
                    transformArray(error.arrayErrors);
                }
                return undefined;
            },
        ),
    };
}

function transformArray(errors: ArrayError[] | undefined): BaseError | undefined {
    if (isNotDefined(errors)) {
        return undefined;
    }

    const topLevelError = errors.find((error) => error.key === 'nonMemberErrors');
    const memberErrors = errors.filter((error) => error.key !== 'nonMemberErrors');

    return {
        $internal: topLevelError?.messages,
        members: listToMap(
            memberErrors,
            (error) => error.key,
            (error) => transformObject(error.objectErrors),
        ),
    };
}

export const transformToFormError = transformObject;

// const errors: ObjectError[] = <get_from_server>;