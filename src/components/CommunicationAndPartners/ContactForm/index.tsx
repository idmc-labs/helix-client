import React, { useMemo, useState, useContext } from 'react';

import {
    TextInput,
    SelectInput,
    Button,
    TextArea,
} from '@togglecorp/toggle-ui';
import { unique } from '@togglecorp/fujs';

import {
    gql,
    useMutation,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';

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
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import {
    idCondition,
    requiredCondition,
    requiredStringCondition,
    emailCondition,
} from '#utils/validation';

import {
    ContactQuery,
    CreateContactMutation,
    CreateContactMutationVariables,
    UpdateContactMutation,
    UpdateContactMutationVariables,
    ContactOptionsForCommunicationFormQuery,
} from '#generated/types';

import OrganizationSelectInput, { OrganizationOption } from '#components/OrganizationSelectInput';
import CountrySelectInput from '#components/CountrySelectInput';
import CountryMultiSelectInput, { CountryOption } from '#components/CountryMultiSelectInput';
import Loading from '#components/Loading';
import AutoTextArea from '#components/AutoTextArea';

import styles from './styles.css';

const CONTACT_OPTIONS = gql`
    query ContactOptionsForCommunicationForm {
        designationList: __type(name: "DESIGNATION") {
            enumValues {
                name
                description
            }
        }
        genderList: __type(name: "GENDER") {
            enumValues {
                name
                description
            }
        }
    }
`;

const CREATE_CONTACT = gql`
    mutation CreateContact($contact: ContactCreateInputType!) {
        createContact(data: $contact) {
            result {
                id
                lastName
                phone
                organization {
                  id
                  name
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
            errors
        }
    }
`;

const UPDATE_CONTACT = gql`
    mutation UpdateContact($contact: ContactUpdateInputType!) {
        updateContact(data: $contact) {
            result {
                id
                fullName
                lastName
                phone
                organization {
                    id
                    name
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
            errors
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
                name
            }
            comment
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

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type ContactFormFields = CreateContactMutationVariables['contact'];
type FormType = PurgeNull<PartialForm<WithId<Omit<ContactFormFields, 'designation' | 'gender'> & {designation: BasicEntity['id'], gender: BasicEntity['id']}>>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        id: [idCondition],
        designation: [requiredCondition],
        firstName: [requiredStringCondition],
        lastName: [requiredStringCondition],
        gender: [requiredCondition],
        jobTitle: [requiredStringCondition],
        organization: [requiredCondition],
        countriesOfOperation: [requiredCondition],
        comment: [],
        country: [requiredCondition],
        email: [emailCondition],
        phone: [],
    }),
};

interface ContactFormProps {
    id: string | undefined;
    onHideAddContactModal: () => void;
    onAddContactCache: MutationUpdaterFn<CreateContactMutation>;
    defaultCountryOption?: CountryOption | undefined | null;
}

function ContactForm(props:ContactFormProps) {
    const {
        id,
        onAddContactCache,
        onHideAddContactModal,
        defaultCountryOption,
    } = props;

    const defaultFormValues: PartialForm<FormType> = useMemo(
        () => (defaultCountryOption ? { country: defaultCountryOption.id } : {}),
        [defaultCountryOption],
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
    const [
        organizationOptions,
        setOrganizationOptions,
    ] = useState<OrganizationOption[] | undefined | null>();
    const [
        countryOptions,
        setCountryOptions,
    ] = useState<CountryOption[] | undefined | null>(
        defaultCountryOption ? [defaultCountryOption] : undefined,
    );

    const {
        loading: contactDataLoading,
        error: contactDataError,
    } = useQuery<ContactQuery>(
        CONTACT,
        {
            skip: !id,
            variables: id ? { id } : undefined,
            onCompleted: (response) => {
                const { contact } = response;
                if (!contact) {
                    return;
                }

                const {
                    countriesOfOperation,
                    country: countryOfContact,
                } = contact;

                const countriesArray = [...countriesOfOperation];
                if (countryOfContact) {
                    countriesArray.push(countryOfContact);
                }
                const uniqueCountries = unique(countriesArray, (c) => c.id);

                setCountryOptions(uniqueCountries);

                if (contact?.organization) {
                    setOrganizationOptions([contact.organization]);
                }

                onValueSet(removeNull({
                    ...contact,
                    country: contact.country?.id,
                    countriesOfOperation: contact.countriesOfOperation.map((c) => c.id),
                    organization: contact.organization.id,
                }));
            },
        },
    );

    const {
        data: contactOptions,
        loading: contactOptionsLoading,
        error: contactOptionsError,
    } = useQuery<ContactOptionsForCommunicationFormQuery>(CONTACT_OPTIONS);

    const [
        createContact,
        { loading: createLoading },
    ] = useMutation<CreateContactMutation, CreateContactMutationVariables>(
        CREATE_CONTACT,
        {
            update: onAddContactCache,
            onCompleted: (response) => {
                const { createContact: createContactRes } = response;
                if (!createContactRes) {
                    return;
                }
                const { errors, result } = createContactRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Contact created successfully!' });
                    onPristineSet(true);
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
    ] = useMutation<UpdateContactMutation, UpdateContactMutationVariables>(
        UPDATE_CONTACT,
        {
            onCompleted: (response) => {
                const { updateContact: updateContactRes } = response;
                if (!updateContactRes) {
                    return;
                }
                const { errors, result } = updateContactRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                }
                if (result) {
                    notify({ children: 'Contact updated successfully!' });
                    onPristineSet(true);
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

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
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

    const designations = contactOptions?.designationList?.enumValues;
    const genders = contactOptions?.genderList?.enumValues;

    const loading = createLoading || contactDataLoading || updateLoading;
    const errored = !!contactDataError;
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
            <div className={styles.twoColumnRow}>
                <SelectInput
                    label="Designation *"
                    name="designation"
                    options={designations}
                    value={value.designation}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.designation}
                    disabled={disabled || contactOptionsLoading || !!contactOptionsError}
                />
                <SelectInput
                    label="Gender *"
                    name="gender"
                    options={genders}
                    value={value.gender}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.gender}
                    disabled={disabled || contactOptionsLoading || !!contactOptionsError}
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
                <CountrySelectInput
                    label="Country *"
                    options={countryOptions}
                    name="country"
                    onOptionsChange={setCountryOptions}
                    onChange={onValueChange}
                    value={value.country}
                    error={error?.fields?.country}
                    disabled={disabled}
                    readOnly={!!defaultCountryOption}
                />
                <CountryMultiSelectInput
                    options={countryOptions}
                    onOptionsChange={setCountryOptions}
                    label="Countries of Operation *"
                    name="countriesOfOperation"
                    value={value.countriesOfOperation}
                    onChange={onValueChange}
                    error={error?.fields?.countriesOfOperation}
                    disabled={disabled}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <OrganizationSelectInput
                    label="Organization *"
                    options={organizationOptions}
                    name="organization"
                    onOptionsChange={setOrganizationOptions}
                    onChange={onValueChange}
                    value={value.organization}
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
                <AutoTextArea
                    label="Comment"
                    onChange={onValueChange} // FIXME: onChange type mismatch
                    value={value.comment}
                    name="comment"
                    error={error?.fields?.comment}
                    disabled={disabled}
                />
            </div>
            {/* <div className={styles.row}>
                <TextArea
                    label="Comment"
                    onChange={onValueChange}
                    value={value.comment}
                    name="comment"
                    error={error?.fields?.comment}
                    disabled={disabled}
                />
            </div> */}
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onHideAddContactModal}
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

export default ContactForm;
