type Maybe<T> = T | undefined | null;

function isDefined<T>(value: Maybe<T>): value is T {
    return value !== undefined && value !== null;
}

export function requiredCondition(value: unknown) {
    return !isDefined(value)
        ? 'The field is required'
        : undefined;
}

export function requiredStringCondition(value: Maybe<string>) {
    return !isDefined(value) || value.trim() === ''
        ? 'The field is required'
        : undefined;
}

export function blacklistCondition<T>(x: T[]) {
    return (value: Maybe<T>) => (
        isDefined(value) && x.includes(value)
            ? `The field cannot be ${value}`
            : undefined
    );
}

export function whitelistCondition<T>(x: T[]) {
    return (value: Maybe<T>) => (
        isDefined(value) && !x.includes(value)
            ? `The field cannot be ${value}`
            : undefined
    );
}

export function lengthGreaterThanCondition(x: number) {
    return (value: Maybe<string | unknown[]>) => (
        isDefined(value) && value.length <= x
            ? `Length must be greater than ${x}`
            : undefined
    );
}
export function lengthSmallerThanCondition(x: number) {
    return (value: Maybe<string | unknown[]>) => (
        isDefined(value) && value.length > x
            ? `Length must be smaller than ${x}`
            : undefined
    );
}

export function greaterThanCondition(x: number) {
    return (value: Maybe<number>) => (
        isDefined(value) && value <= x
            ? `Field must be greater than ${x}`
            : undefined
    );
}
export function smallerThanCondition(x: number) {
    return (value: Maybe<number>) => (
        isDefined(value) && value > x
            ? `The field must be smaller than ${x}`
            : undefined
    );
}
