import React, { useContext } from 'react';
import {
    NumberInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    useForm,
    removeNull,
    ObjectSchema,
    createSubmitHandler,
    requiredCondition,
    PartialForm,
    PurgeNull,
    integerCondition,
    greaterThanOrEqualToCondition,
} from '@togglecorp/toggle-form';

import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';

import Container from '#components/Container';
import NonFieldError from '#components/NonFieldError';
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';
import DomainContext from '#components/DomainContext';

import { transformToFormError } from '#utils/errorTransform';

import {
    ReleaseMetaDataQuery,
    UpdateReleaseMetaDataMutation,
    UpdateReleaseMetaDataMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const UPDATE_RELEASE_METADATA = gql`
    mutation UpdateReleaseMetaData($data: ReleaseMetadataInputType!) {
        giddUpdateReleaseMetaData(data: $data) {
            ok
            result {
                releaseYear
                preReleaseYear
                id
            }
            errors
        }
    }
`;

const RELEASE_METADATA = gql`
    query ReleaseMetaData (
        $clientId: String!,
    ) {
        giddReleaseMetaData (
            clientId: $clientId,
        ) {
            id
            releaseYear
            preReleaseYear
        }
    }
`;

type ReleaseMetaDataFormFields = UpdateReleaseMetaDataMutationVariables['data'];
type FormType = PurgeNull<PartialForm<ReleaseMetaDataFormFields>>;

type FormSchema = ObjectSchema<FormType>
type FormSchemaFields = ReturnType<FormSchema['fields']>;

const schema: FormSchema = {
    fields: (): FormSchemaFields => ({
        releaseYear: [requiredCondition, integerCondition, greaterThanOrEqualToCondition(2008)],
        preReleaseYear: [requiredCondition, integerCondition, greaterThanOrEqualToCondition(2008)],
    }),
};

const defaultFormValues: PartialForm<FormType> = {};

interface GiddSettingsProps {
    className?: string;
}

function GiddSettings(props: GiddSettingsProps) {
    const {
        className,
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

    const { user } = useContext(DomainContext);
    const giddPermission = user?.permissions?.gidd;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const {
        loading: releaseMetadataLoading,
        error: releaseMetadataError,
    } = useQuery<ReleaseMetaDataQuery>(
        RELEASE_METADATA,
        {
            onCompleted: (response) => {
                const { giddReleaseMetaData } = response;

                if (!giddReleaseMetaData) {
                    return;
                }
                onValueSet(removeNull(giddReleaseMetaData));
            },
        },
    );

    const [
        updateReleaseMetaData,
        { loading: updateLoading },
    ] = useMutation<UpdateReleaseMetaDataMutation, UpdateReleaseMetaDataMutationVariables>(
        UPDATE_RELEASE_METADATA,
        {
            onCompleted: (response) => {
                const { giddUpdateReleaseMetaData: giddUpdateReleaseMetaDataRes } = response;
                if (!giddUpdateReleaseMetaDataRes) {
                    return;
                }
                const { errors, result } = giddUpdateReleaseMetaDataRes;
                if (errors) {
                    const formError = transformToFormError(removeNull(errors));
                    onErrorSet(formError);
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'GIDD settings updated successfully!',
                        variant: 'success',
                    });
                    onPristineSet(true);
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

    const loading = updateLoading || releaseMetadataLoading;
    const errored = !!releaseMetadataError;
    const disabled = loading || errored;

    const handleSubmit = React.useCallback(
        (finalValues: PartialForm<FormType>) => {
            updateReleaseMetaData({
                variables: {
                    data: finalValues as ReleaseMetaDataFormFields,
                },
            });
        }, [updateReleaseMetaData],
    );

    return (
        <Container
            className={className}
            heading="GIDD Settings"
        >
            <form
                className={styles.form}
                onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
            >
                {loading && <Loading absolute />}
                <NonFieldError>
                    {error?.$internal}
                </NonFieldError>
                <NumberInput
                    label="Release Year *"
                    value={value.releaseYear}
                    onChange={onValueChange}
                    name="releaseYear"
                    error={error?.fields?.releaseYear}
                    disabled={disabled}
                    readOnly={!giddPermission?.update_release_meta_data}
                />
                <NumberInput
                    label="Pre-release Year *"
                    value={value.preReleaseYear}
                    onChange={onValueChange}
                    name="preReleaseYear"
                    error={error?.fields?.preReleaseYear}
                    disabled={disabled}
                    readOnly={!giddPermission?.update_release_meta_data}
                />
                {giddPermission?.update_release_meta_data && (
                    <div
                        className={styles.formButtons}
                    >
                        <Button
                            type="submit"
                            name={undefined}
                            disabled={disabled || pristine}
                            variant="primary"
                        >
                            Submit
                        </Button>
                    </div>
                )}
            </form>
        </Container>
    );
}

export default GiddSettings;
