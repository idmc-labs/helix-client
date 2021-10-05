import React, { useState, useCallback } from 'react';
import { TextInput, Button, MultiSelectInput, DateInput } from '@togglecorp/toggle-ui';
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
    IoIosSearch,
} from 'react-icons/io';

import NonFieldError from '#components/NonFieldError';
import CountryMultiSelectInput, { CountryOption } from '#components/selections/CountryMultiSelectInput';
import BooleanInput from '#components/selections/BooleanInput';

import {
    ReportFilterOptionsQuery,
    ReportsQueryVariables,
} from '#generated/types';
import { enumKeySelector, enumLabelSelector } from '#utils/common';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type ReportsFilterFields = Omit<ReportsQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<ReportsFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        filterFigureCountries: [arrayCondition],
        name: [],
        reviewStatus: [arrayCondition],
        startDateAfter: [],
        endDateBefore: [],
        isPublic: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    filterFigureCountries: [],
    name: undefined,
    reviewStatus: [],
    isPublic: undefined,
    startDateAfter: undefined,
    endDateBefore: undefined,
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
    onFilterChange: (value: PurgeNull<ReportsQueryVariables>) => void;
}

function ReportFilter(props: ReportFilterProps) {
    const {
        className,
        onFilterChange,
    } = props;

    const [
        filterFigureCountries,
        setFilterFigureCountries,
    ] = useState<CountryOption[] | null | undefined>();

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(defaultFormValues, schema);

    const {
        data: statusOptions,
        loading: statusOptionsLoading,
        error: statusOptionsError,
    } = useQuery<ReportFilterOptionsQuery>(STATUS_OPTIONS);

    const onResetFilters = useCallback(
        () => {
            onValueSet(defaultFormValues);
            onFilterChange(defaultFormValues);
        },
        [onValueSet, onFilterChange],
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        onFilterChange(finalValues);
    }, [onValueSet, onFilterChange]);

    const filterChanged = defaultFormValues !== value;

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
                    icons={<IoIosSearch />}
                    label="Name"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    placeholder="Search"
                />
                <CountryMultiSelectInput
                    className={styles.input}
                    options={filterFigureCountries}
                    onOptionsChange={setFilterFigureCountries}
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
                    label="Is Report Private"
                    name="isPublic"
                    error={error?.fields?.isPublic}
                    value={value.isPublic}
                    onChange={onValueChange}
                />
                <DateInput
                    className={styles.input}
                    label="Start Date"
                    value={value.startDateAfter}
                    onChange={onValueChange}
                    name="startDateAfter"
                    error={error?.fields?.startDateAfter}
                />
                <DateInput
                    className={styles.input}
                    label="End Date"
                    value={value.endDateBefore}
                    onChange={onValueChange}
                    name="endDateBefore"
                    error={error?.fields?.endDateBefore}
                />
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset Filters"
                        disabled={!filterChanged}
                        className={styles.button}
                    >
                        Reset
                    </Button>
                    <Button
                        name={undefined}
                        type="submit"
                        title="Apply"
                        disabled={pristine}
                        className={styles.button}
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
