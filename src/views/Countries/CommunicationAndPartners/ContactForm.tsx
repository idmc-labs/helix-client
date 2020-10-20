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
} from '@apollo/client';

import useForm, { createSubmitHandler } from '#utils/form';
import type { Schema } from '#utils/schema';
import { transformToFormError, ObjectError } from '#utils/errorTransform';

import {
    BasicEntity,
    ContactFormFields,
    OrganizationEntity,
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

const schema: Schema<Partial<ContactFormFields>> = {
    fields: () => ({
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

const defaultFormValues: Partial<ContactFormFields> = {
    countriesOfOperation: [],
};

interface CreateContactVariables {
    contact: ContactFormFields;
}

interface CreateContactResponseFields {
    createContact: {
        errors?: ObjectError[];
        contact: {
            id: string;
        }
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
    value?: Partial<ContactFormFields>;
    onContactCreate?: (id: BasicEntity['id']) => void;
}

function ContactForm(props:ContactFormProps) {
    const {
        value: initialFormValues = defaultFormValues,
        onContactCreate,
    } = props;

    const {
        value,
        error,
        onValueChange,
        validate,
        onErrorSet,
    } = useForm(initialFormValues, schema);

    const {
        data: countries,
        refetch: refetchCountries,
        loading: countriesLoading,
    } = useQuery<CountriesResponseFields>(GET_COUNTRIES_LIST);

    const countriesList = countries?.countryList?.results ?? [];

    const {
        data: organizations,
        refetch: refetchOrganizations,
        loading: organizationsLoading,
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
            onCompleted: (response) => {
                if (response.createContact.errors) {
                    const formError = transformToFormError(response.createContact.errors);
                    onErrorSet(formError);
                } else if (onContactCreate) {
                    onContactCreate(response.createContact.contact?.id);
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
    const loading = countriesLoading || organizationsLoading || createLoading;

    const handleSubmit = React.useCallback((finalValues: Partial<ContactFormFields>) => {
        const completeValue = finalValues as ContactFormFields;
        console.log(completeValue);
        createContact({
            variables: {
                contact: completeValue,
            },
        });
    }, [createContact]);
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
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="First Name *"
                    value={value.firstName}
                    onChange={onValueChange}
                    name="firstName"
                    error={error?.fields?.firstName}
                />
                <TextInput
                    label="Last Name *"
                    onChange={onValueChange}
                    value={value.lastName}
                    name="lastName"
                    error={error?.fields?.lastName}
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
                />
                <MultiSelectInput
                    label="Countries of Operation *"
                    name="countriesOfOperation"
                    options={countriesList}
                    value={value.countriesOfOperation}
                    onChange={onValueChange}
                    keySelector={getKeySelectorValue}
                    labelSelector={getLabelSelectorValue}
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
                />
                <TextInput
                    label="Job Title *"
                    onChange={onValueChange}
                    value={value.jobTitle}
                    name="jobTitle"
                    error={error?.fields?.jobTitle}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Email"
                    onChange={onValueChange}
                    value={value.email}
                    name="email"
                    error={error?.fields?.email}
                />
                <TextInput
                    label="Phone"
                    onChange={onValueChange}
                    value={value.phone}
                    name="phone"
                    error={error?.fields?.phone}
                />
            </div>
            <div className={styles.row}>
                <TextArea
                    label="Comment"
                    onChange={onValueChange}
                    value={value.comment}
                    name="comment"
                    error={error?.fields?.comment}
                />
            </div>
            <Button
                type="submit"
                name="submit"
                disabled={loading}
            >
                Submit
            </Button>
        </form>
    );
}

export default ContactForm;
