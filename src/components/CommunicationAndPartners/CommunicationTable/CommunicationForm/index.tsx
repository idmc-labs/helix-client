import React, { useContext, useMemo } from 'react';
import {
    TextInput,
    DateInput,
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
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';
import { CountryOption } from '#components/CountrySelectInput';

import useForm, { createSubmitHandler } from '#utils/form';
import { removeNull } from '#utils/schema';
import type { ObjectSchema } from '#utils/schema';
import { transformToFormError } from '#utils/errorTransform';

import {
    PartialForm,
    PurgeNull,
} from '#types';

import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';

import {
    requiredCondition,
    idCondition,
} from '#utils/validation';

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
} from '#generated/types';

import styles from './styles.css';

const getKeySelectorValue = (data: CommunicationMediumType) => data.id;

const getLabelSelectorValue = (data: CommunicationMediumType) => data.name;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type CommunicationFormFields = CreateCommunicationMutationVariables['communication'];
type FormType = PurgeNull<PartialForm<WithId<CommunicationFormFields>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        title: [],
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
                title
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
                title
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
            title
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
                name
            }
        }
    }
`;

interface CommunicationFormProps {
    contact: ContactType['id'];
    id: string | undefined;
    onHideAddCommunicationModal: () => void;
    onAddCommunicationCache: MutationUpdaterFn<CreateCommunicationMutation>;
    defaultCountry?: CountryOption | null;
}

function CommunicationForm(props:CommunicationFormProps) {
    const {
        contact,
        onHideAddCommunicationModal,
        onAddCommunicationCache,
        id,
        defaultCountry,
    } = props;

    const defaultFormValues: PartialForm<FormType> = useMemo(
        () => (defaultCountry ? { country: defaultCountry.id } : {}),
        [defaultCountry],
    );

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
        loading: communicationDataLoading,
        error: communicationDataError,
    } = useQuery<CommunicationQuery>(
        COMMUNICATION,
        {
            skip: !id,
            variables: id ? { id } : undefined,
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
                    notify({ children: 'Failed to create communication.' });
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Communication created successfully!' });
                    onPristineSet(true);
                    onHideAddCommunicationModal();
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to create communication.' });
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
                    notify({ children: 'Failed to update communication.' });
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Communication updated successfully!' });
                    onPristineSet(true);
                    onHideAddCommunicationModal();
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to update communication.' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback(
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
            <div className={styles.row}>
                <SelectInput
                    label="Country *"
                    name="country"
                    options={countryOptions}
                    value={value.country}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.country}
                    disabled={disabled}
                    readOnly={!!defaultCountry}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Title"
                    value={value.title}
                    onChange={onValueChange}
                    name="title"
                    error={error?.fields?.title}
                    disabled={disabled}
                />
            </div>
            <div className={styles.twoColumnRow}>
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
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Subject *"
                    value={value.subject}
                    onChange={onValueChange}
                    name="subject"
                    error={error?.fields?.subject}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <TextArea
                    label="Content *"
                    value={value.content}
                    onChange={onValueChange}
                    name="content"
                    error={error?.fields?.content}
                    disabled={disabled}
                />
            </div>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onHideAddCommunicationModal}
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

export default CommunicationForm;
