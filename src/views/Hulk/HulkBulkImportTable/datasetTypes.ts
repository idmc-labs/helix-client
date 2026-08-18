import { Hulk_Bulk_Import_Dataset_Import_Type as DatasetImportType } from '#generated/types';

// Rank used to sort datasets into a consistent order.
export const DATASET_TYPE_ORDER: { [key in DatasetImportType]: number } = {
    EVENT: 0,
    SOURCE_PREVIEW: 1,
    ATTACHMENT: 2,
    ENTRY: 3,
    FIGURE: 4,
};

const DATASET_TYPE_LABELS: {
    [key in DatasetImportType]: [string, string];
} = {
    EVENT: ['event', 'events'],
    ENTRY: ['entry', 'entries'],
    FIGURE: ['figure', 'figures'],
    SOURCE_PREVIEW: ['source preview', 'source previews'],
    ATTACHMENT: ['attachment', 'attachments'],
};

const DATASET_TYPE_TITLES: {
    [key in DatasetImportType]: string;
} = {
    EVENT: 'Event',
    ENTRY: 'Entry',
    FIGURE: 'Figure',
    SOURCE_PREVIEW: 'Source Preview',
    ATTACHMENT: 'Attachment',
};

export function datasetTypeWord(type: DatasetImportType, count: number) {
    const labels = DATASET_TYPE_LABELS[type];
    if (!labels) {
        return type;
    }
    return count === 1 ? labels[0] : labels[1];
}

export function datasetTypeTitle(type: DatasetImportType) {
    return DATASET_TYPE_TITLES[type] ?? type;
}
