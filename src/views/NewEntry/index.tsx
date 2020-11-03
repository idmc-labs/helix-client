import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
} from '@togglecorp/toggle-ui';

import PageHeader from '#components/PageHeader';
import EntryForm from '#components/EntryForm';
import UrlPreview from '#components/UrlPreview';

import {
    PartialForm,
} from '#types';

import { CreateEntryMutationVariables } from '../../../types';
import styles from './styles.css';

interface NewEntryProps {
    className?: string;
}

type FormType = CreateEntryMutationVariables['entry'];
type FormValues = Pick<FormType, 'reviewers' | 'event' | 'figures'> & {
    analysis: Pick<FormType, 'idmcAnalysis' | 'methodology' | 'tags'>
    details: Pick<FormType, 'articleTitle' | 'publishDate' | 'publisher' | 'source' | 'sourceBreakdown' | 'sourceExcerpt' | 'sourceMethodology' | 'url'>
}
type PartialFormValues = PartialForm<FormValues>;

function NewEntry(props: NewEntryProps) {
    const { className } = props;
    const entryFormRef = React.useRef<HTMLFormElement>(null);
    const [entryValue, setEntryValue] = React.useState<PartialFormValues>();

    const handleSubmitEntryButtonClick = React.useCallback(() => {
        if (entryFormRef?.current) {
            entryFormRef.current.requestSubmit();
        }
    }, [entryFormRef]);

    return (
        <div className={_cs(styles.newEntry, className)}>
            <PageHeader
                className={styles.header}
                title="New Entry"
                actions={(
                    <div className={styles.actions}>
                        <Button
                            name={undefined}
                            variant="primary"
                            onClick={handleSubmitEntryButtonClick}
                            disabled={!entryValue?.details?.url}
                        >
                            Submit entry
                        </Button>
                    </div>
                )}
            />
            <div className={styles.content}>
                <EntryForm
                    className={styles.entryForm}
                    elementRef={entryFormRef}
                    onChange={setEntryValue}
                />
                <UrlPreview
                    className={styles.preview}
                    url={entryValue?.details?.url}
                />
            </div>
        </div>
    );
}

export default NewEntry;
