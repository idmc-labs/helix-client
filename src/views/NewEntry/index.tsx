import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
} from '@togglecorp/toggle-ui';

import PageHeader from '#components/PageHeader';
import EntryForm from '#components/EntryForm';
import { FormValues, Attachment, Preview } from '#components/EntryForm/types';
import UrlPreview from '#components/UrlPreview';

import { PartialForm } from '#types';

import styles from './styles.css';

interface NewEntryProps {
    className?: string;
}

type PartialFormValues = PartialForm<FormValues>;

function NewEntry(props: NewEntryProps) {
    const { className } = props;
    const entryFormRef = React.useRef<HTMLFormElement>(null);
    const [, setEntryValue] = React.useState<PartialFormValues>();
    const [pristine, setPristine] = React.useState(true);
    const [submitPending, setSubmitPending] = React.useState<boolean>(false);
    const [attachment, setAttachment] = React.useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = React.useState<Preview | undefined>(undefined);

    const handleSubmitEntryButtonClick = React.useCallback(() => {
        if (entryFormRef?.current) {
            entryFormRef.current.requestSubmit();
        }
    }, [entryFormRef]);

    const resetPreview = React.useCallback(() => {
        setPreview(undefined);
    }, [setPreview]);

    const resetAttachment = React.useCallback(() => {
        setAttachment(undefined);
    }, [setAttachment]);

    return (
        <div className={_cs(styles.newEntry, className)}>
            <PageHeader
                className={styles.header}
                title="New Entry"
                actions={(
                    <Button
                        name={undefined}
                        variant="primary"
                        onClick={handleSubmitEntryButtonClick}
                        disabled={(!attachment && !preview) || submitPending || pristine}
                    >
                        Submit Entry
                    </Button>
                )}
            />
            <div className={styles.content}>
                <EntryForm
                    className={styles.entryForm}
                    elementRef={entryFormRef}
                    onChange={setEntryValue}
                    onPristineChange={setPristine}
                    attachment={attachment}
                    preview={preview}
                    onAttachmentChange={setAttachment}
                    onPreviewChange={setPreview}
                    onRequestCallPendingChange={setSubmitPending}
                    onResetPreview={resetPreview}
                    onResetAttachment={resetAttachment}
                />
                <UrlPreview
                    className={styles.preview}
                    url={preview?.url}
                    attachmentUrl={attachment?.attachment}
                />
            </div>
        </div>
    );
}

export default NewEntry;
