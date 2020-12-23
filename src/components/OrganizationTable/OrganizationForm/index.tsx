import React, { useContext } from 'react';

import {
    TextInput,
    SelectInput,
    Button,
    TextArea,
} from '@togglecorp/toggle-ui';

import {
    gql,
    useMutation,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';

import useForm, { createSubmitHandler } from '#utils/form';
import type { ObjectSchema } from '#utils/schema';
import { removeNull } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';

import {
    BasicEntity,
    PartialForm,
    PurgeNull,
} from '#types';

import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';

import {
    idCondition,
    requiredStringCondition,
    lengthSmallerThanCondition,
} from '#utils/validation';

import {
    OrganizationKindListQuery,
    OrganizationQuery,
    CreateOrganizationMutation,
    CreateOrganizationMutationVariables,
    UpdateOrganizationMutation,
    UpdateOrganizationMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_ORGANIZATION_KIND_LIST = gql`
    query OrganizationKindList {
        organizationKindList {
            results {
                id
                name
            }
        }
    }
`;

const CREATE_ORGANIZATION = gql`
    mutation CreateOrganization($organization: OrganizationCreateInputType!) {
        createOrganization(data: $organization) {
            result {
                id
                name
                shortName
                organizationKind {
                    id
                    name
                  createdAt
                }
                methodology
                breakdown
            }
            errors
        }
    }
`;

const UPDATE_ORGANIZATION = gql`
    mutation UpdateOrganization($organization: OrganizationUpdateInputType!) {
        updateOrganization(data: $organization) {
            result {
                id
                name
                shortName
                organizationKind {
                    id
                    name
                  createdAt
                }
                methodology
                breakdown
            }
            errors
        }
    }
`;

const ORGANIZATION = gql`
    query Organization($id: ID!) {
        organization(id: $id) {
            id
            name
            shortName
            organizationKind {
                id
                name
            }
            methodology
            breakdown
        }
    }
`;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type OrganizationFormFields = CreateOrganizationMutationVariables['organization'];
type FormType = PurgeNull<PartialForm<WithId<Omit<OrganizationFormFields, 'designation' | 'gender'> & {designation: BasicEntity['id'], gender: BasicEntity['id']}>>>;
type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        organizationKind: [],
        shortName: [requiredStringCondition, lengthSmallerThanCondition(6)],
        name: [requiredStringCondition],
        methodology: [requiredStringCondition],
        breakdown: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface OrganizationFormProps {
    id?: string | undefined;
    onHideAddOrganizationModal: () => void;
    onAddOrganizationCache: MutationUpdaterFn<CreateOrganizationMutation>;
}

function OrganizationForm(props:OrganizationFormProps) {
    const {
        id,
        onAddOrganizationCache,
        onHideAddOrganizationModal,
    } = props;

    const {
        pristine,
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
        onPristineSet,
    } = useForm(defaultFormValues, schema);

    const { notify } = useContext(NotificationContext);

    const {
        loading: organizationDataLoading,
        error: organizationDataError,
    } = useQuery<OrganizationQuery>(
        ORGANIZATION,
        {
            skip: !id,
            variables: id ? { id } : undefined,
            onCompleted: (response) => {
                const { organization } = response;

                if (!organization) {
                    return;
                }
                onValueSet(removeNull({
                    ...organization,
                    organizationKind: organization.organizationKind?.id,
                }));
            },
        },
    );

    const {
        data: organizationKinds,
        loading: organizationKindsLoading,
        error: organizationKindsError,
    } = useQuery<OrganizationKindListQuery>(GET_ORGANIZATION_KIND_LIST);

    const [
        createOrganization,
        { loading: createLoading },
    ] = useMutation<CreateOrganizationMutation, CreateOrganizationMutationVariables>(
        CREATE_ORGANIZATION,
        {
            update: onAddOrganizationCache,
            onCompleted: (response) => {
                const { createOrganization: createOrganizationRes } = response;
                if (!createOrganizationRes) {
                    return;
                }
                const { errors, result } = createOrganizationRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Organization created successfully!' });
                    onPristineSet(true);
                    onHideAddOrganizationModal();
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const [
        updateOrganization,
        { loading: updateLoading },
    ] = useMutation<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>(
        UPDATE_ORGANIZATION,
        {
            onCompleted: (response) => {
                const { updateOrganization: updateOrganizationRes } = response;
                if (!updateOrganizationRes) {
                    return;
                }
                const { errors, result } = updateOrganizationRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Organization updated successfully!' });
                    onPristineSet(true);
                    onHideAddOrganizationModal();
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const organizationKindList = organizationKinds?.organizationKindList?.results;

    const loading = createLoading || organizationDataLoading || updateLoading;
    const errored = !!organizationDataError;
    const disabled = loading || errored;

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
            if (finalValues.id) {
                updateOrganization({
                    variables: {
                        organization: finalValues as WithId<OrganizationFormFields>,
                    },
                });
            } else {
                createOrganization({
                    variables: {
                        organization: finalValues as OrganizationFormFields,
                    },
                });
            }
        }, [createOrganization, updateOrganization],
    );

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Name *"
                    value={value.name}
                    onChange={onValueChange}
                    name="name"
                    error={error?.fields?.name}
                    disabled={disabled}
                />
                <TextInput
                    label="Short Name *"
                    value={value.shortName}
                    onChange={onValueChange}
                    name="shortName"
                    error={error?.fields?.shortName}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <SelectInput
                    label="Organization Type"
                    name="organizationKind"
                    options={organizationKindList}
                    value={value.organizationKind}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.organizationKind}
                    disabled={disabled || organizationKindsLoading || !!organizationKindsError}
                />
            </div>
            <div className={styles.row}>
                <TextArea
                    label="Methodology *"
                    onChange={onValueChange}
                    value={value.methodology}
                    name="methodology"
                    error={error?.fields?.methodology}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <TextArea
                    label="Breakdown"
                    onChange={onValueChange}
                    value={value.breakdown}
                    name="breakdown"
                    error={error?.fields?.breakdown}
                    disabled={disabled}
                />
            </div>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onHideAddOrganizationModal}
                    className={styles.button}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
                    className={styles.button}
                    variant="primary"
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default OrganizationForm;
