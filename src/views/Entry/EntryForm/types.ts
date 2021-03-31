import {
    CreateEntryMutationVariables,
    CreateAttachmentMutation,
    CreateSourcePreviewMutation,
    EntryQuery,
    Entry_Review_Status, // eslint-disable-line camelcase
    FigureOptionsForEntryFormQuery,
} from '#generated/types';
import { PurgeNull } from '#types';

// FIXME: use NonNullableRec
// FIXME: move this to types/index.tsx
// NOTE: converts enum to string
type Check<T> = T extends string ? string : undefined;
// eslint-disable-next-line @typescript-eslint/ban-types
type EnumFix<T, F> = T extends object[] ? (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends any[] ? EnumFix<T[number], F>[] : T
) : ({
    [K in keyof T]: K extends F ? Check<T[K]> : T[K];
})

// NOTE: change info for FormType
export type FormType = CreateEntryMutationVariables['entry'];

type RawFigure = NonNullable<NonNullable<FormType['figures']>[number]>;
type FixedGeoLocations = EnumFix<RawFigure['geoLocations'], 'accuracy' | 'identifier'>;
type FixedFigure = Omit<RawFigure, 'geoLocations'> & { geoLocations: FixedGeoLocations };
export type FigureFormProps = PurgeNull<EnumFix<
    FixedFigure,
    'quantifier' | 'unit' | 'term' | 'type' | 'role' | 'startDateAccuracy' | 'endDateAccuracy'
>> & { id: string };

export type StrataFormProps = NonNullable<NonNullable<FigureFormProps['disaggregationStrataJson']>[number]>;
export type AgeFormProps = NonNullable<NonNullable<FigureFormProps['disaggregationAgeJson']>[number]>;
export type GeoLocationFormProps = NonNullable<NonNullable<FigureFormProps['geoLocations']>[number]>;
export type AnalysisFormProps = PurgeNull<Pick<FormType, 'idmcAnalysis' | 'calculationLogic' | 'tags' | 'caveats'>>;
export type DetailsFormProps = PurgeNull<Pick<FormType, 'articleTitle' | 'publishDate' | 'publishers' | 'sources' | 'sourceExcerpt' | 'url' | 'document' | 'preview' | 'isConfidential' | 'associatedParkedItem'>>;

export type FormValues = PurgeNull<Pick<FormType, 'reviewers' | 'event'> & {
    figures: FigureFormProps[];
    analysis: AnalysisFormProps;
    details: DetailsFormProps;
}>

export type AccuracyOptions = NonNullable<FigureOptionsForEntryFormQuery['accuracyList']>['enumValues'];
export type DateAccuracyOptions = NonNullable<FigureOptionsForEntryFormQuery['dateAccuracy']>['enumValues'];
export type UnitOptions = NonNullable<FigureOptionsForEntryFormQuery['unitList']>['enumValues'];
export type TermOptions = NonNullable<FigureOptionsForEntryFormQuery['figureTermList']>['results'];
export type RoleOptions = NonNullable<FigureOptionsForEntryFormQuery['roleList']>['enumValues'];
export type IdentifierOptions = NonNullable<FigureOptionsForEntryFormQuery['identifierList']>['enumValues'];
export type QuantifierOptions = NonNullable<FigureOptionsForEntryFormQuery['quantifierList']>['enumValues'];
export type CategoryOptions = NonNullable<FigureOptionsForEntryFormQuery['figureCategoryList']>['results'];
export type Category = NonNullable<CategoryOptions>[number];
export type TagOptions = NonNullable<FigureOptionsForEntryFormQuery['figureTagList']>['results'];
export type Tag = NonNullable<TagOptions>[number];

export type Attachment = NonNullable<NonNullable<CreateAttachmentMutation['createAttachment']>['result']>;
export type SourcePreview = NonNullable<NonNullable<CreateSourcePreviewMutation['createSourcePreview']>['result']>;
export type Reviewing = NonNullable<EntryQuery['entry']>['reviewing'];

export type ReviewItem = NonNullable<NonNullable<NonNullable<EntryQuery['entry']>['latestReviews']>[number]>

// eslint-disable-next-line camelcase
export type EntryReviewStatus = Entry_Review_Status;

export interface ReviewFields {
    field: string;
    figure?: string;
    ageId?: string;
    strataId?: string;
    geoLocation?: string;

    value: EntryReviewStatus;
    comment: ReviewItem['comment'];
}

export interface ReviewInputFields {
    [key: string]: {
        dirty?: boolean;
        value: EntryReviewStatus;
        key: string;
        comment: ReviewItem['comment'];
    } | undefined,
}
