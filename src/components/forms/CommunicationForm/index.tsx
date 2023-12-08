import React, { useContext, useMemo, useCallback } from 'react';
import {
    TextInput,
    DateInput,
    SelectInput,
    Button,
    TextArea,
} from '@togglecorp/toggle-ui';
import {
    removeNull,
    ObjectSchema,
    useForm,
    createSubmitHandler,
    requiredCondition,
    idCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';

import {
    gql,
    useMutation,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';

import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';
import { WithId } from '#utils/common';

import { transformToFormError } from '#utils/errorTransform';
import {
    CommunicationMediumListQuery,
    CreateCommunicationMutation,
    CreateCommunicationMutationVariables,
    UpdateCommunicationMutation,
    UpdateCommunicationMutationVariables,
    CommunicationQuery,
    ContactType,
    CommunicationMediumType,
    ContactDataQuery,
    CommunicationQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const getKeySelectorValue = (data: CommunicationMediumType) => data.id;

const getLabelSelectorValue = (data: CommunicationMediumType) => data.name;

const countryKeySelector = (data: { id: string; idmcShortName: string }) => data.id;
const countryLabelSelector = (data: { id: string; idmcShortName: string }) => data.idmcShortName;

type CommunicationFormFields = CreateCommunicationMutationVariables['communication'];
type FormType = PurgeNull<PartialForm<WithId<CommunicationFormFields>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        subject: [requiredCondition],
        content: [requiredCondition],
        date: [],
        medium: [requiredCondition],
        contact: [],
        country: [requiredCondition],
    }),
};

const CREATE_COMMUNICATION = gql`
    mutation CreateCommunication($communication: CommunicationCreateInputType!) {
        createCommunication(data: $communication) {
            result {
                id
                content
                date
                medium {
                    id
                    name
                }
                subject
                contact {
                    id
                }
                country {
                    id
                }
            }
            errors
        }
    }
`;

const UPDATE_COMMUNICATION = gql`
    mutation UpdateCommunication($communication: CommunicationUpdateInputType!) {
        updateCommunication(data: $communication) {
            result {
                id
                content
                date
                medium {
                    id
                    name
                }
                subject
                contact {
                    id
                }
                country {
                    id
                }
            }
            errors
        }
    }
`;

const COMMUNICATION = gql`
    query Communication($id: ID!) {
        communication(id: $id) {
            id
            content
            date
            medium {
                id
                name
            }
            subject
            contact {
                id
            }
            country {
                id
            }
        }
    }
`;

const GET_MEDIUMS_LIST = gql`
    query CommunicationMediumList {
        communicationMediumList {
            results {
                id
                name
            }
        }
    }
`;

const CONTACT_DATA = gql`
    query ContactData($contact: ID!) {
        contact(id: $contact) {
            countriesOfOperation {
                id
                idmcShortName
            }
        }
    }
`;

const defaultFormValues: PartialForm<FormType> = {};

interface CommunicationFormProps {
    id: string | undefined;
    onHideAddCommunicationModal: () => void;
    onAddCommunicationCache: MutationUpdaterFn<CreateCommunicationMutation>;

    contact: ContactType['id'];
}

function CommunicationForm(props: CommunicationFormProps) {
    const {
        contact,
        onHideAddCommunicationModal,
        onAddCommunicationCache,
        id,
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

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const communicationVariables = useMemo(
        (): CommunicationQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: communicationDataLoading,
        error: communicationDataError,
    } = useQuery<CommunicationQuery>(
        COMMUNICATION,
        {
            skip: !communicationVariables,
            variables: communicationVariables,
            onCompleted: (response) => {
                const { communication } = response;
                if (!communication) {
                    return;
                }
                onValueSet(removeNull({
                    ...communication,
                    medium: communication.medium?.id,
                    contact: communication.contact.id,
                    country: communication.country?.id,
                }));
            },
        },
    );

    const {
        data: mediums,
        error: mediumsError,
        loading: mediumsLoading,
    } = useQuery<CommunicationMediumListQuery>(GET_MEDIUMS_LIST);

    const {
        data: countryData,
    } = useQuery<ContactDataQuery>(CONTACT_DATA, {
        variables: { contact },
    });

    const countryOptions = countryData?.contact?.countriesOfOperation;

    const [
        createCommunication,
        { loading: createLoading },
    ] = useMutation<CreateCommunicationMutation, CreateCommunicationMutationVariables>(
        CREATE_COMMUNICATION,
        {
            update: onAddCommunicationCache,
            onCompleted: (response) => {
                const { createCommunication: createCommunicationRes } = response;
                if (!createCommunicationRes) {
                    return;
                }
                const { errors, result } = createCommunicationRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (result) {
                    notify({
                        children: 'Communication created successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onHideAddCommunicationModal();
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const [
        updateCommunication,
        { loading: updateLoading },
    ] = useMutation<UpdateCommunicationMutation, UpdateCommunicationMutationVariables>(
        UPDATE_COMMUNICATION,
        {
            onCompleted: (response) => {
                const { updateCommunication: updateCommunicationRes } = response;
                if (!updateCommunicationRes) {
                    return;
                }
                const { errors, result } = updateCommunicationRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (result) {
                    notify({
                        children: 'Communication updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onHideAddCommunicationModal();
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = useCallback(
        (finalValues: PartialForm<FormType>) => {
            if (finalValues.id) {
                updateCommunication({
                    variables: {
                        communication: finalValues as WithId<CommunicationFormFields>,
                    },
                });
            } else {
                createCommunication({
                    variables: {
                        communication: {
                            ...finalValues as CommunicationFormFields,
                            contact,
                        },
                    },
                });
            }
        },
        [createCommunication, updateCommunication, contact],
    );

    const loading = createLoading || updateLoading || communicationDataLoading;
    const errored = !!communicationDataError;
    const disabled = loading || errored;

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <SelectInput
                label="Country *"
                name="country"
                options={countryOptions}
                value={value.country}
                keySelector={countryKeySelector}
                labelSelector={countryLabelSelector}
                onChange={onValueChange}
                error={error?.fields?.country}
                disabled={disabled}
                autoFocus
            />
            <Row>
                <DateInput
                    label="Date"
                    value={value.date}
                    onChange={onValueChange}
                    name="date"
                    error={error?.fields?.date}
                    disabled={disabled}
                />
                <SelectInput
                    label="Medium *"
                    name="medium"
                    options={mediums?.communicationMediumList?.results}
                    value={value.medium}
                    keySelector={getKeySelectorValue}
                    labelSelector={getLabelSelectorValue}
                    onChange={onValueChange}
                    error={error?.fields?.medium}
                    disabled={disabled || mediumsLoading || !!mediumsError}
                />
            </Row>
            <TextInput
                label="Subject *"
                value={value.subject}
                onChange={onValueChange}
                name="subject"
                error={error?.fields?.subject}
                disabled={disabled}
            />
            <TextArea
                label="Content *"
                value={value.content}
                onChange={onValueChange}
                name="content"
                error={error?.fields?.content}
                disabled={disabled}
            />
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onHideAddCommunicationModal}
                    disabled={disabled}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    name={undefined}
                    disabled={disabled || pristine}
                    variant="primary"
                >
                    Submit
                </Button>
            </div>
        </form>
    );
}

export default CommunicationForm;
