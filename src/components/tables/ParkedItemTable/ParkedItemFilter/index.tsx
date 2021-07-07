import React, { useCallback } from 'react';
import { TextInput, Button } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
} from '@togglecorp/toggle-form';

import {
    IoIosSearch,
} from 'react-icons/io';
import NonFieldError from '#components/NonFieldError';

import { PartialForm, PurgeNull } from '#types';
import { ParkedItemListQueryVariables } from '#generated/types';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type ParkedItemFilterFields = Omit<ParkedItemListQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<ParkedItemFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        title_Icontains: [],
        statusIn: [],
        assignedToIn: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    title_Icontains: undefined,
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
                <div className={styles.inputContainer}>
                    <TextInput
                        className={styles.input}
                        icons={<IoIosSearch />}
                        label="Search"
                        name="title_Icontains"
                        value={value.title_Icontains}
                        onChange={onValueChange}
                        error={error?.fields?.title_Icontains}
                    />
                </div>
                <div className={styles.formButtons}>
                    <Button
                        name={undefined}
                        onClick={onResetFilters}
                        title="Reset"
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

export default ParkedItemFilter;
