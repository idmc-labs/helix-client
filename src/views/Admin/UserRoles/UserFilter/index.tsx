import React, { useCallback } from 'react';
import { TextInput, Button, MultiSelectInput, SelectInput } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';

import {
    IoIosSearch,
} from 'react-icons/io';
import NonFieldError from '#components/NonFieldError';

import type { ObjectSchema } from '#utils/schema';
import useForm, { createSubmitHandler } from '#utils/form';
import {
    enumKeySelector,
    enumLabelSelector,
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';

import { PartialForm, PurgeNull } from '#types';
import { UserListQueryVariables, RolesListQuery } from '#generated/types';
import { emailCondition } from '#utils/validation';
import styles from './styles.css';

// eslint-disable-next-line @typescript-eslint/ban-types
type UserFilterFields = Omit<UserListQueryVariables, 'ordering' | 'page' | 'pageSize'>;
type FormType = PurgeNull<PartialForm<UserFilterFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const GET_ROLES_LIST = gql`
    query RolesList {
        roleList: __type(name: "USER_ROLE") {
            enumValues {
                name
                description
            }
        }
    }
`;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        email: [emailCondition],
        fullName: [],
        roleIn: [],
        isActive: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    email: undefined,
    fullName: undefined,
    roleIn: undefined,
    isActive: undefined,
};

const isActiveOptions = [
    { id: 'true', name: 'Yes' },
    { id: 'false', name: 'No' },
];

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

    const {
        data: rolesOptions,
        loading: rolesOptionsLoading,
        error: rolesOptionsError,
    } = useQuery<RolesListQuery>(GET_ROLES_LIST);

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
                    <MultiSelectInput
                        className={styles.input}
                        label="Role In*"
                        name="roleIn"
                        options={rolesOptions?.roleList?.enumValues}
                        value={value.roleIn}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        onChange={onValueChange}
                        error={error?.fields?.roleIn}
                        disabled={rolesOptionsLoading || !!rolesOptionsError}
                    />
                    <SelectInput
                        className={styles.input}
                        label="Is Active*"
                        name="isActive"
                        options={isActiveOptions}
                        value={value.isActive}
                        keySelector={basicEntityKeySelector}
                        labelSelector={basicEntityLabelSelector}
                        onChange={onValueChange}
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

export default UserFilter;
