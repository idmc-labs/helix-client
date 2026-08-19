import React, { useCallback, useEffect } from 'react';
import { Button, MultiSelectInput, TextInput } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { IoSearchOutline } from 'react-icons/io5';

import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import {
    HulkBulkImportOptionsQuery,
    HulkBulkImportsListQueryVariables,
    Hulk_Bulk_Import_Status as HulkBulkImportStatus,
} from '#generated/types';
import NonFieldError from '#components/NonFieldError';
import UserMultiSelectInput from '#components/selections/UserMultiSelectInput';
import { PartialForm, PurgeNull, EnumEntity } from '#types';

import styles from './styles.module.css';

const HULK_BULK_IMPORT_OPTIONS = gql`
    query HulkBulkImportOptions {
        status: __type(name: "HULK_BULK_IMPORT_STATUS") {
            enumValues {
                name
                description
            }
        }
    }
`;

type HulkBulkImportFilterFields = NonNullable<HulkBulkImportsListQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<HulkBulkImportFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        search: [],
        statusList: [],
        createdByIds: [],
    }),
};

interface HulkBulkImportFilterProps {
    className?: string;
    initialFilter: PartialForm<FormType>;
    currentFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;
    onFilterReset: () => void;
    changed?: boolean;
}

function HulkBulkImportFilter(props: HulkBulkImportFilterProps) {
    const {
        className,
        initialFilter,
        currentFilter,
        onFilterChange,
        onFilterReset,
        changed = false,
    } = props;

    const {
        data: hulkBulkImportOptions,
        loading: hulkBulkImportOptionsLoading,
        error: hulkBulkImportOptionsError,
    } = useQuery<HulkBulkImportOptionsQuery>(HULK_BULK_IMPORT_OPTIONS);

    const statusOptions = hulkBulkImportOptions
        ?.status?.enumValues as EnumEntity<HulkBulkImportStatus>[] | undefined;

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

    const onResetFilters = useCallback(
        () => {
            onValueSet(initialFilter);
            onFilterReset();
        },
        [onValueSet, onFilterReset, initialFilter],
    );

    const handleSubmit = useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        onFilterChange(finalValues);
    }, [onValueSet, onFilterChange]);

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
                    label="Search"
                    name="search"
                    value={value.search}
                    onChange={onValueChange}
                    error={error?.fields?.search}
                />
                <UserMultiSelectInput
                    className={styles.input}
                    label="Created By"
                    name="createdByIds"
                    onChange={onValueChange}
                    value={value.createdByIds}
                    error={error?.fields?.createdByIds?.$internal}
                />
                <MultiSelectInput
                    className={styles.input}
                    label="Status"
                    name="statusList"
                    options={statusOptions}
                    value={value.statusList}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.statusList?.$internal}
                    disabled={hulkBulkImportOptionsLoading || !!hulkBulkImportOptionsError}
                />
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset"
                        disabled={pristine && !changed}
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

export default HulkBulkImportFilter;
