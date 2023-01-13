import {
    CreateEntryMutationVariables,
    CreateAttachmentMutation,
    CreateSourcePreviewMutation,
    FigureOptionsForEntryFormQuery,
} from '#generated/types';
import {
    GetEnumOptions,
} from '#utils/common';
import { PurgeNull } from '#types';

// NOTE: change info for FormType
export type FormType = CreateEntryMutationVariables['entry'];

type RawFigure = NonNullable<NonNullable<FormType['figures']>[number]>;
// FIXME: use WithID
export type FigureFormProps = PurgeNull<RawFigure> & { id: string };

export type AgeFormProps = NonNullable<NonNullable<FigureFormProps['disaggregationAge']>[number]>;
export type GeoLocationFormProps = NonNullable<NonNullable<FigureFormProps['geoLocations']>[number]>;
export type AnalysisFormProps = PurgeNull<Pick<FormType, 'idmcAnalysis'>>;
export type DetailsFormProps = PurgeNull<Pick<FormType, 'articleTitle' | 'publishDate' | 'publishers' | 'url' | 'document' | 'documentUrl' | 'preview' | 'isConfidential' | 'associatedParkedItem'>>;

export type FormValues = PurgeNull<{
    figures: FigureFormProps[];
    analysis: AnalysisFormProps;
    details: DetailsFormProps;
}>

export type AccuracyOptions = GetEnumOptions<
    NonNullable<FigureOptionsForEntryFormQuery['accuracyList']>['enumValues'],
    NonNullable<GeoLocationFormProps['accuracy']>
>;
export type DateAccuracyOptions = GetEnumOptions<
    NonNullable<FigureOptionsForEntryFormQuery['dateAccuracy']>['enumValues'],
    NonNullable<FigureFormProps['startDateAccuracy']>
>;
export type DisplacementOptions = GetEnumOptions<
    NonNullable<FigureOptionsForEntryFormQuery['displacementOccurence']>['enumValues'],
    NonNullable<FigureFormProps['displacementOccurred']>
>;
export type UnitOptions = GetEnumOptions<
    NonNullable<FigureOptionsForEntryFormQuery['unitList']>['enumValues'],
    NonNullable<FigureFormProps['unit']>
>;
export type TermOptions = GetEnumOptions<
    NonNullable<FigureOptionsForEntryFormQuery['figureTermList']>['enumValues'],
    NonNullable<FigureFormProps['term']>
>;
export type RoleOptions = GetEnumOptions<
    NonNullable<FigureOptionsForEntryFormQuery['roleList']>['enumValues'],
    NonNullable<FigureFormProps['role']>
>;
export type GenderOptions = GetEnumOptions<
    NonNullable<FigureOptionsForEntryFormQuery['disaggregatedGenderList']>['enumValues'],
    NonNullable<AgeFormProps['sex']>
>;
export type IdentifierOptions = GetEnumOptions<
    NonNullable<FigureOptionsForEntryFormQuery['identifierList']>['enumValues'],
    NonNullable<GeoLocationFormProps['identifier']>
>;
export type QuantifierOptions = GetEnumOptions<
    NonNullable<FigureOptionsForEntryFormQuery['quantifierList']>['enumValues'],
    NonNullable<FigureFormProps['quantifier']>
>;
export type CauseOptions = GetEnumOptions<
    NonNullable<FigureOptionsForEntryFormQuery['crisisType']>['enumValues'],
    NonNullable<FigureFormProps['figureCause']>
>;
export type CategoryOptions = GetEnumOptions<
    NonNullable<FigureOptionsForEntryFormQuery['figureCategoryList']>['enumValues'],
    NonNullable<FigureFormProps['category']>
>;
export type Category = NonNullable<CategoryOptions>[number];

export type TagOptions = NonNullable<FigureOptionsForEntryFormQuery['figureTagList']>['results'];
export type Tag = NonNullable<TagOptions>[number];

export type DisasterCategoryOptions = NonNullable<FigureOptionsForEntryFormQuery['disasterCategoryList']>;
export type ViolenceCategoryOptions = NonNullable<FigureOptionsForEntryFormQuery['violenceList']>;
export type OsvSubTypeOptions = NonNullable<FigureOptionsForEntryFormQuery['osvSubTypeList']>;
export type OtherSubTypeOptions = NonNullable<FigureOptionsForEntryFormQuery['otherSubTypeList']>;

export type Attachment = NonNullable<NonNullable<CreateAttachmentMutation['createAttachment']>['result']>;
export type SourcePreview = NonNullable<NonNullable<CreateSourcePreviewMutation['createSourcePreview']>['result']>;
