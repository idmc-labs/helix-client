function isDefined<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
}

export function requiredCondition(value: unknown) {
    return !isDefined(value)
        ? 'The field is required'
        : undefined;
}

export function requiredStringCondition(value: string | undefined | null) {
    return !isDefined(value) || value.trim() === ''
        ? 'The field is required'
        : undefined;
}

export function blacklistCondition<T>(x: T[]) {
    return (value: T | null | undefined) => (
        isDefined(value) && x.includes(value)
            ? `The field cannot be ${value}`
            : undefined
    );
}

export function whitelistCondition<T>(x: T[]) {
    return (value: T | null | undefined) => (
        isDefined(value) && !x.includes(value)
            ? `The field cannot be ${value}`
            : undefined
    );
}

export function lengthGreaterThanCondition(x: number) {
    return (value: string | unknown[] | null | undefined) => (
        isDefined(value) && value.length <= x
            ? `Length must be greater than ${x}`
            : undefined
    );
}
export function lengthSmallerThanCondition(x: number) {
    return (value: string | unknown[] | null | undefined) => (
        isDefined(value) && value.length > x
            ? `Length must be smaller than ${x}`
            : undefined
    );
}

export function greaterThanCondition(x: number) {
    return (value: number | null | undefined) => (
        isDefined(value) && value <= x
            ? `Field must be greater than ${x}`
            : undefined
    );
}
export function smallerThanCondition(x: number) {
    return (value: number | undefined) => (
        isDefined(value) && value > x
            ? `The field must be smaller than ${x}`
            : undefined
    );
}

type Validation<T> = (
    Exclude<T, undefined> extends unknown[]
        ? ArrayValidation<Exclude<T, undefined>[number]>
        : (
            // eslint-disable-next-line @typescript-eslint/ban-types
            Exclude<T, undefined> extends object
                ? ObjectValidation<Exclude<T, undefined>>
                : LiteralValidation<T>
          )
);

type LiteralValidation<T> = ((value: T) => string | undefined)[];

type ArrayValidation<T> = {
    member: Validation<T>
}

type ObjectValidation<T> = {
    fields: {
        // FIXME: make this optional
        [K in keyof T]?: Validation<T[K]>;
    };
}

export default Validation;
