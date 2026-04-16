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
import styles from './styles.module.css';

type ReportsFilterFields = NonNullable<ReportsQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<ReportsFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        filterFigureCountries: [arrayCondition],
        search: [],
        reviewStatus: [arrayCondition],
        startDateAfter: [],
        endDateBefore: [],
        isPublic: [],
        isGiddReport: [],
        isPfaVisibleInGidd: [],
        changeInSource: [],
        changeInMethodology: [],
        changeInDataAvailability: [],
        retroactiveChange: [],
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
    currentFilter: PartialForm<FormType>;
    initialFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;
}

function ReportFilter(props: ReportFilterProps) {
    const {
        className,
        initialFilter,
        currentFilter,
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
    } = useForm(currentFilter, schema);
    // NOTE: Set the form value when initialFilter and currentFilter is changed on parent
    // We cannot only use initialFilter as it will change the form value when
    // currentFilter != initialFilter on mount
    useEffect(
        () => {
            if (initialFilter === currentFilter) {
                onValueSet(initialFilter);
            }
        },
        [currentFilter, initialFilter, onValueSet],
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
                    name="search"
                    value={value.search}
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
                    label="Public Report"
                    name="isPublic"
                    error={error?.fields?.isPublic}
                    value={value.isPublic}
                    onChange={onValueChange}
                />
                <BooleanInput
                    className={styles.input}
                    label="GRID Report"
                    name="isGiddReport"
                    error={error?.fields?.isGiddReport}
                    value={value.isGiddReport}
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
                <BooleanInput
                    className={styles.input}
                    label="Has Public Figure Analysis"
                    name="isPfaVisibleInGidd"
                    error={error?.fields?.isPfaVisibleInGidd}
                    value={value.isPfaVisibleInGidd}
                    onChange={onValueChange}
                />
                <BooleanInput
                    className={styles.input}
                    label="Has change in Source"
                    name="changeInSource"
                    error={error?.fields?.changeInSource}
                    value={value.changeInSource}
                    onChange={onValueChange}
                />
                <BooleanInput
                    className={styles.input}
                    label="Has change in Methodology"
                    name="changeInMethodology"
                    error={error?.fields?.changeInMethodology}
                    value={value.changeInMethodology}
                    onChange={onValueChange}
                />
                <BooleanInput
                    className={styles.input}
                    label="Has change in Data Availability"
                    name="changeInDataAvailability"
                    error={error?.fields?.changeInDataAvailability}
                    value={value.changeInDataAvailability}
                    onChange={onValueChange}
                />
                <BooleanInput
                    className={styles.input}
                    label="Has Retroactive Change"
                    name="retroactiveChange"
                    error={error?.fields?.retroactiveChange}
                    value={value.retroactiveChange}
                    onChange={onValueChange}
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
