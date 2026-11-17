import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
    Button,
    DateInput,
    Modal,
    NumberInput,
    SortContext,
    TextArea,
    TextInput,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useMutation,
} from '@apollo/client';
import {
    ObjectSchema,
    PartialForm,
    PurgeNull,
    useForm,
    createSubmitHandler,
    removeNull,
    requiredCondition,
    requiredStringCondition,
} from '@togglecorp/toggle-form';

import FormActions from '#components/FormActions';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import useFigureTable from '#components/rawTables/useFigureTable';
import useFilterState from '#hooks/useFilterState';
import { transformToFormError } from '#utils/errorTransform';
import { urlConditionWithProtocolCheck } from '#utils/common';
import {
    CreateHouseholdSizeMutation,
    CreateHouseholdSizeMutationVariables,
    ExtractionFigureListQueryVariables,
    HouseholdSizeListQuery,
} from '#generated/types';

import styles from './styles.module.css';

const CREATE_HOUSEHOLD_SIZE = gql`
    mutation CreateHouseholdSize($data: HouseholdSizeCreateInputType!) {
        createHouseholdSize(data: $data) {
            errors
            ok
            result {
                id
            }
        }
    }
`;

type HouseholdSizeRecord = Pick<
    NonNullable<NonNullable<HouseholdSizeListQuery['householdSizeList']>['results']>[number],
    'id' | 'country' | 'year' | 'size' | 'dataSourceCategory' | 'source' | 'sourceLink' | 'referenceDate'
>;

type HouseholdSizeFormFields = CreateHouseholdSizeMutationVariables['data'];
type FormType = PurgeNull<PartialForm<HouseholdSizeFormFields>>;

type FormSchema = ObjectSchema<FormType>;
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        country: [requiredCondition],
        year: [requiredCondition],
        size: [requiredCondition],
        dataSourceCategory: [requiredStringCondition],
        source: [requiredStringCondition],
        sourceLink: [urlConditionWithProtocolCheck],
        referenceDate: [],
        notes: [],
    }),
};

const hiddenColumns: ('country' | 'select' | 'action')[] = ['country', 'select', 'action'];
const extraColumns: ('householdSize')[] = ['householdSize'];

interface AffectedFiguresModalProps {
    householdSizeId: string;
    disabled: boolean;
    onClose: () => void;
    onAbandon: () => void;
    onContinue: () => void;
}

function AffectedFiguresModal(props: AffectedFiguresModalProps) {
    const {
        householdSizeId,
        disabled,
        onClose,
        onAbandon,
        onContinue,
    } = props;

    const {
        page,
        rawPage,
        setPage,
        ordering,
        sortState,
        pageSize,
        rawPageSize,
        setPageSize,
    } = useFilterState<NonNullable<ExtractionFigureListQueryVariables['filters']>>({
        filter: {},
        ordering: {
            name: 'household_size',
            direction: 'asc',
        },
    });

    const variables = useMemo(
        (): ExtractionFigureListQueryVariables => ({
            ordering,
            page,
            pageSize,
            filters: { householdSizeId },
        }),
        [ordering, page, pageSize, householdSizeId],
    );

    const {
        totalCount,
        loading,
        errored,
        table,
        pager,
    } = useFigureTable({
        filters: variables,
        hiddenColumns,
        extraColumns,
        page: rawPage,
        pageSize: rawPageSize,
        onPageChange: setPage,
        onPageSizeChange: setPageSize,
        openLinksInNewTab: true,
    });

    return (
        <Modal
            heading={loading ? 'Affected figures' : `${totalCount} figures affected`}
            onClose={onClose}
            size="large"
            freeHeight
            footer={(
                <>
                    <Button
                        name={undefined}
                        onClick={onAbandon}
                        disabled={disabled}
                    >
                        Abandon
                    </Button>
                    <Button
                        name={undefined}
                        variant="primary"
                        onClick={onContinue}
                        disabled={disabled || loading || errored}
                    >
                        Continue
                    </Button>
                </>
            )}
        >
            <div className={styles.form}>
                {disabled && <Loading absolute />}
                <p>
                    Recommended household figures for this country and year.
                    Each figure keeps its own household size.
                    Sort on it to see which use the value being changed.
                </p>
                <SortContext.Provider value={sortState}>
                    {table}
                </SortContext.Provider>
                {pager}
            </div>
        </Modal>
    );
}

interface HouseholdSizeFormProps {
    householdSize: HouseholdSizeRecord;
    onFormCancel: () => void;
    onFormSave: () => void;
}

function HouseholdSizeForm(props: HouseholdSizeFormProps) {
    const {
        householdSize,
        onFormCancel,
        onFormSave,
    } = props;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const initialFormValues: PartialForm<FormType> = removeNull({
        country: householdSize.country.id,
        year: householdSize.year,
        size: householdSize.size,
        dataSourceCategory: householdSize.dataSourceCategory,
        source: householdSize.source,
        sourceLink: householdSize.sourceLink,
        referenceDate: householdSize.referenceDate,
    });

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onPristineSet,
    } = useForm(initialFormValues, schema);

    const [pendingValues, setPendingValues] = useState<PartialForm<FormType>>();

    const [
        createHouseholdSize,
        { loading: createLoading },
    ] = useMutation<CreateHouseholdSizeMutation, CreateHouseholdSizeMutationVariables>(
        CREATE_HOUSEHOLD_SIZE,
        {
            onCompleted: (response) => {
                const { createHouseholdSize: createHouseholdSizeRes } = response;
                if (!createHouseholdSizeRes) {
                    setPendingValues(undefined);
                    return;
                }
                const { errors, result } = createHouseholdSizeRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                    setPendingValues(undefined);
                }
                if (result) {
                    notify({
                        children: 'AHHS value updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onFormSave();
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
                setPendingValues(undefined);
            },
        },
    );

    const handleSubmit = useCallback(
        (finalValues: PartialForm<FormType>) => {
            setPendingValues(finalValues);
        },
        [],
    );

    const handleBack = useCallback(
        () => {
            if (!createLoading) {
                setPendingValues(undefined);
            }
        },
        [createLoading],
    );

    const handleContinue = useCallback(
        () => {
            createHouseholdSize({
                variables: {
                    data: pendingValues,
                } as CreateHouseholdSizeMutationVariables,
            });
        },
        [createHouseholdSize, pendingValues],
    );

    const disabled = createLoading;

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {pendingValues && (
                <AffectedFiguresModal
                    householdSizeId={householdSize.id}
                    disabled={disabled}
                    onClose={handleBack}
                    onAbandon={onFormCancel}
                    onContinue={handleContinue}
                />
            )}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <TextInput
                label="Country"
                name="countryName"
                value={householdSize.country.name}
                readOnly
            />
            <TextInput
                label="Year"
                name="yearDisplay"
                value={String(householdSize.year)}
                readOnly
            />
            <NumberInput
                label="AHHS *"
                name="size"
                value={value.size}
                onChange={onValueChange}
                error={error?.fields?.size}
                disabled={disabled}
                autoFocus
            />
            <DateInput
                label="Reference Date"
                name="referenceDate"
                value={value.referenceDate}
                onChange={onValueChange}
                error={error?.fields?.referenceDate}
                disabled={disabled}
            />
            <TextInput
                label="Data Source Category *"
                name="dataSourceCategory"
                value={value.dataSourceCategory}
                onChange={onValueChange}
                error={error?.fields?.dataSourceCategory}
                disabled={disabled}
            />
            <TextInput
                label="Source *"
                name="source"
                value={value.source}
                onChange={onValueChange}
                error={error?.fields?.source}
                disabled={disabled}
            />
            <TextInput
                label="Source Link"
                name="sourceLink"
                value={value.sourceLink}
                onChange={onValueChange}
                error={error?.fields?.sourceLink}
                disabled={disabled}
            />
            <TextArea
                label="Reason for Correction"
                name="notes"
                value={value.notes}
                onChange={onValueChange}
                error={error?.fields?.notes}
                disabled={disabled}
            />
            <FormActions>
                <Button
                    name={undefined}
                    onClick={onFormCancel}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    variant="primary"
                    disabled={disabled || pristine}
                >
                    Submit
                </Button>
            </FormActions>
        </form>
    );
}

export default HouseholdSizeForm;
