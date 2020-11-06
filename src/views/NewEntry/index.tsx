import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
} from '@togglecorp/toggle-ui';

import PageHeader from '#components/PageHeader';
import EntryForm from '#components/EntryForm';
import { FormValues, Attachment, Preview } from '#components/EntryForm/types';
import UrlPreview from '#components/UrlPreview';

import {
    PartialForm,
} from '#types';

import styles from './styles.css';

interface NewEntryProps {
    className?: string;
}

type PartialFormValues = PartialForm<FormValues>;

function NewEntry(props: NewEntryProps) {
    const { className } = props;
    const entryFormRef = React.useRef<HTMLFormElement>(null);
    const [entryValue, setEntryValue] = React.useState<PartialFormValues>();
    const [attachment, setAttachment] = React.useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = React.useState<Preview | undefined>(undefined);

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
                    attachment={attachment}
                    preview={preview}
                    onAttachmentChange={setAttachment}
                    onPreviewChange={setPreview}
                />
                <UrlPreview
                    className={styles.preview}
                    url={preview?.url}
                    attachmentUrl={attachment?.attachment}
                    // url={entryValue?.details?.url}
                />
            </div>
        </div>
    );
}

export default NewEntry;
