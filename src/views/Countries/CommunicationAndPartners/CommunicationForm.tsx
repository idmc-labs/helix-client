import React, { useEffect, useMemo } from 'react';
import { IoIosSearch } from 'react-icons/io';
import {
    TextInput,
    SelectInput,
    MultiSelectInput,
    Button,
    TextArea,
} from '@togglecorp/toggle-ui';

import {
    gql,
    useMutation,
} from '@apollo/client';

import Loading from '#components/Loading';
import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import { transformToFormError, ObjectError } from '#utils/errorTransform';

import {
    BasicEntity,
    CommunicationEntity,
    CommunicationFormFields,
} from '#types';

import {
    requiredCondition,
} from '#utils/validation';

import styles from './styles.css';

const mediumsList: BasicEntity[] = [
    {
        id: 'MAIL',
        name: 'Mail',
    },
    {
        id: 'PHONE',
        name: 'Phone',
    },
    {
        id: 'SKYPE',
        name: 'Skype',
    },
    {
        id: 'PERSONAL_MEETING',
        name: 'Personal Meeting',
    },
];

const getKeySelectorValue = (data: BasicEntity) => data.id;

const getLabelSelectorValue = (data: BasicEntity) => data.name;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };

const schema: Schema<Partial<WithId<CommunicationFormFields>>> = {
    fields: () => ({
        id: [],
        title: [],
        subject: [requiredCondition],
        content: [requiredCondition],
        dateTime: [],
        medium: [requiredCondition],
        contact: [],
    }),
};

const defaultFormValues: Partial<WithId<CommunicationFormFields>> = {};

interface CreateCommunicationVariables {
    communication: CommunicationFormFields;
}

interface UpdateCommunicationVariables {
    communication: WithId<CommunicationFormFields>;
}

interface CreateCommunicationResponseFields {
    createCommunication: {
        errors?: ObjectError[];
        communication: {
            id: string;
        }
    }
}

interface UpdateCommunicationResponseFields {
    updateCommunication: {
        errors?: ObjectError[];
        communication: {
            id: string;
        }
    }
}

const CREATE_COMMUNICATION = gql`
    mutation CreateCommunication($communication: CommunicationCreateInputType!) {
        createCommunication(communication: $communication) {
            communication {
                id
            }
            errors {
                field
                messages
            }
        }
    }
`;

const UPDATE_COMMUNICATION = gql`
mutation UpdateCommunication($communication: CommunicationUpdateInputType!) {
    updateCommunication(communication: $communication) {
            communication {
                id
            }
            errors {
                field
                messages
            }
        }
    }
`;

function tranformToFormField(communication: CommunicationEntity) {
    return {
        id: communication.id,
        title: communication.title ?? undefined,
        subject: communication.subject,
        content: communication.content,
        dateTime: communication.dateTime ?? undefined,
        medium: communication.medium,
        contact: communication.contact.id,
    };
}

interface CommunicationFormProps {
    onCommunicationCreate?: (id: BasicEntity['id']) => void;
    contact: BasicEntity['id'];
    communicationOnEdit: CommunicationEntity | undefined;
    onUpdateCommunicationCache: (cache, data) => void;
    onHideAddCommunicationModal: () => void;
}

function CommunicationForm(props:CommunicationFormProps) {
    const {
        onCommunicationCreate,
        contact,
        communicationOnEdit,
        onUpdateCommunicationCache,
        onHideAddCommunicationModal,
    } = props;

    const formValues = useMemo(() => {
        if (!communicationOnEdit) {
            return defaultFormValues;
        }
        const transformedCommunication = tranformToFormField(communicationOnEdit);
        return transformedCommunication;
    }, [communicationOnEdit]);

    const {
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
    } = useForm(formValues, schema);

    const [
        createCommunication,
        { loading: createLoading },
    ] = useMutation<CreateCommunicationResponseFields, CreateCommunicationVariables>(
        CREATE_COMMUNICATION,
        {
            update: onUpdateCommunicationCache,
            onCompleted: (response) => {
                if (response.createCommunication.errors) {
                    const formError = transformToFormError(response.createCommunication.errors);
                    onErrorSet(formError);
                } else if (onCommunicationCreate) {
                    onCommunicationCreate(response.createCommunication.communication?.id);
                }
            },
        },
    );

    const [
        updateCommunication,
        { loading: updateLoading },
    ] = useMutation<UpdateCommunicationResponseFields, UpdateCommunicationVariables>(
        UPDATE_COMMUNICATION,
        {
            update: onUpdateCommunicationCache,
            onCompleted: (response) => {
                if (response.updateCommunication.errors) {
                    const formError = transformToFormError(response.updateCommunication.errors);
                    onErrorSet(formError);
                } else if (onCommunicationCreate) {
                    onHideAddCommunicationModal();
                    // onCommunicationCreate(response.updateCommunication.communication.id);
                    // Implement cache update logic here
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const loading = createLoading || updateLoading;

    const handleSubmit = React.useCallback(
        (finalValues: Partial<WithId<CommunicationFormFields>>) => {
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
        }, [createCommunication, updateCommunication, contact],
    );

    return (
        <form
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {error?.$internal && (
                <p>
                    {error?.$internal}
                </p>
            )}
            <div className={styles.row}>
                <TextInput
                    label="Title"
                    value={value.title}
                    onChange={onValueChange}
                    name="title"
                    error={error?.fields?.title}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Subject *"
                    value={value.subject}
                    onChange={onValueChange}
                    name="subject"
                    error={error?.fields?.subject}
                />
            </div>
            <div className={styles.row}>
                <TextArea
                    label="Content *"
                    value={value.content}
                    onChange={onValueChange}
                    name="content"
                    error={error?.fields?.content}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Date Time"
                    value={value.dateTime}
                    onChange={onValueChange}
                    name="dateTime"
                    error={error?.fields?.dateTime}
                />
                <SelectInput
                    label="Medium *"
                    name="medium"
                    options={mediumsList}
                    value={value.medium}
                    keySelector={getKeySelectorValue}
                    labelSelector={getLabelSelectorValue}
                    onChange={onValueChange}
                    error={error?.fields?.medium}
                />
            </div>
            {/* TODO Add Loader */}
            {loading && <Loading message="loading..." />}
            <Button
                type="submit"
                name="submit"
            >
                Submit
            </Button>
        </form>
    );
}

export default CommunicationForm;
