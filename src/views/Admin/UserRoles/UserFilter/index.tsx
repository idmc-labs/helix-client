import React, { useCallback, useMemo } from 'react';
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
import styles from './styles.css';

const regionalCoordinator: UserRole = 'REGIONAL_COORDINATOR';
const monitoringExpert: UserRole = 'MONITORING_EXPERT';

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
        fullName: [],
        roleIn: [],
        // isActive: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {
    fullName: undefined,
    roleIn: undefined,
    // isActive: undefined,
};

/*
const isActiveOptions = [
    { id: 'true', name: 'Yes' },
    { id: 'false', name: 'No' },
];
*/

interface UsersFilterProps {
    className?: string;
    initialFilter?: PartialForm<FormType>;
    onFilterChange: (value: PurgeNull<UserListQueryVariables>) => void;
}

/*
interface ActiveOption {
    key: boolean;
    label: string;
}
const isActiveOptions: ActiveOption[] = [
    { key: true, label: 'Yes' },
    { key: false, label: 'No' },
];
const keySelector = (item: ActiveOption) => item.key;
const labelSelector = (item: ActiveOption) => item.label;
*/

function UserFilter(props: UsersFilterProps) {
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

    const {
        data: rolesOptions,
        loading: rolesOptionsLoading,
        error: rolesOptionsError,
    } = useQuery<RolesListQuery>(GET_ROLES_LIST);

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
                    name="fullName"
                    value={value.fullName}
                    onChange={onValueChange}
                    error={error?.fields?.fullName}
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
                {/*
                <SelectInput
                    className={styles.input}
                    label="Active"
                    name="isActive"
                    options={isActiveOptions}
                    value={value.isActive}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.isActive}
                />
                */}
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

export default UserFilter;
