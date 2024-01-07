import React, { useCallback, useEffect } from 'react';
import {
    TextInput,
    Button,
    MultiSelectInput,
    DateRangeDualInput,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    PartialForm,
    PurgeNull,
    useForm,
    ObjectSchema,
    createSubmitHandler,
    arrayCondition,
} from '@togglecorp/toggle-form';
import { gql, useQuery } from '@apollo/client';
import {
    IoSearchOutline,
} from 'react-icons/io5';

import NonFieldError from '#components/NonFieldError';
import CountryMultiSelectInput from '#components/selections/CountryMultiSelectInput';
import BooleanInput from '#components/selections/BooleanInput';

import {
    ReportFilterOptionsQuery,
    ReportsQueryVariables,
} from '#generated/types';
import { enumKeySelector, enumLabelSelector } from '#utils/common';
import styles from './styles.css';

type ReportsFilterFields = NonNullable<ReportsQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<ReportsFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        filterFigureCountries: [arrayCondition],
        name_Unaccent_Icontains: [],
        reviewStatus: [arrayCondition],
        startDateAfter: [],
        endDateBefore: [],
        isPublic: [],
    }),
};

const STATUS_OPTIONS = gql`
    query ReportFilterOptions {
        reportReviewFilter: __type(name: "REPORT_REVIEW_FILTER") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

interface ReportFilterProps {
    className?: string;
    initialFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;
}

function ReportFilter(props: ReportFilterProps) {
    const {
        className,
        initialFilter,
        onFilterChange,
    } = props;

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(initialFilter, schema);
    // NOTE: Set the form value when initialFilter is changed on parent
    useEffect(
        () => {
            onValueSet(initialFilter);
        },
        [initialFilter, onValueSet],
    );

    const {
        data: statusOptions,
        loading: statusOptionsLoading,
        error: statusOptionsError,
    } = useQuery<ReportFilterOptionsQuery>(STATUS_OPTIONS);

    const onResetFilters = useCallback(
        () => {
            onValueSet(initialFilter);
            onFilterChange(initialFilter);
        },
        [onValueSet, onFilterChange, initialFilter],
    );

    const handleSubmit = useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        onFilterChange(finalValues);
    }, [onValueSet, onFilterChange]);

    const filterChanged = initialFilter !== value;

    return (
        <form
            className={_cs(className, styles.queryForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.contentContainer}>
                <TextInput
                    className={styles.input}
                    icons={<IoSearchOutline />}
                    label="Name"
                    name="name_Unaccent_Icontains"
                    value={value.name_Unaccent_Icontains}
                    onChange={onValueChange}
                    placeholder="Search"
                />
                <CountryMultiSelectInput
                    className={styles.input}
                    label="Countries"
                    name="filterFigureCountries"
                    value={value.filterFigureCountries}
                    onChange={onValueChange}
                    error={error?.fields?.filterFigureCountries?.$internal}
                />
                <MultiSelectInput
                    className={styles.input}
                    options={statusOptions?.reportReviewFilter?.enumValues}
                    label="Status"
                    name="reviewStatus"
                    value={value.reviewStatus}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.reviewStatus?.$internal}
                    disabled={statusOptionsLoading || !!statusOptionsError}
                />
                <BooleanInput
                    className={styles.input}
                    label="Public"
                    name="isPublic"
                    error={error?.fields?.isPublic}
                    value={value.isPublic}
                    onChange={onValueChange}
                />
                <DateRangeDualInput
                    className={styles.input}
                    label="Date Range"
                    fromName="startDateAfter"
                    fromValue={value.startDateAfter}
                    fromOnChange={onValueChange}
                    fromError={error?.fields?.startDateAfter}
                    toName="endDateBefore"
                    toValue={value.endDateBefore}
                    toOnChange={onValueChange}
                    toError={error?.fields?.endDateBefore}
                />
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset Filters"
                        disabled={!filterChanged}
                    >
                        Reset
                    </Button>
                    <Button
                        name={undefined}
                        type="submit"
                        title="Apply"
                        disabled={pristine}
                        variant="primary"
                    >
                        Apply
                    </Button>
                </div>
            </div>
        </form>
    );
}

export default ReportFilter;
