import React from 'react';
import { IoDownloadOutline } from 'react-icons/io5';
import { Button, Modal, useBooleanState } from '@togglecorp/toggle-ui';

import Actions from '#components/Actions';
import QuickActionButton from '#components/QuickActionButton';
import ButtonLikeExternalLink from '#components/ButtonLikeExternalLink';
import { HulkBulkImportsListQuery } from '#generated/types';

import { DATASET_TYPE_ORDER, datasetTypeWord } from '../datasetTypes';
import styles from './styles.module.css';

function upperFirst(value: string) {
    return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

type Dataset = NonNullable<NonNullable<NonNullable<
    HulkBulkImportsListQuery['hulkBulkImports']
>['results']>[number]['datasets']>[number];

export interface ViewFilesProps {
    className?: string;
    datasets: Dataset[] | null | undefined;
}

interface Section {
    key: string;
    heading: string;
    datasets: Dataset[];
    file: (dataset: Dataset) => string | null | undefined;
    count: (dataset: Dataset) => number | null | undefined;
    word: string;
}

function ViewFiles(props: ViewFilesProps) {
    const {
        className,
        datasets,
    } = props;

    const [
        modalShown,
        showModal,
        hideModal,
    ] = useBooleanState(false);

    const ordered = [...(datasets ?? [])].sort(
        (a, b) => DATASET_TYPE_ORDER[a.importType] - DATASET_TYPE_ORDER[b.importType],
    );

    const allSections: Section[] = [
        {
            key: 'success',
            heading: 'Successes',
            datasets: ordered.filter((dataset) => !!dataset.successFile),
            file: (dataset) => dataset.successFile,
            count: (dataset) => dataset.successCount,
            word: 'successes',
        },
        {
            key: 'skip',
            heading: 'Skipped',
            datasets: ordered.filter((dataset) => !!dataset.skipFile),
            file: (dataset) => dataset.skipFile,
            count: (dataset) => dataset.skipCount,
            word: 'skipped',
        },
        {
            key: 'failure',
            heading: 'Failures',
            datasets: ordered.filter((dataset) => !!dataset.failureFile),
            file: (dataset) => dataset.failureFile,
            count: (dataset) => dataset.failureCount,
            word: 'failures',
        },
    ];
    const sections = allSections.filter((section) => section.datasets.length > 0);

    if (sections.length === 0) {
        return null;
    }

    return (
        <Actions className={className}>
            <QuickActionButton
                name={undefined}
                onClick={showModal}
                title="View files"
                transparent
            >
                <IoDownloadOutline />
            </QuickActionButton>
            {modalShown && (
                <Modal
                    heading="Import Files"
                    onClose={hideModal}
                    size="medium"
                    freeHeight
                    footer={(
                        <Button
                            name={undefined}
                            variant="primary"
                            onClick={hideModal}
                        >
                            Close
                        </Button>
                    )}
                >
                    <div className={styles.sections}>
                        {sections.map((section) => (
                            <div
                                key={section.key}
                                className={styles.section}
                            >
                                <h4 className={styles.sectionHeading}>
                                    {section.heading}
                                </h4>
                                <div className={styles.links}>
                                    {section.datasets.map((dataset) => (
                                        <ButtonLikeExternalLink
                                            key={dataset.id}
                                            className={styles.link}
                                            link={section.file(dataset) ?? undefined}
                                            icons={<IoDownloadOutline />}
                                            transparent
                                            compact
                                        >
                                            {`${upperFirst(datasetTypeWord(dataset.importType, 1))} ${section.word} (${section.count(dataset) ?? 0})`}
                                        </ButtonLikeExternalLink>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Modal>
            )}
        </Actions>
    );
}

export default ViewFiles;
