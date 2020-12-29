import {
    CreateEntryMutationVariables,
    CreateAttachmentMutation,
    EntryQuery,
    Entry_Review_Status, // eslint-disable-line camelcase
} from '#generated/types';
import { PurgeNull } from '#types';

// FIXME: use NonNullableRec
// FIXME: move this to types/index.tsx
// NOTE: converts enum to string
type Check<T> = T extends string ? string : undefined;
type EnumFix<T, F> = T extends object[] ? (
    T extends any[] ? EnumFix<T[number], F>[] : T
) : ({
    [K in keyof T]: K extends F ? Check<T[K]> : T[K];
})

// NOTE: change info for FormType
export type FormType = CreateEntryMutationVariables['entry'];

type RawFigure = NonNullable<NonNullable<FormType['figures']>[number]>;
type FixedGeoLocations = EnumFix<RawFigure['geoLocations'], 'accuracy'>;
type FixedFigure = Omit<RawFigure, 'geoLocations'> & { geoLocations: FixedGeoLocations };
export type FigureFormProps = PurgeNull<EnumFix<
    FixedFigure,
    'quantifier' | 'unit' | 'term' | 'type' | 'role'
>> & { id: string };

export type StrataFormProps = NonNullable<NonNullable<FigureFormProps['strataJson']>[number]>;
export type AgeFormProps = NonNullable<NonNullable<FigureFormProps['ageJson']>[number]>;
export type GeoLocationFormProps = NonNullable<NonNullable<FigureFormProps['geoLocations']>[number]>;
export type AnalysisFormProps = PurgeNull<Pick<FormType, 'idmcAnalysis' | 'calculationLogic' | 'tags' | 'caveats'>>;
export type DetailsFormProps = PurgeNull<Pick<FormType, 'articleTitle' | 'publishDate' | 'publisher' | 'source' | 'sourceExcerpt' | 'url' | 'document' | 'preview' | 'isConfidential'>>;

export type FormValues = PurgeNull<Pick<FormType, 'reviewers' | 'event'> & {
    figures: FigureFormProps[];
    analysis: AnalysisFormProps;
    details: DetailsFormProps;
}>

export type Attachment = NonNullable<NonNullable<CreateAttachmentMutation['createAttachment']>['result']>;
export type Preview = { url: string };
export type Reviewing = NonNullable<EntryQuery['entry']>['reviewing'];

// eslint-disable-next-line camelcase
export type EntryReviewStatus = Entry_Review_Status;

export interface ReviewFields {
    field: string;
    value: EntryReviewStatus;
    figure?: string;
    ageId?: string;
    strataId?: string;
    geoLocationId?: string;
}

export interface ReviewInputFields {
    [key: string]: {
        // TODO: add comment information
        // TODO: add user information
        dirty?: boolean;
        value: EntryReviewStatus;
        key: string;
    } | undefined,
}
