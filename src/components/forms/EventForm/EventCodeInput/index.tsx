import React from 'react';
import { isDefined, noOp, randomString, _cs } from '@togglecorp/fujs';
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

type EventCode = {
    clientId: string;
    country: string;
    eventCodeType: string;
    eventCode: string;
}

type EventCodeSchema = PartialForm<EventCode>;

const keySelector = (d: CountryOption) => d.id;
const labelSelector = (d: CountryOption) => d.idmcShortName;

const defaultValue: EventCodeSchema = {
    clientId: randomString(),
};

interface Props {
    className?: string;
    index: number;
    value: EventCode;
    error: Error<EventCodeSchema> | undefined;
    onChange: (value: StateArg<EventCodeSchema>, index: number) => void;
    onRemove: (index: number) => void;
    countryOptions: CountryOption[] | undefined | null;
    setCountryOptions: React.Dispatch<React.SetStateAction<CountryOption[] | undefined | null>>;
    countryIds: string[] | undefined;
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
        countryIds,
        error,
        disabled,
        readOnly,
    } = props;
    const onValueChange = useFormObject(index, onChange, defaultValue);
    const options = countryIds?.map(
        (countryId) => countryOptions?.find(
            (country) => country.id === countryId,
        ),
    ).filter(isDefined);

    return (
        <Row
            singleColumnNoGrow
            className={_cs(className, styles.eventCode)}
        >
            <Row className={styles.input}>
                <SelectInput
                    label="Country *"
                    name="country"
                    options={options}
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
                    name="eventCode"
                    value={value.eventCode}
                    onChange={onValueChange}
                    error={error?.fields?.eventCode}
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
