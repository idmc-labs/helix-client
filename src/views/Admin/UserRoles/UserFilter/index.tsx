import React, { useCallback } from 'react';
import { TextInput, Button } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import {
    IoIosSearch,
} from 'react-icons/io';
import NonFieldError from '#components/NonFieldError';

import type { ObjectSchema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';

import { PartialForm, PurgeNull } from '#types';
import { UserListQueryVariables } from '#generated/types';
import {
    arrayCondition,
} from '#utils/validation';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type UserFilterFields = Omit<UserListQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<UserFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        email: [arrayCondition],
        fullName: [arrayCondition],
        role: [arrayCondition],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    email: undefined,
    fullName: undefined,
    role: undefined,
};

interface UsersFilterProps {
    className?: string;
    setUsersQueryFilters: React.Dispatch<React.SetStateAction<
        PurgeNull<UserListQueryVariables> | undefined
    >>;
}

function UserFilter(props: UsersFilterProps) {
    const {
        className,
        setUsersQueryFilters,
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
            setUsersQueryFilters(defaultFormValues);
        },
        [onValueSet, setUsersQueryFilters],
    );

    const handleSubmit = React.useCallback((finalValues: FormType) => {
        onValueSet(finalValues);
        setUsersQueryFilters(finalValues);
    }, [onValueSet, setUsersQueryFilters]);

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
                        name="fullName"
                        value={value.fullName}
                        onChange={onValueChange}
                        placeholder="Search Name"
                    />
                    <TextInput
                        className={styles.input}
                        icons={<IoIosSearch />}
                        label="Email"
                        name="email"
                        value={value.email}
                        onChange={onValueChange}
                        placeholder="Search Email"
                    />
                    <TextInput
                        className={styles.input}
                        icons={<IoIosSearch />}
                        label="Role"
                        name="role"
                        value={value.role}
                        onChange={onValueChange}
                        placeholder="Search Role"
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

export default UserFilter;
