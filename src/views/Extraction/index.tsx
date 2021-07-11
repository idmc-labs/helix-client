import React, { useState, useLayoutEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
    PopupButton,
    TextInput,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { useMutation } from '@apollo/client';

import FormActions from '#components/FormActions';
import NotificationContext from '#components/NotificationContext';
import PageHeader from '#components/PageHeader';
import QuickActionLink from '#components/QuickActionLink';
import route from '#config/routes';
import { reverseRoute } from '#hooks/useRouteMatching';
import { PurgeNull } from '#types';

import ExtractionEntriesTable from './ExtractionEntriesTable';
import NewExtractionFilters from './NewExtractionFilters';
import SavedFiltersList from './SavedFiltersList';

import {
    CreateExtractionMutation,
    CreateExtractionMutationVariables,
    ExtractionEntryListFiltersQueryVariables,
    ExtractionQueryListQueryVariables,
    UpdateExtractionMutation,
    UpdateExtractionMutationVariables,
    ExportEntriesMutation,
    ExportEntriesMutationVariables,
} from '#generated/types';
import { WithId } from '#utils/common';

import {
    GET_SAVED_QUERY_LIST,
    CREATE_EXTRACTION,
    UPDATE_EXTRACTION,
    ENTRIES_DOWNLOAD,
} from './queries';
import styles from './styles.css';

type NewExtractionFiltersFields = CreateExtractionMutationVariables['extraction'];

interface ExtractionFiltersMetaProps {
    name?: string,
    id?: string
}

interface ExtractionProps {
    className?: string;
}

function Extraction(props: ExtractionProps) {
    const { className } = props;
    const { queryId } = useParams<{ queryId: string }>();
    const { replace: historyReplace, push: historyPush } = useHistory();

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const popupElementRef = useRef<{
        setPopupVisibility: React.Dispatch<React.SetStateAction<boolean>>;
    }>(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [
        queryListFilters,
        setQueryListFilters,
    ] = useState<ExtractionQueryListQueryVariables>({
        page: 1,
        pageSize: 10,
        ordering: '-createdAt',
    });

    const [
        extractionQueryFilters,
        setExtractionQueryFilters,
    ] = useState<ExtractionEntryListFiltersQueryVariables>();

    const [
        extractionQueryFiltersMeta,
        setExtractionQueryFiltersMeta,
    ] = useState<ExtractionFiltersMetaProps>({});

    useLayoutEffect(
        () => {
            setExtractionQueryFilters(undefined);
            setExtractionQueryFiltersMeta({});
        },
        [queryId],
    );

    const onFilterChange = React.useCallback(
        (value: PurgeNull<ExtractionEntryListFiltersQueryVariables>) => {
            setExtractionQueryFilters(value);
            setPage(1);
        },
        [],
    );

    let header = queryId ? 'Edit Query' : 'New Query';
    if (extractionQueryFiltersMeta?.name) {
        header = extractionQueryFiltersMeta.name;
    }

    const queryName = extractionQueryFiltersMeta?.name;

    const setQueryName = useCallback(
        (value: string | undefined) => {
            setExtractionQueryFiltersMeta((val) => ({
                ...val,
                name: value,
            }));
        },
        [],
    );

    const handleDelete = useCallback(
        (deleteId: string) => {
            if (deleteId !== queryId) {
                return;
            }

            const editRoute = reverseRoute(route.extractions.path);
            historyReplace(editRoute);
        },
        [queryId, historyReplace],
    );

    const [
        createExtraction,
        { loading: createLoading },
    ] = useMutation<CreateExtractionMutation, CreateExtractionMutationVariables>(
        CREATE_EXTRACTION,
        {
            refetchQueries: [
                { query: GET_SAVED_QUERY_LIST, variables: queryListFilters },
            ],
            onCompleted: (response) => {
                const { createExtraction: createExtractionRes } = response;
                if (!createExtractionRes) {
                    return;
                }
                const { errors, result } = createExtractionRes;
                if (errors) {
                    notifyGQLError(errors);
                    /*
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                    */
                }
                if (result) {
                    popupElementRef.current?.setPopupVisibility(false);
                    const {
                        id: extractionId,
                        name: extractionName,
                    } = result;
                    setExtractionQueryFiltersMeta({
                        id: extractionId,
                        name: extractionName,
                    });

                    notify({ children: 'Extraction query created successfully!' });

                    const editRoute = reverseRoute(
                        route.extraction.path,
                        { queryId: extractionId },
                    );
                    historyPush(editRoute);
                    /*
                    onValueSet(removeNull({
                        ...otherAttrs,
                        regions: otherAttrs?.regions?.map((r) => r.id),
                        countries: otherAttrs?.countries?.map((c) => c.id),
                        crises: otherAttrs?.crises?.map((cr) => cr.id),
                        filterFigureCategories: otherAttrs?.filterFigureCategories
                            ?.map((fc) => fc.id),
                        figureTags: otherAttrs?.figureTags?.map((ft) => ft.id),
                    }));
                    */
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
                /*
                onErrorSet({
                    $internal: errors.message,
                });
                */
            },
        },
    );

    const [
        updateExtraction,
        { loading: updateLoading },
    ] = useMutation<UpdateExtractionMutation, UpdateExtractionMutationVariables>(
        UPDATE_EXTRACTION,
        {
            onCompleted: (response) => {
                const { updateExtraction: updateExtractionRes } = response;
                if (!updateExtractionRes) {
                    return;
                }
                const { errors, result } = updateExtractionRes;
                if (errors) {
                    notifyGQLError(errors);

                    /*
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                    */
                }
                if (result) {
                    popupElementRef.current?.setPopupVisibility(false);
                    const {
                        id: extractionId,
                        name: extractionName,
                    } = result;
                    setExtractionQueryFiltersMeta({
                        id: extractionId,
                        name: extractionName,
                    });
                    /*
                    onValueSet(removeNull({
                        ...otherAttrs,
                        regions: otherAttrs?.regions?.map((r) => r.id),
                        countries: otherAttrs?.countries?.map((c) => c.id),
                        crises: otherAttrs?.crises?.map((cr) => cr.id),
                        filterFigureCategories: otherAttrs?.filterFigureCategories
                            ?.map((fc) => fc.id),
                        figureTags: otherAttrs?.figureTags?.map((ft) => ft.id),
                    }));
                    */
                    notify({ children: 'Extraction updated successfully!' });
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
                /*
                onErrorSet({
                    $internal: errors.message,
                });
                */
            },
        },
    );

    const handleSubmit = React.useCallback(
        () => {
            if (extractionQueryFiltersMeta.id) {
                updateExtraction({
                    variables: {
                        extraction: {
                            ...extractionQueryFilters,
                            ...extractionQueryFiltersMeta,
                        } as WithId<NewExtractionFiltersFields>,
                    },
                });
            } else {
                createExtraction({
                    variables: {
                        extraction: {
                            ...extractionQueryFilters,
                            ...extractionQueryFiltersMeta,
                        } as NewExtractionFiltersFields,
                    },
                });
            }
        },
        [
            createExtraction, updateExtraction,
            extractionQueryFiltersMeta, extractionQueryFilters,
        ],
    );

    const [
        exportEntries,
        { loading: exportingEntries },
    ] = useMutation<ExportEntriesMutation, ExportEntriesMutationVariables>(
        ENTRIES_DOWNLOAD,
        {
            onCompleted: (response) => {
                const { exportEntries: exportEntriesResponse } = response;
                if (!exportEntriesResponse) {
                    return;
                }
                const { errors, ok } = exportEntriesResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({ children: 'Export started successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleExportTableData = useCallback(
        () => {
            exportEntries({
                variables: extractionQueryFilters,
            });
        },
        [exportEntries, extractionQueryFilters],
    );

    return (
        <div className={_cs(styles.extraction, className)}>
            <div className={styles.sideContent}>
                <QuickActionLink
                    route={route.extractions}
                    title="Create"
                    disabled={!queryId}
                    className={styles.newQueryButton}
                >
                    Create a new query
                </QuickActionLink>
                <SavedFiltersList
                    className={styles.largeContainer}
                    selectedQueryId={queryId}
                    queryListFilters={queryListFilters}
                    setQueryListFilters={setQueryListFilters}
                    onDelete={handleDelete}
                />
            </div>
            <div className={styles.mainContent}>
                <PageHeader
                    title={header}
                />
                <NewExtractionFilters
                    className={styles.container}
                    id={queryId}
                    onFilterChange={onFilterChange}
                    setExtractionQueryFilters={setExtractionQueryFilters}
                    setExtractionQueryFiltersMeta={setExtractionQueryFiltersMeta}
                />
                <ExtractionEntriesTable
                    className={styles.largeContainer}
                    page={page}
                    onPageChange={setPage}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                    extractionQueryFilters={extractionQueryFilters}
                    headingActions={(
                        <>
                            <ConfirmButton
                                confirmationHeader={<h2>Confirm Export</h2>}
                                confirmationMessage="Are you sure you want to export this table data ?"
                                name={undefined}
                                onConfirm={handleExportTableData}
                                disabled={exportingEntries}
                            >
                                Export
                            </ConfirmButton>
                            <PopupButton
                                componentRef={popupElementRef}
                                name={undefined}
                                variant="primary"
                                popupClassName={styles.popup}
                                popupContentClassName={styles.popupContent}
                                disabled={updateLoading || createLoading}
                                label="Save Query"
                            >
                                <TextInput
                                    label="Name"
                                    name="name"
                                    onChange={setQueryName}
                                    value={queryName}
                                    disabled={updateLoading || createLoading}
                                    className={styles.comment}
                                />
                                <FormActions>
                                    <Button
                                        name={undefined}
                                        onClick={handleSubmit}
                                        disabled={updateLoading || createLoading || !queryName}
                                        variant="primary"
                                    >
                                        Submit
                                    </Button>
                                </FormActions>
                            </PopupButton>
                        </>
                    )}
                />
            </div>
        </div>
    );
}

export default Extraction;
