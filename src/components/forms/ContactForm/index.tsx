import React, { useMemo, useContext, useCallback } from 'react';

import {
    TextInput,
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
    requiredListCondition,
    requiredStringCondition,
    idCondition,
    arrayCondition,
    emailCondition,
    PartialForm,
    PurgeNull,
} from '@togglecorp/toggle-form';

import {
    gql,
    useMutation,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';

import useOptions from '#hooks/useOptions';
import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';

import { transformToFormError } from '#utils/errorTransform';

import {
    enumKeySelector,
    enumLabelSelector,
    WithId,
    GetEnumOptions,
} from '#utils/common';

import {
    ContactQuery,
    CreateContactMutation,
    CreateContactMutationVariables,
    UpdateContactMutation,
    UpdateContactMutationVariables,
    ContactOptionsForCommunicationFormQuery,
    ContactQueryVariables,
} from '#generated/types';

import OrganizationSelectInput from '#components/selections/OrganizationSelectInput';
import CountrySelectInput from '#components/selections/CountrySelectInput';
import CountryMultiSelectInput from '#components/selections/CountryMultiSelectInput';
import Loading from '#components/Loading';

import styles from './styles.css';

const CONTACT_OPTIONS = gql`
    query ContactOptionsForCommunicationForm {
        designationList: __type(name: "DESIGNATION") {
            enumValues {
                name
                description
            }
        }
        genderList: __type(name: "GENDER_TYPE") {
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
                    idmcShortName
                }
                countriesOfOperation {
                    id
                    idmcShortName
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
                    idmcShortName
                }
                countriesOfOperation {
                    id
                    idmcShortName
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
                countries {
                    id
                    idmcShortName
                }
            }
            jobTitle
            comment
            gender
            firstName
            email
            designation
            createdAt
            country {
                id
                idmcShortName
            }
            countriesOfOperation {
                id
                idmcShortName
            }
        }
    }
`;

type ContactFormFields = CreateContactMutationVariables['contact'];
type FormType = PurgeNull<PartialForm<WithId<ContactFormFields>>>;

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
        organization: [],
        countriesOfOperation: [requiredListCondition, arrayCondition],
        comment: [],
        country: [],
        email: [emailCondition],
        phone: [],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface ContactFormProps {
    id: string | undefined;
    onHideAddContactModal: () => void;
    onAddContactCache: MutationUpdaterFn<CreateContactMutation>;
}

function ContactForm(props: ContactFormProps) {
    const {
        id,
        onAddContactCache,
        onHideAddContactModal,
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

    const [, setOrganizationOptions] = useOptions('organization');
    const [, setCountryOptions] = useOptions('country');

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const contactVariables = useMemo(
        (): ContactQueryVariables | undefined => (
            id ? { id } : undefined
        ),
        [id],
    );

    const {
        loading: contactDataLoading,
        error: contactDataError,
    } = useQuery<ContactQuery>(
        CONTACT,
        {
            skip: !contactVariables,
            variables: contactVariables,
            onCompleted: (response) => {
                const { contact } = response;
                if (!contact) {
                    return;
                }

                const {
                    countriesOfOperation,
                    country: countryOfContact,
                } = contact;

                setCountryOptions(countriesOfOperation);
                if (countryOfContact) {
                    setCountryOptions([countryOfContact]);
                }

                if (contact?.organization) {
                    setOrganizationOptions([contact.organization]);
                }

                onValueSet(removeNull({
                    ...contact,
                    country: contact.country?.id,
                    countriesOfOperation: contact.countriesOfOperation.map((c) => c.id),
                    organization: contact.organization?.id,
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
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (result) {
                    notify({
                        children: 'Contact created successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onHideAddContactModal();
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
                    notifyGQLError(errors);
                    onErrorSet(formError);
                }
                if (result) {
                    notify({
                        children: 'Contact updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
                    onHideAddContactModal();
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

    type DesignationOptions = GetEnumOptions<
        typeof designations,
        NonNullable<typeof value.designation>
    >;
    type GenderOptions = GetEnumOptions<
        typeof genders,
        NonNullable<typeof value.gender>
    >;

    return (
        <form
            className={styles.form}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
        >
            {loading && <Loading absolute />}
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <TextInput
                    label="First Name *"
                    value={value.firstName}
                    onChange={onValueChange}
                    name="firstName"
                    error={error?.fields?.firstName}
                    disabled={disabled}
                    autoFocus
                />
                <TextInput
                    label="Last Name *"
                    onChange={onValueChange}
                    value={value.lastName}
                    name="lastName"
                    error={error?.fields?.lastName}
                    disabled={disabled}
                />
            </Row>
            <Row>
                <SelectInput
                    label="Designation *"
                    name="designation"
                    options={designations as DesignationOptions}
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
                    options={genders as GenderOptions}
                    value={value.gender}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.gender}
                    disabled={disabled || contactOptionsLoading || !!contactOptionsError}
                />
            </Row>
            <Row>
                <CountrySelectInput
                    label="Country"
                    name="country"
                    onChange={onValueChange}
                    value={value.country}
                    error={error?.fields?.country}
                    disabled={disabled}
                />
                <CountryMultiSelectInput
                    label="Countries of Operation *"
                    name="countriesOfOperation"
                    value={value.countriesOfOperation}
                    onChange={onValueChange}
                    error={error?.fields?.countriesOfOperation?.$internal}
                    disabled={disabled}
                />
            </Row>
            <Row>
                <OrganizationSelectInput
                    label="Organization"
                    name="organization"
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
            </Row>
            <Row>
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
            </Row>
            <Row>
                <TextArea
                    label="Comment"
                    onChange={onValueChange}
                    value={value.comment}
                    name="comment"
                    error={error?.fields?.comment}
                    disabled={disabled}
                />
            </Row>
            <div className={styles.formButtons}>
                <Button
                    name={undefined}
                    onClick={onHideAddContactModal}
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

export default ContactForm;
