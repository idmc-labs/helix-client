import { PurgeNull } from '#types';

type Schema<T> = (
    Exclude<T, undefined> extends unknown[]
        ? ArraySchema<Exclude<T, undefined>[number]> | LiteralSchema<T>
        : (
            // eslint-disable-next-line @typescript-eslint/ban-types
            Exclude<T, undefined> extends object
                ? ObjectSchema<Exclude<T, undefined>> | LiteralSchema<T>
                : LiteralSchema<T>
          )
);

type LiteralSchema<T> = ((value: T) => string | undefined)[];

type ArraySchema<T> = {
    validation?: (value: T) => string | undefined;
    member: (value: T) => (Schema<T> & { $identifier?: string });
    keySelector: (value: T) => string | number;
}

type ObjectSchema<T> = {
    validation?: (value: T) => string | undefined;
    fields: (value: T) => ({ [K in keyof T]?: Schema<T[K]> } & { $identifier?: string });
}

type Error<T> = (
    Exclude<T, undefined> extends unknown[]
        ? ArrayError<Exclude<T, undefined>[number]>
        : (
            // eslint-disable-next-line @typescript-eslint/ban-types
            Exclude<T, undefined> extends object
                ? ObjectError<Exclude<T, undefined>>
                : LeafError
          )
);

type LeafError = string | undefined;

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
    schema: Schema<T>,
    settings?: { nullable: boolean },
): T;

export function accumulateErrors<T>(
    obj: T,
    schema: Schema<T>,
): Error<T> | undefined;

export function accumulateDifferentialErrors<T>(
    oldObj: T,
    newObj: T,
    oldError: Error<T> | undefined,
    schema: Schema<T>,
): Error<T> | undefined;

export function analyzeErrors<T>(errors: Error<T> | undefined): boolean;

export function removeNull<T>(data: T | undefined | null): PurgeNull<T>;

export { Schema, Error };
