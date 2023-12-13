import React from 'react';
import { noOp, randomString, _cs } from '@togglecorp/fujs';
import { Button, SelectInput, TextInput } from '@togglecorp/toggle-ui';
import {
    PartialForm,
    Error,
    StateArg,
    useFormObject,
} from '@togglecorp/toggle-form';
import { IoTrash } from 'react-icons/io5';

import Row from '#components/Row';
import { CountryOption } from '#components/selections/CountrySelectInput';
import { basicEntityKeySelector, basicEntityLabelSelector } from '#utils/common';

import styles from './styles.css';

interface EventCodeFields {
    clientId: string;
    country: string;
    type: string;
    code: string;
}

type EventCode = PartialForm<EventCodeFields>;

const keySelector = (d: CountryOption) => d.id;
const labelSelector = (d: CountryOption) => d.idmcShortName;

const defaultValue: EventCode = {
    clientId: randomString(),
};

interface Props {
    className?: string;
    index: number;
    value: EventCode;
    error: Error<EventCodeFields> | undefined;
    onChange: (value: StateArg<EventCode>, index: number) => void;
    onRemove: (index: number) => void;
    countryOptions: CountryOption[] | undefined | null;
    setCountryOptions: React.Dispatch<React.SetStateAction<CountryOption[] | undefined | null>>;
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
        setCountryOptions,
        error,
        disabled,
        readOnly,
    } = props;
    const onValueChange = useFormObject(index, onChange, defaultValue);

    return (
        <Row
            singleColumnNoGrow
            className={_cs(className, styles.eventCode)}
        >
            <Row className={styles.input}>
                <SelectInput
                    label="Country *"
                    name="country"
                    options={countryOptions}
                    value={value.country}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    onChange={onValueChange}
                    onOptionsChange={setCountryOptions}
                    error={undefined}
                    disabled={disabled}
                    readOnly={readOnly}
                />
                <SelectInput
                    label="Type *"
                    name=""
                    options={[]}
                    value={undefined}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    onChange={noOp}
                    error={undefined}
                    disabled={disabled}
                    readOnly={readOnly}
                />
                <TextInput
                    label="Code *"
                    name="code"
                    value={value.code}
                    onChange={onValueChange}
                    error={error?.fields?.code}
                    disabled={disabled}
                    readOnly={readOnly}
                />
            </Row>
            <Button
                name={index}
                onClick={onRemove}
                compact
                transparent
            >
                <IoTrash />
            </Button>
        </Row>
    );
}

export default EventCodeInput;
