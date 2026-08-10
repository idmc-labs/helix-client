import { Hulk_Bulk_Import_Dataset_Import_Type as DatasetImportType } from '#generated/types';

export const DATASET_TYPE_ORDER: DatasetImportType[] = [
    'EVENT',
    'ENTRY',
    'FIGURE',
    'SOURCE_PREVIEW',
    'ATTACHMENT',
];

const DATASET_TYPE_LABELS: {
    [key in DatasetImportType]: [string, string];
} = {
    EVENT: ['event', 'events'],
    ENTRY: ['entry', 'entries'],
    FIGURE: ['figure', 'figures'],
    SOURCE_PREVIEW: ['source preview', 'source previews'],
    ATTACHMENT: ['attachment', 'attachments'],
};

export function datasetTypeWord(type: DatasetImportType, count: number) {
    const labels = DATASET_TYPE_LABELS[type];
    if (!labels) {
        return type;
    }
    return count === 1 ? labels[0] : labels[1];
}
