type Schema<T> = (
    Exclude<T, undefined> extends unknown[]
        ? ArraySchema<Exclude<T, undefined>[number]>
        : (
            // eslint-disable-next-line @typescript-eslint/ban-types
            Exclude<T, undefined> extends object
                ? ObjectSchema<Exclude<T, undefined>>
                : LiteralSchema<T>
          )
);

type LiteralSchema<T> = ((value: T) => string | undefined)[];

type ArraySchema<T> = {
    validation?: (value: T) => string | undefined;
    member: Schema<T>
}

type ObjectSchema<T> = {
    validation?: (value: T) => string | undefined;
    fields: {
        // FIXME: make this optional
        [K in keyof T]?: Schema<T[K]>;
    };
}

type Error<T> = (
    Exclude<T, undefined> extends unknown[]
        ? ArrayError<Exclude<T, undefined>[number]>
        : (
            // eslint-disable-next-line @typescript-eslint/ban-types
            Exclude<T, undefined> extends object
                ? ObjectError<Exclude<T, undefined>>
                : LiteralError
          )
);

type LiteralError = string | undefined;

type ArrayError<T> = {
    $internal?: string;
    members?: {
        [key: string]: Error<T> | undefined;
    }
};

type ObjectError<T> = {
    $internal?: string;
    fields?: {
        [K in keyof T]?: Error<T[K]> | undefined;
    }
};

export function accumulateValues<T>(
    obj: T,
    schema: Schema<T>, settings?: { noFalsyValues: boolean, falsyValue: undefined | null },
): T;

export function accumulateErrors<T>(
    obj: T,
    schema: Schema<T>, settings?: { noFalsyValues: boolean, falsyValue: undefined | null },
): Error<T> | undefined;

export function accumulateDifferentialErrors<T>(
    oldObj: T,
    newObj: T,
    oldError: Error<T> | undefined,
    schema: Schema<T>, settings?: { noFalsyValues: boolean, falsyValue: undefined | null },
): Error<T> | undefined;

export function analyzeErrors<T>(errors: Error<T> | undefined): boolean;

export { Schema, Error };
