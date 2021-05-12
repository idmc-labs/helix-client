import React, { useCallback } from 'react';
import { TextInput, Button, MultiSelectInput } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';
import {
    IoIosSearch,
} from 'react-icons/io';
import NonFieldError from '#components/NonFieldError';

import { EntriesQueryVariables, EntryFilterOptionsQuery } from '#generated/types';
import {
    arrayCondition,
} from '#utils/validation';
import styles from './styles.css';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

// eslint-disable-next-line @typescript-eslint/ban-types
type EntriesFilterFields = Omit<EntriesQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<EntriesFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        articleTitleContains: [],
        reviewStatus: [arrayCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    articleTitleContains: undefined,
    reviewStatus: undefined,
};

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

interface EntriesFilterProps {
    className?: string;
    setEntriesQueryFilters: React.Dispatch<React.SetStateAction<
        PurgeNull<EntriesQueryVariables> | undefined
    >>;
}

function EntriesFilter(props: EntriesFilterProps) {
    const {
        className,
        setEntriesQueryFilters,
    } = props;

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
            setEntriesQueryFilters(defaultFormValues);
        },
        [onValueSet, setEntriesQueryFilters],
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        setEntriesQueryFilters(finalValues);
    }, [onValueSet, setEntriesQueryFilters]);

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
                <div className={styles.inputContainer}>
                    <TextInput
                        className={styles.input}
                        icons={<IoIosSearch />}
                        label="Name"
                        name="articleTitleContains"
                        value={value.articleTitleContains}
                        onChange={onValueChange}
                        placeholder="Search"
                    />
                    <MultiSelectInput
                        className={styles.input}
                        options={statusOptions?.entryReviewStatus?.enumValues}
                        label="Status"
                        name="reviewStatus"
                        value={value.reviewStatus}
                        onChange={onValueChange}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        error={error?.fields?.reviewStatus?.$internal}
                        disabled={statusOptionsLoading || !!statusOptionsError}
                    />
                </div>
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

export default EntriesFilter;
