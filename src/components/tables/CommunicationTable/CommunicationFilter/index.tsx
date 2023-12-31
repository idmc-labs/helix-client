import React, { useCallback } from 'react';
import { TextInput, Button } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
} from '@togglecorp/toggle-form';

import {
    IoSearchOutline,
} from 'react-icons/io5';
import NonFieldError from '#components/NonFieldError';

import { PartialForm, PurgeNull } from '#types';
import { CommunicationListQueryVariables } from '#generated/types';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type CommunicationFilterFields = NonNullable<CommunicationListQueryVariables['filters']>;
type FormType = PurgeNull<PartialForm<CommunicationFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        subjectContains: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    subjectContains: undefined,
};

interface ContactsFilterProps {
    className?: string;
    initialFilter?: PartialForm<FormType>,
    onFilterChange: (value: PurgeNull<CommunicationFilterFields>) => void;
}

function ContactsFilter(props: ContactsFilterProps) {
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
    } = useForm(initialFilter ?? defaultFormValues, schema);

    const onResetFilters = useCallback(
        () => {
            onValueSet(defaultFormValues);
            onFilterChange(defaultFormValues);
        },
        [onValueSet, onFilterChange],
    );

    const handleSubmit = useCallback((finalValues: FormType) => {
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
                    icons={<IoSearchOutline />}
                    label="Subject"
                    name="subjectContains"
                    value={value.subjectContains}
                    onChange={onValueChange}
                    error={error?.fields?.subjectContains}
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

export default ContactsFilter;
