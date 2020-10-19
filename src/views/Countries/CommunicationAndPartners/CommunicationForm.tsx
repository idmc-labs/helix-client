import React from 'react';
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
    requiredStringCondition,
    emailCondition,
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

const schema: Schema<Partial<CommunicationFormFields>> = {
    fields: () => ({
        id: [],
        title: [],
        subject: [requiredCondition],
        content: [requiredCondition],
        dateTime: [],
        medium: [requiredCondition],
    }),
};

const defaultFormValues: Partial<CommunicationFormFields> = {
};

interface CreateCommunicationVariables {
    communication: CommunicationFormFields;
}

interface CreateCommunicationResponseFields {
    createCommunication: {
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

interface CommunicationFormProps {
    value?: Partial<CommunicationFormFields>;
    onCommunicationCreate?: (id: BasicEntity['id']) => void;
    contact: BasicEntity['id'];
    communicationOnEdit: CommunicationEntity | undefined;
}

function CommunicationForm(props:CommunicationFormProps) {
    const {
        value: initialFormValues = defaultFormValues,
        onCommunicationCreate,
        contact,
        communicationOnEdit,
    } = props;

    const {
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
    } = useForm(initialFormValues, schema);

    const [
        createCommunication,
    ] = useMutation<CreateCommunicationResponseFields, CreateCommunicationVariables>(
        CREATE_COMMUNICATION,
        {
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

    const handleSubmit = React.useCallback((finalValues: Partial<CommunicationFormFields>) => {
        const completeValue = finalValues as CommunicationFormFields;
        createCommunication({
            variables: {
                communication: {
                    ...completeValue,
                    contact,
                },
            },
        });
    }, [createCommunication, contact]);

    return (
        <form
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
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
