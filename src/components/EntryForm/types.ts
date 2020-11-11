import { CreateEntryMutationVariables, CreateAttachmentMutation } from '#generated/types';
import { PurgeNull } from '#types';

// FIXME: move this to types/index.tsx
type EnumFix<T, F> = {
    [K in keyof T]: K extends F ? string : T[K];
}

// NOTE: change info for FormType
export type FormType = CreateEntryMutationVariables['entry'];

export type FigureFormProps = PurgeNull<EnumFix<
    NonNullable<NonNullable<FormType['figures']>[number]>,
    'quantifier' | 'unit' | 'term' | 'type' | 'role'
>>

export type StrataFormProps = NonNullable<NonNullable<FigureFormProps['strataJson']>[number]>;
export type AgeFormProps = NonNullable<NonNullable<FigureFormProps['ageJson']>[number]>;
export type AnalysisFormProps = PurgeNull<Pick<FormType, 'idmcAnalysis' | 'calculationLogic' | 'tags' | 'caveats'>>;
export type DetailsFormProps = PurgeNull<Pick<FormType, 'articleTitle' | 'publishDate' | 'publisher' | 'source' | 'sourceBreakdown' | 'sourceExcerpt' | 'url' | 'document' | 'preview' | 'confidential'>>;

export type FormValues = PurgeNull<Pick<FormType, 'reviewers' | 'event'> & {
    figures: FigureFormProps[];
    analysis: AnalysisFormProps;
    details: DetailsFormProps;
}>

export type Attachment = NonNullable<NonNullable<CreateAttachmentMutation['createAttachment']>['result']>;
export type Preview = { url: string };
