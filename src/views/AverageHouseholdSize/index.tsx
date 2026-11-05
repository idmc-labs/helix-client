import React, { useMemo, useCallback, useContext } from 'react';
import { getOperationName } from 'apollo-link';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import {
    Button,
    ConfirmButton,
    Modal,
    NumberInput,
    Pager,
    SortContext,
    Table,
} from '@togglecorp/toggle-ui';
import {
    ObjectSchema,
    PartialForm,
    useForm,
    createSubmitHandler,
    removeNull,
    requiredCondition,
    integerCondition,
} from '@togglecorp/toggle-form';

import Container from '#components/Container';
import DomainContext from '#components/DomainContext';
import Loading from '#components/Loading';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import PageHeader from '#components/PageHeader';
import TableMessage from '#components/TableMessage';
import {
    createTextColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import useFilterState from '#hooks/useFilterState';
import useModalState from '#hooks/useModalState';
import { PurgeNull } from '#types';
import { hasNoData } from '#utils/common';
import { transformToFormError } from '#utils/errorTransform';
import {
    CarryOverHouseholdSizeMutation,
    CarryOverHouseholdSizeMutationVariables,
    ExportHouseholdSizeMutation,
    ExportHouseholdSizeMutationVariables,
    HouseholdSizeListQuery,
    HouseholdSizeListQueryVariables,
} from '#generated/types';
import HouseholdSizeRecordsFilter from './HouseholdSizeRecordsFilter';
import styles from './styles.module.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const HOUSEHOLD_SIZE_LIST = gql`
    query HouseholdSizeList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: HouseholdSizeFilterDataTypeInputType!,
    ){
        householdSizeList(
            filters: $filters,
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize
        ) {
            page
            pageSize
            totalCount
            results {
                id
                size
                year
                source
                sourceLink
                notes
                gapFillingMethod
                gapFillingMethodDisplay
                referenceDate
                country {
                    id
                    iso3
                    name
                    countryCode
                }
            }
        }
    }
`;

const EXPORT_HOUSEHOLD_SIZE = gql`
    mutation ExportHouseholdSize(
        $filters: HouseholdSizeFilterDataTypeInputType!,
    ){
        exportHouseholdSize(filters: $filters){
            errors
            ok
          }
    }
`;

const CARRY_OVER_HOUSEHOLD_SIZE = gql`
    mutation CarryOverHouseholdSize($targetYear: Int!) {
        carryOverHouseholdSize(targetYear: $targetYear) {
            errors
            ok
            result {
                id
            }
        }
    }
`;

type HouseholdSizeFields = NonNullable<NonNullable<HouseholdSizeListQuery['householdSizeList']>['results']>[number];

type CarryOverFormType = PurgeNull<PartialForm<CarryOverHouseholdSizeMutationVariables>>;
type CarryOverFormSchema = ObjectSchema<CarryOverFormType>;
type CarryOverFormSchemaFields = ReturnType<CarryOverFormSchema['fields']>;

const carryOverSchema: CarryOverFormSchema = {
    fields: (): CarryOverFormSchemaFields => ({
        targetYear: [requiredCondition, integerCondition],
    }),
};

const carryOverDefaultValue: PartialForm<CarryOverFormType> = {};

const keySelector = (item: HouseholdSizeFields) => item.id;

interface AverageHouseholdSizeProps{
    className?: string;
}

function AverageHouseholdSize(props: AverageHouseholdSizeProps) {
    const { className } = props;

    const {
        page,
        rawPage,
        setPage,

        ordering,
        sortState,

        rawFilter,
        initialFilter,
        filter,
        setFilter,

        pageSize,
        rawPageSize,
        setPageSize,
    } = useFilterState<PurgeNull<NonNullable<HouseholdSizeListQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'year',
            direction: 'dsc',
        },
    });

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const householdSizeListVariables = useMemo(
        (): HouseholdSizeListQueryVariables => ({
            ordering,
            page,
            pageSize,
            filters: filter,
        }),
        [
            ordering,
            page,
            pageSize,
            filter,
        ],
    );

    const {
        previousData,
        data: householdSizeListData = previousData,
        loading: householdSizeDataLoading,
        error: householdSizeFetchError,
        refetch: refetchHouseholdSizeList,
    } = useQuery<HouseholdSizeListQuery, HouseholdSizeListQueryVariables>(HOUSEHOLD_SIZE_LIST, {
        variables: householdSizeListVariables,
    });

    const totalHouseholdSizeCount = householdSizeListData?.householdSizeList?.totalCount ?? 0;
    const householdSizeRecords = householdSizeListData?.householdSizeList?.results;

    const columns = useMemo(
        () => ([
            createTextColumn<HouseholdSizeFields, string>(
                'country',
                'Country',
                (item) => item.country.name,
                { sortable: true },
                'small',
            ),
            createTextColumn<HouseholdSizeFields, string>(
                'year',
                'Year',
                (item) => String(item.year),
                { sortable: true },
                'very-small',
            ),
            createDateColumn<HouseholdSizeFields, string>(
                'referenceDate',
                'Reference Date',
                (item) => item.referenceDate,
                { sortable: true },
            ),
            createNumberColumn<HouseholdSizeFields, string>(
                'size',
                'AHHS',
                (item) => item.size,
                { sortable: true },
                'small',
            ),
            createTextColumn<HouseholdSizeFields, string>(
                'source',
                'Source',
                (item) => item.source,
            ),
            createTextColumn<HouseholdSizeFields, string>(
                'gapFillingMethod',
                'Gap Filling Method',
                (item) => item.gapFillingMethodDisplay,
            ),
            createTextColumn<HouseholdSizeFields, string>(
                'notes',
                'Notes',
                (item) => item.notes,
                undefined,
                'large',
            ),
        ]),
        [],
    );
    const [
        exportHouseholdSizes,
        { loading: householdSizesExportPending },
    ] = useMutation<ExportHouseholdSizeMutation, ExportHouseholdSizeMutationVariables>(
        EXPORT_HOUSEHOLD_SIZE,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportHouseholdSize: exportHouseholdSizesResponse } = response;
                if (!exportHouseholdSizesResponse) {
                    return;
                }
                const { errors, ok } = exportHouseholdSizesResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({
                        children: 'Export started successfully!',
                    });
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
            },
        },
    );

    const { user } = useContext(DomainContext);
    const householdSizePermissions = user?.permissions?.householdsize;

    const [
        shouldShowCarryOverModal, ,
        showCarryOverModal,
        hideCarryOverModal,
    ] = useModalState();

    const {
        pristine,
        value: carryOverValue,
        error: carryOverError,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(carryOverDefaultValue, carryOverSchema);

    const handleCarryOverModalClose = useCallback(
        () => {
            onValueSet(carryOverDefaultValue);
            hideCarryOverModal();
        },
        [onValueSet, hideCarryOverModal],
    );

    const [
        carryOverHouseholdSize,
        { loading: carryOverPending },
    ] = useMutation<CarryOverHouseholdSizeMutation, CarryOverHouseholdSizeMutationVariables>(
        CARRY_OVER_HOUSEHOLD_SIZE,
        {
            onCompleted: (response) => {
                const { carryOverHouseholdSize: carryOverResponse } = response;
                if (!carryOverResponse) {
                    return;
                }
                const { errors, ok, result } = carryOverResponse;
                if (errors) {
                    onErrorSet(transformToFormError(removeNull(errors)));
                }
                if (ok) {
                    notify({
                        children: `${result?.length ?? 0} AHHS values carried over successfully!`,
                        variant: 'success',
                    });
                    refetchHouseholdSizeList();
                    handleCarryOverModalClose();
                }
            },
            onError: (error) => {
                onErrorSet({
                    $internal: error.message,
                });
            },
        },
    );

    const handleCarryOverSubmit = useCallback(
        (finalValue: CarryOverFormType) => {
            carryOverHouseholdSize({
                variables: finalValue as CarryOverHouseholdSizeMutationVariables,
            });
        },
        [carryOverHouseholdSize],
    );

    const handleExportTableData = useCallback(
        () => {
            exportHouseholdSizes({
                variables: {
                    filters: householdSizeListVariables.filters ?? {},
                },
            });
        },
        [
            exportHouseholdSizes,
            householdSizeListVariables?.filters,
        ],
    );

    return (
        <div className={_cs(styles.householdSize, className)}>
            <div className={styles.mainContent}>
                <PageHeader
                    title="AHHS"
                    actions={householdSizePermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showCarryOverModal}
                            variant="primary"
                        >
                            Carry Over
                        </Button>
                    )}
                />
                <Container
                    compactContent
                    contentClassName={styles.content}
                    heading="AHHS"
                    headerActions={(
                        <ConfirmButton
                            confirmationHeader="Confirm Export"
                            confirmationMessage="Are you sure you want to export this table data?"
                            name={undefined}
                            onConfirm={handleExportTableData}
                            disabled={householdSizesExportPending}
                        >
                            Export
                        </ConfirmButton>
                    )}
                    description={(
                        <HouseholdSizeRecordsFilter
                            currentFilter={rawFilter}
                            initialFilter={initialFilter}
                            onFilterChange={setFilter}
                        />
                    )}
                    footerContent={(
                        <Pager
                            activePage={rawPage}
                            itemsCount={totalHouseholdSizeCount}
                            maxItemsPerPage={rawPageSize}
                            onActivePageChange={setPage}
                            onItemsPerPageChange={setPageSize}
                        />
                    )}
                >
                    {householdSizeDataLoading && <Loading absolute />}
                    <SortContext.Provider value={sortState}>
                        {totalHouseholdSizeCount > 0 && (
                            <Table
                                className={styles.table}
                                data={householdSizeRecords}
                                keySelector={keySelector}
                                columns={columns}
                                resizableColumn
                                fixedColumnWidth
                            />
                        )}
                    </SortContext.Provider>
                    {!householdSizeDataLoading && (
                        <TableMessage
                            errored={!!householdSizeFetchError}
                            filtered={!hasNoData(filter)}
                            totalItems={totalHouseholdSizeCount}
                            emptyMessage="No AHHS data found"
                            emptyMessageWithFilters="No AHHS data found with applied filters"
                            errorMessage="Could not fetch AHHS data"
                        />
                    )}
                </Container>
            </div>
            {shouldShowCarryOverModal && (
                <Modal
                    onClose={handleCarryOverModalClose}
                    heading="Carry Over AHHS"
                    size="small"
                    freeHeight
                >
                    <form
                        className={styles.carryOverForm}
                        onSubmit={createSubmitHandler(
                            validate,
                            onErrorSet,
                            handleCarryOverSubmit,
                        )}
                    >
                        {carryOverPending && <Loading absolute />}
                        <NonFieldError>
                            {carryOverError?.$internal}
                        </NonFieldError>
                        <NumberInput
                            label="Target Year *"
                            name="targetYear"
                            value={carryOverValue.targetYear}
                            onChange={onValueChange}
                            error={carryOverError?.fields?.targetYear}
                            disabled={carryOverPending}
                            autoFocus
                        />
                        <div className={styles.formButtons}>
                            <Button
                                name={undefined}
                                onClick={handleCarryOverModalClose}
                                disabled={carryOverPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                name={undefined}
                                disabled={carryOverPending || pristine}
                                variant="primary"
                            >
                                Submit
                            </Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
export default AverageHouseholdSize;
