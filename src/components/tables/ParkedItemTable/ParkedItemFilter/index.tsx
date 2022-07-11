import React, { useCallback, useState } from 'react';
import { TextInput, Button, MultiSelectInput } from '@togglecorp/toggle-ui';
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
import {
    IoIosSearch,
} from 'react-icons/io';

import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import {
    ParkedItemOptionsQuery,
    ParkedItemListQueryVariables,
} from '#generated/types';
import NonFieldError from '#components/NonFieldError';

import UserMultiSelectInput, { UserOption } from '#components/selections/UserMultiSelectInput';
import { PartialForm, PurgeNull } from '#types';
import styles from './styles.css';

const PARKING_LOT_OPTIONS = gql`
    query ParkedItemOptions {
        status: __type(name: "PARKING_LOT_STATUS") {
            enumValues {
                name
                description
            }
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type ParkedItemFilterFields = Omit<ParkedItemListQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<ParkedItemFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        title: [],
        statusIn: [],
        assignedToIn: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    title: undefined,
    statusIn: undefined,
    assignedToIn: undefined,
};

interface ParkedItemFilterProps {
    className?: string;
    onFilterChange: (value: PurgeNull<ParkedItemListQueryVariables>) => void;
}

function ParkedItemFilter(props: ParkedItemFilterProps) {
    const {
        className,
        onFilterChange,
    } = props;

    const {
        data: parkedItemOptions,
        loading: parkedItemOptionsLoading,
        error: parkedItemOptionsError,
    } = useQuery<ParkedItemOptionsQuery>(PARKING_LOT_OPTIONS);

    const statusOptions = parkedItemOptions?.status?.enumValues;

    const [
        assignedToOptions,
        setAssignedToOptions,
    ] = useState<UserOption[] | null | undefined>();

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(defaultFormValues, schema);

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
                    label="Search"
                    name="title"
                    value={value.title}
                    onChange={onValueChange}
                    error={error?.fields?.title}
                />
                <UserMultiSelectInput
                    className={styles.input}
                    label="Assignee"
                    options={assignedToOptions}
                    name="assignedToIn"
                    onOptionsChange={setAssignedToOptions}
                    onChange={onValueChange}
                    value={value.assignedToIn}
                    error={error?.fields?.assignedToIn?.$internal}
                />
                <MultiSelectInput
                    className={styles.input}
                    label="Status"
                    name="statusIn"
                    options={statusOptions}
                    value={value.statusIn}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.statusIn?.$internal}
                    disabled={parkedItemOptionsLoading || !!parkedItemOptionsError}
                />
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset"
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

export default ParkedItemFilter;
