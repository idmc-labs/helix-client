import React, { useMemo } from 'react';
import { randomString, _cs } from '@togglecorp/fujs';
import { Button, SelectInput, TextInput } from '@togglecorp/toggle-ui';
import { IoTrash } from 'react-icons/io5';
import {
    PartialForm,
    Error,
    StateArg,
    useFormObject,
} from '@togglecorp/toggle-form';

import Row from '#components/Row';
import NonFieldError from '#components/NonFieldError';
import { CountryOption } from '#components/selections/CountrySelectInput';

import styles from './styles.css';

// TODO: remove once it's implemented on the server.
type EventCode = {
    uuid: string;
    country: string;
    eventCodeType: string;
    eventCode: string;
}

type PartialEventCode = PartialForm<EventCode>;

const keySelector = (d: CountryOption) => d.id;
const labelSelector = (d: CountryOption) => d.idmcShortName;

// TODO: remove once it's implemented on the server.
type EventCodeType = {
    label: string;
    value: string;
}

const keySelectorEventType = (event: EventCodeType) => event.value;
const labelSelectorEventType = (event: EventCodeType) => event.label;

interface Props {
    className?: string;
    index: number;
    value: PartialEventCode;
    error: Error<EventCode> | undefined;
    onChange: (value: StateArg<PartialEventCode>, index: number) => void;
    onRemove: (index: number) => void;
    countryOptions: CountryOption[] | undefined | null;
    eventCodeTypeOptions: EventCodeType[];
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
        disabled, readOnly,
    } = props;

    const defaultValue = useMemo(() => ({ uuid: randomString() }), []);
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
                {/* NOTE: We should define the options on the parent
                and pass it to this component. */}
                <SelectInput
                    label="Type *"
                    name="eventCodeType"
                    options={eventCodeTypeOptions}
                    value={value.eventCodeType}
                    keySelector={keySelectorEventType}
                    labelSelector={labelSelectorEventType}
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
            <Button
                title="Remove"
                name={index}
                onClick={onRemove}
                compact
                transparent
                disabled={disabled}
                readOnly={readOnly}
            >
                <IoTrash />
            </Button>
        </Row>
    );
}

export default EventCodeInput;
