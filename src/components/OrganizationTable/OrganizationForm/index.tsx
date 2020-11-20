import React from 'react';

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

import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
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

const CREATE_ORGANIZATION_KIND = gql`
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
            errors {
                field
                messages
            }
        }
    }
`;

const UPDATE_ORGANIZATION_KIND = gql`
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
            errors {
                field
                messages
            }
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

const schema: Schema<FormType> = {
    fields: () => ({
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
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
        onValueSet,
    } = useForm(defaultFormValues, schema);

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
        error: organizationKindsLoadingError,
    } = useQuery<OrganizationKindListQuery>(GET_ORGANIZATION_KIND_LIST);

    const organizationKindList = organizationKinds?.organizationKindList?.results;

    const [
        createOrganization,
        { loading: createLoading },
    ] = useMutation<CreateOrganizationMutation, CreateOrganizationMutationVariables>(
        CREATE_ORGANIZATION_KIND,
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
        UPDATE_ORGANIZATION_KIND,
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

    const loading = organizationKindsLoading
        || createLoading || organizationDataLoading || updateLoading;
    const errored = !!organizationKindsLoadingError || !!organizationDataError;

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
                    disabled={disabled}
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
                    disabled={disabled}
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
