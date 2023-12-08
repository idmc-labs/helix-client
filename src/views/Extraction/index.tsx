import React, { useState, useLayoutEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
    PopupButton,
    TextInput,
} from '@togglecorp/toggle-ui';
import { gql, useMutation } from '@apollo/client';

import FormActions from '#components/FormActions';
import NotificationContext from '#components/NotificationContext';
import PageHeader from '#components/PageHeader';
import ButtonLikeLink from '#components/ButtonLikeLink';
import route from '#config/routes';
import { reverseRoute } from '#hooks/useRouteMatching';

import ExtractionEntriesTable from './ExtractionEntriesTable';
import AdvancedFiguresFilter from '#components/rawTables/useFigureTable/AdvancedFiguresFilter';
import SavedFiltersList, { GET_SAVED_QUERY_LIST } from './SavedFiltersList';

import {
    CreateExtractionMutation,
    CreateExtractionMutationVariables,
    ExtractionEntryListFiltersQueryVariables,
    ExtractionQueryListQueryVariables,
    UpdateExtractionMutation,
    UpdateExtractionMutationVariables,
} from '#generated/types';
import { WithId } from '#utils/common';

import styles from './styles.css';

const CREATE_EXTRACTION = gql`
    mutation CreateExtraction($extraction: CreateExtractInputType!) {
        createExtraction(data: $extraction) {
            result {
                id
                filterFigureCountries {
                    id
                    idmcShortName
                }
                filterFigureCrises {
                    id
                    name
                }
                filterFigureStartAfter
                filterFigureEndBefore
                filterFigureCategories
                filterFigureRoles
                filterFigureTags {
                    id
                    name
                }
                id
                name
                filterFigureRegions {
                    id
                    name
                }
                filterEntryArticleTitle
                filterFigureCrisisTypes
                filterFigureCreatedBy {
                    id
                    fullName
                }
                filterFigureHasDisaggregatedData
                filterFigureTerms
                filterFigureHasHousingDestruction
                filterFigureHasExcerptIdu
            }
            errors
        }
    }
`;

const UPDATE_EXTRACTION = gql`
    mutation UpdateExtraction($extraction: UpdateExtractInputType!) {
        updateExtraction(data: $extraction) {
            result {
                id
                filterFigureCountries {
                    id
                    idmcShortName
                }
                filterFigureCrises {
                    id
                    name
                }
                filterFigureStartAfter
                filterFigureEndBefore
                filterFigureCategories
                filterFigureRoles
                filterFigureTags {
                    id
                    name
                }
                id
                name
                filterFigureRegions {
                    id
                    name
                }
                filterEntryArticleTitle
                filterFigureCrisisTypes
                filterFigureCreatedBy {
                    id
                    fullName
                }
                filterFigureHasDisaggregatedData
                filterFigureTerms
                filterFigureHasHousingDestruction
                filterFigureHasExcerptIdu
            }
            errors
        }
    }
`;

type ExtractionFiltersFields = CreateExtractionMutationVariables['extraction'];

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

                    notify({
                        children: 'Extraction query created successfully!',
                        variant: 'success',
                    });

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
                notify({
                    children: errors.message,
                    variant: 'error',
                });
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
                    notify({
                        children: 'Extraction updated successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                /*
                onErrorSet({
                    $internal: errors.message,
                });
                */
            },
        },
    );

    const handleSubmit = useCallback(
        () => {
            if (extractionQueryFiltersMeta.id) {
                updateExtraction({
                    variables: {
                        extraction: {
                            ...extractionQueryFilters,
                            ...extractionQueryFiltersMeta,
                        } as WithId<ExtractionFiltersFields>,
                    },
                });
            } else {
                createExtraction({
                    variables: {
                        extraction: {
                            ...extractionQueryFilters,
                            ...extractionQueryFiltersMeta,
                        } as ExtractionFiltersFields,
                    },
                });
            }
        },
        [
            createExtraction, updateExtraction,
            extractionQueryFiltersMeta, extractionQueryFilters,
        ],
    );

    return (
        <div className={_cs(styles.extraction, className)}>
            <div className={styles.sideContent}>
                {queryId && (
                    <ButtonLikeLink
                        route={route.extractions}
                        title="Create"
                        className={styles.newQueryButton}
                    >
                        Create a new query
                    </ButtonLikeLink>
                )}
                <SavedFiltersList
                    className={styles.stickyContainer}
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
                <AdvancedFiguresFilter
                    className={styles.container}
                    id={queryId}
                    onFilterChange={setExtractionQueryFilters}
                    onFilterMetaChange={setExtractionQueryFiltersMeta}
                />
                <ExtractionEntriesTable
                    className={styles.largeContainer}
                    filters={extractionQueryFilters}
                    headingActions={(
                        <PopupButton
                            componentRef={popupElementRef}
                            name={undefined}
                            variant="primary"
                            popupClassName={styles.popup}
                            popupContentClassName={styles.popupContent}
                            disabled={updateLoading || createLoading}
                            label="Save Query"
                            persistent={false}
                        >
                            <TextInput
                                label="Name"
                                name="name"
                                onChange={setQueryName}
                                value={queryName}
                                disabled={updateLoading || createLoading}
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
                    )}
                />
            </div>
        </div>
    );
}

export default Extraction;
