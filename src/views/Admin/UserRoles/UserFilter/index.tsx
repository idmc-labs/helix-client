import React, { useCallback, useMemo, useEffect } from 'react';
import { TextInput, Button, MultiSelectInput } from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';
import {
    ObjectSchema,
    useForm,
    createSubmitHandler,
} from '@togglecorp/toggle-form';
import {
    IoSearchOutline,
} from 'react-icons/io5';

import BooleanInput from '#components/selections/BooleanInput';
import NonFieldError from '#components/NonFieldError';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import { PartialForm, PurgeNull } from '#types';
import {
    UserListQueryVariables,
    RolesListQuery,
    User_Role as UserRole,
} from '#generated/types';
import styles from './styles.module.css';

const regionalCoordinator: UserRole = 'REGIONAL_COORDINATOR';
const monitoringExpert: UserRole = 'MONITORING_EXPERT';

type UserFilterFields = NonNullable<UserListQueryVariables['filters']>;
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
        search: [],
        roleIn: [],
        isActive: [],
    }),
};

interface UsersFilterProps {
    className?: string;
    initialFilter: PartialForm<FormType>;
    currentFilter: PartialForm<FormType>;
    onFilterChange: (value: PartialForm<FormType>) => void;
    onFilterReset: () => void;
    changed?: boolean;
}

function UserFilter(props: UsersFilterProps) {
    const {
        className,
        initialFilter,
        currentFilter,
        onFilterChange,
        onFilterReset,
        changed = false,
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
        data: rolesOptions,
        loading: rolesOptionsLoading,
        error: rolesOptionsError,
    } = useQuery<RolesListQuery>(GET_ROLES_LIST);

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

    const roleOptionsForPortfolio = useMemo(
        () => rolesOptions
            ?.roleList
            ?.enumValues
            // eslint-disable-next-line max-len
            ?.filter((item) => (item.name === regionalCoordinator || item.name === monitoringExpert)),
        [rolesOptions],
    );

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
                    error={error?.fields?.search}
                />
                <MultiSelectInput
                    className={styles.input}
                    label="Roles"
                    name="roleIn"
                    options={roleOptionsForPortfolio}
                    value={value.roleIn}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.roleIn?.$internal}
                    disabled={rolesOptionsLoading || !!rolesOptionsError}
                />
                <BooleanInput
                    className={styles.input}
                    label="Active"
                    name="isActive"
                    value={value.isActive}
                    onChange={onValueChange}
                    error={error?.fields?.isActive}
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

export default UserFilter;
