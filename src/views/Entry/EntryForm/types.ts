import {
    CreateEntryMutationVariables,
    CreateAttachmentMutation,
    CreateSourcePreviewMutation,
    EntryQuery,
    Entry_Review_Status, // eslint-disable-line camelcase
    FigureOptionsForEntryFormQuery,
} from '#generated/types';
import { PurgeNull } from '#types';
import { EnumFix } from '#utils/common';

// NOTE: change info for FormType
export type FormType = CreateEntryMutationVariables['entry'];

type RawFigure = NonNullable<NonNullable<FormType['figures']>[number]>;
type FixedAge = EnumFix<RawFigure['disaggregationAge'], 'sex'>;
type FixedGeoLocations = EnumFix<RawFigure['geoLocations'], 'accuracy' | 'identifier'>;
type FixedFigure = Omit<RawFigure, 'geoLocations' | 'disaggregationAge'> & { geoLocations: FixedGeoLocations, disaggregationAge: FixedAge };
export type FigureFormProps = PurgeNull<EnumFix<
    FixedFigure,
    'quantifier' | 'unit' | 'term' | 'type' | 'role' | 'startDateAccuracy' | 'endDateAccuracy' | 'displacementOccurred' | 'category' | 'figureCause'
>> & { id: string };

export type AgeFormProps = NonNullable<NonNullable<FigureFormProps['disaggregationAge']>[number]>;
export type GeoLocationFormProps = NonNullable<NonNullable<FigureFormProps['geoLocations']>[number]>;
export type AnalysisFormProps = PurgeNull<Pick<FormType, 'idmcAnalysis'>>;
export type DetailsFormProps = PurgeNull<Pick<FormType, 'articleTitle' | 'publishDate' | 'publishers' | 'sources' | 'url' | 'document' | 'documentUrl' | 'preview' | 'isConfidential' | 'associatedParkedItem'>>;

export type FormValues = PurgeNull<Pick<FormType, 'reviewers'> & {
    figures: FigureFormProps[];
    analysis: AnalysisFormProps;
    details: DetailsFormProps;
}>

export type AccuracyOptions = NonNullable<FigureOptionsForEntryFormQuery['accuracyList']>['enumValues'];
export type DateAccuracyOptions = NonNullable<FigureOptionsForEntryFormQuery['dateAccuracy']>['enumValues'];
export type DisplacementOptions = NonNullable<FigureOptionsForEntryFormQuery['displacementOccurence']>['enumValues'];
export type UnitOptions = NonNullable<FigureOptionsForEntryFormQuery['unitList']>['enumValues'];
export type TermOptions = NonNullable<FigureOptionsForEntryFormQuery['figureTermList']>['enumValues'];
export type RoleOptions = NonNullable<FigureOptionsForEntryFormQuery['roleList']>['enumValues'];
export type GenderOptions = NonNullable<FigureOptionsForEntryFormQuery['disaggregatedGenderList']>['enumValues'];
export type IdentifierOptions = NonNullable<FigureOptionsForEntryFormQuery['identifierList']>['enumValues'];
export type QuantifierOptions = NonNullable<FigureOptionsForEntryFormQuery['quantifierList']>['enumValues'];
export type AgeOptions = NonNullable<FigureOptionsForEntryFormQuery['disaggregatedAgeCategoryList']>['results'];
export type CategoryOptions = NonNullable<FigureOptionsForEntryFormQuery['figureCategoryList']>['enumValues'];
export type Category = NonNullable<CategoryOptions>[number];
export type TagOptions = NonNullable<FigureOptionsForEntryFormQuery['figureTagList']>['results'];
export type Tag = NonNullable<TagOptions>[number];

export type CauseOptions = NonNullable<FigureOptionsForEntryFormQuery['crisisType']>['enumValues'];
export type DisasterCategoryOptions = NonNullable<FigureOptionsForEntryFormQuery['disasterCategoryList']>;
export type ViolenceCategoryOptions = NonNullable<FigureOptionsForEntryFormQuery['violenceList']>;
export type OsvSubTypeOptions = NonNullable<FigureOptionsForEntryFormQuery['osvSubTypeList']>;
export type OtherSubTypeOptions = NonNullable<FigureOptionsForEntryFormQuery['otherSubTypeList']>;

export type Attachment = NonNullable<NonNullable<CreateAttachmentMutation['createAttachment']>['result']>;
export type SourcePreview = NonNullable<NonNullable<CreateSourcePreviewMutation['createSourcePreview']>['result']>;
export type Reviewing = NonNullable<EntryQuery['entry']>['reviewing'];

export type ReviewItem = NonNullable<NonNullable<NonNullable<EntryQuery['entry']>['latestReviews']>[number]>

// eslint-disable-next-line camelcase
export type EntryReviewStatus = Entry_Review_Status;

export interface ReviewFields {
    field: string;
    figure?: string;
    age?: string;
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
