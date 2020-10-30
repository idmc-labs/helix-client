import React from 'react';

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
    useQuery,
    ApolloCache,
    FetchResult,
} from '@apollo/client';

import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import { transformToFormError, ObjectError } from '#utils/errorTransform';

import {
    BasicEntity,
    ContactEntity,
    ContactFormFields,
    OrganizationEntity,
    PartialForm,
} from '#types';

import {
    requiredCondition,
    requiredStringCondition,
    emailCondition,
} from '#utils/validation';

import styles from './styles.css';

const designations: BasicEntity[] = [
    {
        id: 'MR',
        name: 'Mr.',
    },
    {
        id: 'MS',
        name: 'Ms.',
    },
];

const genders: BasicEntity[] = [
    {
        id: 'MALE',
        name: 'Male',
    },
    {
        id: 'FEMALE',
        name: 'Female',
    },
    {
        id: 'OTHERS',
        name: 'Others',
    },
];

const getKeySelectorValue = (data: BasicEntity) => data.id;

const getLabelSelectorValue = (data: BasicEntity) => data.name;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
const schema: Schema<PartialForm<WithId<ContactFormFields>>> = {
    fields: () => ({
        id: [],
        designation: [requiredCondition],
        firstName: [requiredStringCondition],
        lastName: [requiredStringCondition],
        gender: [requiredCondition],
        jobTitle: [requiredStringCondition],
        organization: [requiredCondition],
        countriesOfOperation: [],
        comment: [],
        country: [],
        email: [emailCondition],
        phone: [],
    }),
};

const defaultFormValues: PartialForm<ContactFormFields> = {};

interface CreateContactVariables {
    contact: ContactFormFields;
}

interface CreateContactResponseFields {
    createContact: {
        errors?: ObjectError[];
        contact: ContactEntity;
    }
}

interface UpdateContactVariables {
    contact: WithId<ContactFormFields>;
}

interface UpdateContactResponseFields {
    updateContact: {
        errors?: ObjectError[];
        contact: ContactEntity;
    }
}

const GET_COUNTRIES_LIST = gql`
query CountryList {
    countryList {
      results {
        id
        name
      }
    }
  }
`;

const GET_ORGANIZATIONS_LIST = gql`
query OrganizationList {
    organizationList {
      results {
        id
        title
      }
    }
  }
`;

const CREATE_CONTACT = gql`
    mutation CreateContact($contact: ContactCreateInputType!) {
        createContact(contact: $contact) {
            contact {
                id
                lastName
                phone
                organization {
                  id
                  title
                }
                jobTitle
                gender
                firstName
                email
                designation
                createdAt
                country {
                  id
                  name
                }
                countriesOfOperation {
                  id
                  name
                }
            }
            errors {
                field
                messages
            }
        }
    }
`;

const UPDATE_CONTACT = gql`
    mutation UpdateContact($contact: ContactUpdateInputType!) {
        updateContact(contact: $contact) {
            contact {
                id
                lastName
                phone
                organization {
                    id
                    title
                }
                jobTitle
                gender
                firstName
                email
                designation
                createdAt
                country {
                    id
                    name
                }
                countriesOfOperation {
                    id
                    name
                }
            }
            errors {
                field
                messages
            }
        }
    }
`;

const CONTACT = gql`
    query Contact($id: ID!) {
        contact(id: $id) {
            id
            lastName
            phone
            organization {
                id
                title
            }
            jobTitle
            gender
            firstName
            email
            designation
            createdAt
            country {
                id
                name
            }
            countriesOfOperation {
                id
                name
            }
        }
    }
`;

interface CountriesResponseFields {
    countryList: {
        results: BasicEntity[]
    }
}

interface OrganizationsResponseFields {
    organizationList: {
        results: OrganizationEntity[]
    }
}

interface ContactFormProps {
    id: string | undefined;
    onHideAddContactModal: () => void;
    onAddContactCache: (
        cache: ApolloCache<CreateContactResponseFields>,
        data: FetchResult<{
            createContact: {
                contact: ContactEntity;
            };
        }>
    ) => void;
    onUpdateContactCache: (
        cache: ApolloCache<UpdateContactResponseFields>,
        data: FetchResult<{
            updateContact: {
                contact: ContactEntity;
            };
        }>
    ) => void;
}

function ContactForm(props:ContactFormProps) {
    const {
        id,
        onAddContactCache,
        onUpdateContactCache,
        onHideAddContactModal,
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
        loading: contactDataLoading,
        error: contactDataError,
    } = useQuery(
        CONTACT,
        {
            skip: !id,
            variables: { id },
            onCompleted: (response) => {
                const { contact } = response;
                if (contact) {
                    onValueSet({
                        ...contact,
                        country: contact.country.id,
                        countriesOfOperation: contact.countriesOfOperation.map(
                            (c: BasicEntity) => c.id,
                        ),
                        organization: contact.organization.id,
                    });
                }
            },
        },
    );

    const {
        data: countries,
        loading: countriesLoading,
        error: countriesLoadingError,
    } = useQuery<CountriesResponseFields>(GET_COUNTRIES_LIST);

    const countriesList = countries?.countryList?.results ?? [];

    const {
        data: organizations,
        loading: organizationsLoading,
        error: organizationsLoadingError,
    } = useQuery<OrganizationsResponseFields>(GET_ORGANIZATIONS_LIST);

    const organizationsList = organizations?.organizationList?.results.map(
        (ol) => ({
            id: ol.id,
            name: ol.title,
        }),
    ) ?? [];

    const [
        createContact,
        { loading: createLoading },
    ] = useMutation<CreateContactResponseFields, CreateContactVariables>(
        CREATE_CONTACT,
        {
            update: onAddContactCache,
            onCompleted: (response) => {
                if (response.createContact.errors) {
                    const formError = transformToFormError(response.createContact.errors);
                    onErrorSet(formError);
                } else {
                    onHideAddContactModal();
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
        updateContact,
        { loading: updateLoading },
    ] = useMutation<UpdateContactResponseFields, UpdateContactVariables>(
        UPDATE_CONTACT,
        {
            update: onUpdateContactCache,
            onCompleted: (response) => {
                if (response.updateContact.errors) {
                    const formError = transformToFormError(response.updateContact.errors);
                    onErrorSet(formError);
                } else {
                    onHideAddContactModal();
                }
            },
            onError: (errors) => {
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    // TODO write editContactLoading
    const loading = countriesLoading || organizationsLoading
        || createLoading || contactDataLoading || updateLoading;
    const errored = !!countriesLoadingError || !!organizationsLoadingError || !!contactDataError;

    const disabled = loading || errored;

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<WithId<ContactFormFields>>) => {
            if (finalValues.id) {
                updateContact({
                    variables: {
                        contact: finalValues as WithId<ContactFormFields>,
                    },
                });
            } else {
                createContact({
                    variables: {
                        contact: finalValues as ContactFormFields,
                    },
                });
            }
        }, [createContact, updateContact],
    );

    //  FIXME: `value` prop on `input` should not be null
    return (
        <form
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            <div className={styles.twoColumnRow}>
                <SelectInput
                    label="Designation *"
                    name="designation"
                    options={designations}
                    value={value.designation}
                    keySelector={getKeySelectorValue}
                    labelSelector={getLabelSelectorValue}
                    onChange={onValueChange}
                    error={error?.fields?.designation}
                    disabled={disabled}
                />
                <SelectInput
                    label="Gender *"
                    name="gender"
                    options={genders}
                    value={value.gender}
                    keySelector={getKeySelectorValue}
                    labelSelector={getLabelSelectorValue}
                    onChange={onValueChange}
                    error={error?.fields?.gender}
                    disabled={disabled}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="First Name *"
                    value={value.firstName}
                    onChange={onValueChange}
                    name="firstName"
                    error={error?.fields?.firstName}
                    disabled={disabled}
                />
                <TextInput
                    label="Last Name *"
                    onChange={onValueChange}
                    value={value.lastName}
                    name="lastName"
                    error={error?.fields?.lastName}
                    disabled={disabled}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <SelectInput
                    label="Country *"
                    name="country"
                    options={countriesList}
                    value={value.country}
                    keySelector={getKeySelectorValue}
                    labelSelector={getLabelSelectorValue}
                    onChange={onValueChange}
                    error={error?.fields?.country}
                    disabled={disabled}
                />
                <MultiSelectInput
                    label="Countries of Operation *"
                    name="countriesOfOperation"
                    options={countriesList}
                    value={value.countriesOfOperation}
                    onChange={onValueChange}
                    keySelector={getKeySelectorValue}
                    labelSelector={getLabelSelectorValue}
                    error={error?.fields?.countriesOfOperation}
                    disabled={disabled}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <SelectInput
                    label="Organization *"
                    name="organization"
                    options={organizationsList}
                    value={value.organization}
                    keySelector={getKeySelectorValue}
                    labelSelector={getLabelSelectorValue}
                    onChange={onValueChange}
                    error={error?.fields?.organization}
                    disabled={disabled}
                />
                <TextInput
                    label="Job Title *"
                    onChange={onValueChange}
                    value={value.jobTitle}
                    name="jobTitle"
                    error={error?.fields?.jobTitle}
                    disabled={disabled}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Email"
                    onChange={onValueChange}
                    value={value.email}
                    name="email"
                    error={error?.fields?.email}
                    disabled={disabled}
                />
                <TextInput
                    label="Phone"
                    onChange={onValueChange}
                    value={value.phone}
                    name="phone"
                    error={error?.fields?.phone}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <TextArea
                    label="Comment"
                    onChange={onValueChange}
                    value={value.comment}
                    name="comment"
                    error={error?.fields?.comment}
                    disabled={disabled}
                />
            </div>
            <div className={styles.formButtons}>
                <Button
                    type="submit"
                    name="submit"
                    disabled={disabled}
                    className={styles.button}
                    variant="primary"
                >
                    Submit
                </Button>
                <Button
                    name={undefined}
                    onClick={onHideAddContactModal}
                    className={styles.button}
                    disabled={disabled}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}

export default ContactForm;
