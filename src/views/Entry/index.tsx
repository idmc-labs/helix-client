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
import { FormValues } from '#components/EntryForm/types';
import UrlPreview from '#components/UrlPreview';

import {
    EntryQuery,
    EntryQueryVariables,
} from '#generated/types';

import {
    PartialForm,
} from '#types';

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

    const handleSubmitEntryButtonClick = React.useCallback(() => {
        if (entryFormRef?.current) {
            entryFormRef.current.requestSubmit();
        }
    }, [entryFormRef]);

    const {
        data,
        loading,
    } = useQuery<EntryQuery, EntryQueryVariables>(ENTRY, {
        variables: {
            id: entryId,
        },
    });

    const entryData = React.useMemo(() => {
        if (!data?.entry) {
            return undefined;
        }

        const { entry } = data;

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
            },
            analysis: {
                idmcAnalysis: entry.idmcAnalysis,
                methodology: entry.methodology,
                tags: entry.tags,
            },
            figures: entry.figures?.results ?? [],
        };

        return formValues;
    }, [data]);

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
                {!loading && entryData && (
                    <>
                        <EntryForm
                            className={styles.entryForm}
                            elementRef={entryFormRef}
                            onChange={setEntryValue}
                            value={entryData}
                            entryId={data?.entry?.id}
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
