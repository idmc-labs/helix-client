import React, { useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import { Button, SelectInput, TextInput } from '@togglecorp/toggle-ui';
import { IoTrash } from 'react-icons/io5';
import {
    PartialForm,
    Error,
    StateArg,
    useFormObject,
    PurgeNull,
} from '@togglecorp/toggle-form';
import { v4 as uuidv4 } from 'uuid';

import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import { CountryOption } from '#components/selections/CountrySelectInput';
import { enumKeySelector, enumLabelSelector, GetEnumOptions } from '#utils/common';
import { CreateEventMutationVariables, EventOptionsQuery } from '#generated/types';

import styles from './styles.css';

type FormType = PurgeNull<PartialForm<CreateEventMutationVariables['event']>>;
type EventCode = NonNullable<NonNullable<FormType['eventCodes']>[number]>;
type PartialEventCode = PartialForm<EventCode>;
type EventCodeTypeOptions = GetEnumOptions<
    NonNullable<EventOptionsQuery['eventCodeType']>['enumValues'],
    NonNullable<EventCode['eventCodeType']>
>;

const keySelector = (d: CountryOption) => d.id;
const labelSelector = (d: CountryOption) => d.idmcShortName;

interface Props {
    className?: string;
    index: number;
    value: PartialEventCode;
    error: Error<PartialEventCode> | undefined;
    onChange: (value: StateArg<PartialEventCode>, index: number) => void;
    onRemove: (index: number) => void;
    countryOptions: CountryOption[] | undefined | null;
    eventCodeTypeOptions: EventCodeTypeOptions;
    disabled?: boolean;
    readOnly?: boolean;
}

function EventCodeInput(props: Props) {
    const {
        className,
        index,
        value,
        onChange,
        onRemove,
        countryOptions,
        eventCodeTypeOptions,
        error,
        disabled,
        readOnly,
    } = props;

    const defaultValue = useMemo(() => ({ uuid: uuidv4() }), []);
    const onValueChange = useFormObject(index, onChange, defaultValue);

    return (
        <Row
            singleColumnNoGrow
            className={_cs(className, styles.eventCode)}
        >
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row className={styles.input}>
                <SelectInput
                    label="Country *"
                    name="country"
                    options={countryOptions}
                    value={value.country}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.country}
                    disabled={disabled}
                    readOnly={readOnly}
                />
                <SelectInput
                    label="Type *"
                    name="eventCodeType"
                    options={eventCodeTypeOptions}
                    value={value.eventCodeType}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    onChange={onValueChange}
                    error={error?.fields?.eventCodeType}
                    disabled={disabled}
                    readOnly={readOnly}
                />
                <TextInput
                    label="Code *"
                    name="eventCode"
                    value={value.eventCode}
                    onChange={onValueChange}
                    error={error?.fields?.eventCode}
                    disabled={disabled}
                    readOnly={readOnly}
                />
            </Row>
            {!readOnly && (
                <Button
                    title="Remove"
                    name={index}
                    onClick={onRemove}
                    compact
                    transparent
                    disabled={disabled}
                >
                    <IoTrash />
                </Button>
            )}
        </Row>
    );
}

export default EventCodeInput;
