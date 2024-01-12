import React, { useState, useLayoutEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    Button,
    PopupButton,
    TextInput,
} from '@togglecorp/toggle-ui';
import { removeNull } from '@togglecorp/toggle-form';
import { getOperationName } from 'apollo-link';
import { gql, useQuery, useMutation } from '@apollo/client';

import useFilterState from '#hooks/useFilterState';
import FormActions from '#components/FormActions';
import NotificationContext from '#components/NotificationContext';
import PageHeader from '#components/PageHeader';
import ButtonLikeLink from '#components/ButtonLikeLink';
import route from '#config/routes';
import { reverseRoute } from '#hooks/useRouteMatching';
import { PurgeNull } from '#types';
import useOptions from '#hooks/useOptions';
import AdvancedFiguresFilter from '#components/rawTables/useFigureTable/AdvancedFiguresFilter';
import Container from '#components/Container';

import ExtractionEntriesTable from './ExtractionEntriesTable';
import SavedFiltersList, { GET_SAVED_QUERY_LIST } from './SavedFiltersList';

import {
    ExtractionForFormQuery,
    ExtractionForFormQueryVariables,
    CreateExtractionMutation,
    CreateExtractionMutationVariables,
    ExtractionEntryListFiltersQueryVariables,
    UpdateExtractionMutation,
    UpdateExtractionMutationVariables,
} from '#generated/types';
import { WithId } from '#utils/common';

import styles from './styles.css';

const getSavedQueryListQueryName = getOperationName(GET_SAVED_QUERY_LIST);

const EXTRACTION_FILTER = gql`
    query ExtractionForForm($id: ID!) {
        extractionQuery(id: $id) {
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
            filterFigureCategoryTypes
            filterFigureTags {
                id
                name
            }
            filterFigureRoles
            id
            name
            filterFigureRegions {
                id
                name
            }
            filterFigureGeographicalGroups {
                id
                name
            }
            filterFigureSources {
                id
                name
                countries {
                    id
                    idmcShortName
                }
            }
            filterEntryPublishers {
                id
                name
                countries {
                    id
                    idmcShortName
                }
            }
            filterEntryArticleTitle
            filterFigureCrisisTypes
            filterFigureHasDisaggregatedData
            filterFigureEvents {
                id
                name
            }
            filterFigureCreatedBy {
                id
                fullName
                isActive
            }
            filterFigureTerms
            createdAt
            createdBy {
                fullName
                id
            }
            filterFigureReviewStatus
            filterFigureHasExcerptIdu
            filterFigureHasHousingDestruction
            filterFigureContextOfViolence {
                id
                name
            }
            filterFigureDisasterSubTypes {
                id
                name
            }
            filterFigureViolenceSubTypes {
                id
                name
            }
        }
    }
`;

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
    const {
        replace: historyReplace,
        push: historyPush,
    } = useHistory();
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const popupElementRef = useRef<{
        setPopupVisibility: React.Dispatch<React.SetStateAction<boolean>>;
    }>(null);

    const [, setCountries] = useOptions('country');
    const [, setCreatedByOptions] = useOptions('user');
    const [, setRegions] = useOptions('region');
    const [, setGeographicGroups] = useOptions('geographicGroup');
    const [, setCrises] = useOptions('crisis');
    const [, setTags] = useOptions('tag');
    const [, setOrganizations] = useOptions('organization');
    const [, setEventOptions] = useOptions('event');
    const [, setViolenceContextOptions] = useOptions('contextOfViolence');

    const figuresFilterState = useFilterState<PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });
    const entriesFilterState = useFilterState<PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const {
        setFilter: setFiguresFilter,
        rawFilter: rawFiguresFilter,
        initialFilter: initialFiguresFilter,
    } = figuresFilterState;
    const {
        setFilter: setEntriesFilter,
    } = entriesFilterState;

    const setFilter: typeof setFiguresFilter = useCallback(
        (...args) => {
            setFiguresFilter(...args);
            setEntriesFilter(...args);
        },
        [setFiguresFilter, setEntriesFilter],
    );

    const [
        extractionQueryFiltersMeta,
        setExtractionQueryFiltersMeta,
    ] = useState<ExtractionFiltersMetaProps>({});

    // NOTE: Do we need to reset this here instead of onCompleted of the query?
    useLayoutEffect(
        () => {
            setFilter({}, true);
            setExtractionQueryFiltersMeta({});
        },
        [queryId, setFilter],
    );

    let header = queryId ? 'Edit Query' : 'New Query';
    if (extractionQueryFiltersMeta?.name) {
        header = extractionQueryFiltersMeta.name;
    }

    const queryName = extractionQueryFiltersMeta?.name;

    const extractionVariables = useMemo(
        (): ExtractionForFormQueryVariables | undefined => (
            queryId ? { id: queryId } : undefined
        ),
        [queryId],
    );

    const {
        loading: extractionQueryLoading,
        error: extractionDataError,
    } = useQuery<ExtractionForFormQuery, ExtractionForFormQueryVariables>(
        EXTRACTION_FILTER,
        {
            skip: !extractionVariables,
            variables: extractionVariables,
            onCompleted: (response) => {
                const { extractionQuery: extraction } = response;
                if (!extraction) {
                    return;
                }
                const {
                    id: extractionId,
                    name: extractionName,
                    ...otherAttrs
                } = extraction;

                if (otherAttrs.filterFigureRegions) {
                    setRegions(otherAttrs.filterFigureRegions);
                }
                if (otherAttrs.filterFigureGeographicalGroups) {
                    setGeographicGroups(otherAttrs.filterFigureGeographicalGroups);
                }
                if (otherAttrs.filterFigureCountries) {
                    setCountries(otherAttrs.filterFigureCountries);
                }
                if (otherAttrs.filterFigureCrises) {
                    setCrises(otherAttrs.filterFigureCrises);
                }
                if (otherAttrs.filterFigureTags) {
                    setTags(otherAttrs.filterFigureTags);
                }
                if (otherAttrs.filterFigureSources) {
                    setOrganizations(otherAttrs.filterFigureSources);
                }
                if (otherAttrs.filterEntryPublishers) {
                    setOrganizations(otherAttrs.filterEntryPublishers);
                }
                if (otherAttrs.filterFigureEvents) {
                    setEventOptions(otherAttrs.filterFigureEvents);
                }
                if (otherAttrs.filterFigureCreatedBy) {
                    setCreatedByOptions(otherAttrs.filterFigureCreatedBy);
                }
                if (otherAttrs.filterFigureContextOfViolence) {
                    setViolenceContextOptions(otherAttrs.filterFigureContextOfViolence);
                }
                const formValue = removeNull({
                    filterFigureRegions: otherAttrs.filterFigureRegions?.map((r) => r.id),
                    filterFigureGeographicalGroups: otherAttrs.filterFigureGeographicalGroups
                        ?.map((r) => r.id),
                    filterFigureCreatedBy: otherAttrs.filterFigureCreatedBy?.map((u) => u.id),
                    filterFigureCountries: otherAttrs.filterFigureCountries?.map((c) => c.id),
                    filterFigureCrises: otherAttrs.filterFigureCrises?.map((cr) => cr.id),
                    filterFigureCategories: otherAttrs.filterFigureCategories,
                    // FIXME: this should not be null in the array
                    // eslint-disable-next-line max-len
                    filterFigureCategoryTypes: otherAttrs.filterFigureCategoryTypes?.filter(isDefined),
                    filterFigureTags: otherAttrs.filterFigureTags?.map((ft) => ft.id),
                    filterFigureTerms: otherAttrs.filterFigureTerms,
                    filterFigureRoles: otherAttrs.filterFigureRoles,
                    filterFigureStartAfter: otherAttrs.filterFigureStartAfter,
                    filterFigureEndBefore: otherAttrs.filterFigureEndBefore,
                    filterEntryArticleTitle: otherAttrs.filterEntryArticleTitle,
                    filterFigureCrisisTypes: otherAttrs.filterFigureCrisisTypes,
                    filterEntryPublishers: otherAttrs.filterEntryPublishers?.map((fp) => fp.id),
                    filterFigureSources: otherAttrs.filterFigureSources?.map((fp) => fp.id),
                    filterFigureEvents: otherAttrs.filterFigureEvents?.map((e) => e.id),
                    filterFigureReviewStatus: otherAttrs.filterFigureReviewStatus,
                    filterFigureHasDisaggregatedData: otherAttrs.filterFigureHasDisaggregatedData,
                    filterFigureHasHousingDestruction: otherAttrs.filterFigureHasHousingDestruction,
                    filterFigureHasExcerptIdu: otherAttrs.filterFigureHasExcerptIdu,
                    // eslint-disable-next-line max-len
                    filterFigureContextOfViolence: otherAttrs.filterFigureContextOfViolence?.map((e) => e.id),
                    // eslint-disable-next-line max-len
                    filterFigureDisasterSubTypes: otherAttrs.filterFigureDisasterSubTypes?.map((e) => e.id),
                    // eslint-disable-next-line max-len
                    filterFigureViolenceSubTypes: otherAttrs.filterFigureViolenceSubTypes?.map((e) => e.id),
                });

                setFilter(formValue, true);

                setExtractionQueryFiltersMeta({
                    id: extractionId,
                    name: extractionName,
                });
            },
        },
    );
    const filterDisabled = extractionQueryLoading || !!extractionDataError;

    const [
        createExtraction,
        { loading: createLoading },
    ] = useMutation<CreateExtractionMutation, CreateExtractionMutationVariables>(
        CREATE_EXTRACTION,
        {
            refetchQueries: getSavedQueryListQueryName ? [getSavedQueryListQueryName] : undefined,
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

    const handleQueryNameChange = useCallback(
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

    const handleSubmit = useCallback(
        () => {
            if (extractionQueryFiltersMeta.id) {
                updateExtraction({
                    variables: {
                        extraction: {
                            ...rawFiguresFilter,
                            ...extractionQueryFiltersMeta,
                        } as WithId<ExtractionFiltersFields>,
                    },
                });
            } else {
                createExtraction({
                    variables: {
                        extraction: {
                            ...rawFiguresFilter,
                            ...extractionQueryFiltersMeta,
                        } as ExtractionFiltersFields,
                    },
                });
            }
        },
        [
            createExtraction,
            updateExtraction,
            extractionQueryFiltersMeta,
            rawFiguresFilter,
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
                    onDelete={handleDelete}
                />
            </div>
            <div className={styles.mainContent}>
                <PageHeader
                    title={header}
                />
                <Container>
                    <AdvancedFiguresFilter
                        currentFilter={rawFiguresFilter}
                        initialFilter={initialFiguresFilter}
                        disabled={filterDisabled}
                        onFilterChange={setFilter}
                    />
                </Container>
                <ExtractionEntriesTable
                    className={styles.largeContainer}
                    entriesFilterState={entriesFilterState}
                    figuresFilterState={figuresFilterState}
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
                                onChange={handleQueryNameChange}
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
