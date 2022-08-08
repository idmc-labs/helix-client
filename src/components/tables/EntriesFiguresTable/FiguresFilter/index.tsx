import React, { useState, useCallback } from 'react';
import { TextInput, Button, MultiSelectInput } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
    PartialForm,
    PurgeNull,
    arrayCondition,
} from '@togglecorp/toggle-form';
import {
    IoIosSearch,
} from 'react-icons/io';
import NonFieldError from '#components/NonFieldError';
import OrganizationMultiSelectInput, { OrganizationOption } from '#components/selections/OrganizationMultiSelectInput';
import { EnumFix, enumKeySelector, enumLabelSelector } from '#utils/common';
import {
    EntryFilterOptionsQuery,
    LatestFigureListQueryVariables,
} from '#generated/types';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type FiguresFilterFields = Omit<LatestFigureListQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<EnumFix<FiguresFilterFields, 'filterEntryReviewStatus'>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const STATUS_OPTIONS = gql`
    query EntryFilterOptions {
        entryReviewStatus: __type(name: "REVIEW_STATUS") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        filterEntryArticleTitle: [],
        filterEntryReviewStatus: [arrayCondition],
        filterEntryPublishers: [arrayCondition],
        filterFigureSources: [arrayCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    filterEntryArticleTitle: undefined,
    filterEntryReviewStatus: undefined,
    filterEntryPublishers: undefined,
    filterFigureSources: undefined,
};

interface FiguresFilterProps {
    className?: string;
    onFilterChange: (value: PurgeNull<LatestFigureListQueryVariables>) => void;
}

function FiguresFilter(props: FiguresFilterProps) {
    const {
        className,
        onFilterChange,
    } = props;

    const [
        organizationOptions,
        setOrganizationOptions,
    ] = useState<OrganizationOption[] | undefined | null>();

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
    } = useQuery<EntryFilterOptionsQuery>(STATUS_OPTIONS);

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
                    name="filterEntryArticleTitle"
                    value={value.filterEntryArticleTitle}
                    onChange={onValueChange}
                    placeholder="Search by entry title or code"
                />
                <MultiSelectInput
                    className={styles.input}
                    options={statusOptions?.entryReviewStatus?.enumValues}
                    label="Statuses"
                    name="filterEntryReviewStatus"
                    value={value.filterEntryReviewStatus}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    error={error?.fields?.filterEntryReviewStatus?.$internal}
                    disabled={statusOptionsLoading || !!statusOptionsError}
                />
                <OrganizationMultiSelectInput
                    className={styles.input}
                    label="Publishers"
                    options={organizationOptions}
                    name="filterEntryPublishers"
                    onOptionsChange={setOrganizationOptions}
                    onChange={onValueChange}
                    value={value.filterEntryPublishers}
                    error={error?.fields?.filterEntryPublishers?.$internal}
                />
                <OrganizationMultiSelectInput
                    className={styles.input}
                    label="Sources"
                    options={organizationOptions}
                    name="filterFigureSources"
                    onOptionsChange={setOrganizationOptions}
                    onChange={onValueChange}
                    value={value.filterFigureSources}
                    error={error?.fields?.filterFigureSources?.$internal}
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

export default FiguresFilter;
