import React from 'react';
import { useParams } from 'react-router-dom';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
} from '@togglecorp/toggle-ui';

import PageHeader from '#components/PageHeader';
import EntryForm from '#components/EntryForm';
import UrlPreview from '#components/UrlPreview';

import {
    EntryQuery,
    EntryQueryVariables,
} from '#generated/types';

import {
    PartialForm,
} from '#types';
import { FormValues, Attachment, Preview } from '#components/EntryForm/types';

import styles from './styles.css';

const ENTRY = gql`
    query Entry($id: ID!) {
        entry(id: $id) {
            figures {
                results {
                    conflict
                    conflictCommunal
                    conflictCriminal
                    conflictOther
                    conflictPolitical
                    displacementRural
                    displacementUrban
                    district
                    excerptIdu
                    householdSize
                    id
                    includeIdu
                    isDisaggregated
                    locationCamp
                    locationNonCamp
                    quantifier
                    reported
                    role
                    sexFemale
                    sexMale
                    startDate
                    strataJson {
                        date
                        uuid
                        value
                    }
                    term
                    totalFigures
                    town
                    type
                    unit
                    uuid
                    ageJson {
                        ageFrom
                        ageTo
                        uuid
                        value
                    }
                }
            }
            articleTitle
            document {
                id
                attachment
            }
            event {
                id
            }
            id
            idmcAnalysis
            methodology
            preview {
                completed
                pdf
                url
                reason
                id
            }
            publishDate
            publisher
            reviewers {
                results {
                    id
                }
            }
            source
            sourceBreakdown
            sourceExcerpt
            sourceMethodology
            tags
            totalFigures
            url
        }
    }
`;

interface EntryProps {
    className?: string;
}

type PartialFormValues = PartialForm<FormValues>;

function Entry(props: EntryProps) {
    const { className } = props;
    const { entryId } = useParams<{ entryId: string }>();
    const entryFormRef = React.useRef<HTMLFormElement>(null);
    const [entryValue, setEntryValue] = React.useState<PartialFormValues>();
    const [attachment, setAttachment] = React.useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = React.useState<Preview | undefined>(undefined);

    const handleSubmitEntryButtonClick = React.useCallback(() => {
        if (entryFormRef?.current) {
            entryFormRef.current.requestSubmit();
        }
    }, [entryFormRef]);

    const {
        loading,
    } = useQuery<EntryQuery, EntryQueryVariables>(ENTRY, {
        variables: {
            id: entryId,
        },
        onCompleted: (response) => {
            const { entry } = response;
            if (!entry) {
                return;
            }

            const formValues: PartialFormValues = {
                reviewers: entry.reviewers?.results?.map((d) => d.id),
                event: entry.event.id,
                details: {
                    articleTitle: entry.articleTitle,
                    publishDate: entry.publishDate,
                    publisher: entry.publisher,
                    source: entry.source,
                    sourceBreakdown: entry.sourceBreakdown,
                    sourceExcerpt: entry.sourceExcerpt,
                    sourceMethodology: entry.sourceMethodology,
                    url: entry.url,
                    document: entry.document?.id,
                    preview: entry.preview?.id,
                },
                analysis: {
                    idmcAnalysis: entry.idmcAnalysis,
                    methodology: entry.methodology,
                    tags: entry.tags,
                },
                figures: entry.figures?.results,
            };

            setEntryValue(formValues);
            // FIXME: set real preview
            if (entry.url) {
                setPreview({ url: entry.url });
            }
            if (entry.document) {
                setAttachment(entry.document);
            }
        },
        // TODO: handle errors
    });

    return (
        <div className={_cs(styles.newEntry, className)}>
            <PageHeader
                className={styles.header}
                title="Edit Entry"
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
                {!loading && entryValue && (
                    <>
                        <EntryForm
                            className={styles.entryForm}
                            elementRef={entryFormRef}
                            onChange={setEntryValue}
                            value={entryValue}
                            entryId={entryId}
                            // attachment={data?.entry?.document}
                            attachment={attachment}
                            preview={preview}
                            onAttachmentChange={setAttachment}
                            onPreviewChange={setPreview}
                        />
                        <UrlPreview
                            className={styles.preview}
                            url={entryValue?.details?.url}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default Entry;
