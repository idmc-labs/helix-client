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

function transformObject(errors: (ObjectError | undefined)[] | undefined): BaseError | undefined {
    if (isNotDefined(errors)) {
        return undefined;
    }

    const validErrors = errors.filter(isDefined);

    const topLevelError = validErrors.find((error) => error.field === 'nonFieldErrors');
    const fieldErrors = validErrors.filter((error) => error.field !== 'nonFieldErrors');

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

/*
type Clean<T> = (
    T extends (infer Z)[]
        ? Clean<Z>[]
        : (
            T extends object
                ? { [K in keyof T]: Clean<T[K]> }
                : (T extends null ? undefined : T)
        )
)

type testType = {
    numbers?: (null | number)[] | null; name: number | null;
    age: number;
    meta: { username: string | null } | null;
}
type test = Clean<testType>
*/
