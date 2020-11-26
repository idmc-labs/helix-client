import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    _cs,
    unique,
} from '@togglecorp/fujs';
import {
    Button,
} from '@togglecorp/toggle-ui';

import PageHeader from '#components/PageHeader';
import EntryForm from '#components/EntryForm';
import UrlPreview from '#components/UrlPreview';
import { OrganizationOption } from '#components/SourceSelectInput';

import { removeNull } from '#utils/schema';
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
    query ReviewEntry($id: ID!) {
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
            calculationLogic
            caveats
            isConfidential
            preview {
                completed
                pdf
                url
                reason
                id
            }
            publishDate
            publisher {
                id
                name
            }
            reviewers {
                results {
                    id
                }
            }
            reviewing {
                id
                status
                reviewer {
                    id
                }
            }
            source {
                id
                name
            }
            sourceExcerpt
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
    const [entryValue, setEntryValue] = useState<PartialFormValues>();
    const [pristine, setPristine] = useState(true);
    const [submitPending, setSubmitPending] = useState<boolean>(false);
    const [attachment, setAttachment] = useState<Attachment | undefined>(undefined);
    const [preview, setPreview] = useState<Preview | undefined>(undefined);
    const [
        organizations,
        setOrganizations,
    ] = useState<OrganizationOption[] | null | undefined>([]);

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

            console.info(entry);

            const organizationsFromEntry: OrganizationOption[] = [];
            if (entry.source) {
                organizationsFromEntry.push(entry.source);
            }
            if (entry.publisher) {
                organizationsFromEntry.push(entry.publisher);
            }
            const uniqueOrganizations = unique(
                organizationsFromEntry,
                (o) => o.id,
            );
            setOrganizations(uniqueOrganizations);

            const formValues: PartialFormValues = removeNull({
                reviewers: entry.reviewers?.results?.map((d) => d.id),
                event: entry.event.id,
                details: {
                    articleTitle: entry.articleTitle,
                    publishDate: entry.publishDate,
                    publisher: entry.publisher?.id,
                    source: entry.source?.id,
                    sourceExcerpt: entry.sourceExcerpt,
                    url: entry.url,
                    document: entry.document?.id,
                    preview: entry.preview?.id,
                    isConfidential: entry.isConfidential,
                },
                analysis: {
                    idmcAnalysis: entry.idmcAnalysis,
                    calculationLogic: entry.calculationLogic,
                    tags: entry.tags,
                    caveats: entry.caveats,
                },
                figures: entry.figures?.results,
            });

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
                            disabled={(!attachment && !preview) || submitPending || pristine}
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
                            onPristineChange={setPristine}
                            value={entryValue}
                            entryId={entryId}
                            attachment={attachment}
                            preview={preview}
                            onAttachmentChange={setAttachment}
                            onPreviewChange={setPreview}
                            onRequestCallPendingChange={setSubmitPending}
                            organizations={organizations}
                            setOrganizations={setOrganizations}
                            reviewMode
                        />
                        <UrlPreview
                            className={styles.preview}
                            url={entryValue?.details?.url}
                            attachmentUrl={attachment?.attachment}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default Entry;
