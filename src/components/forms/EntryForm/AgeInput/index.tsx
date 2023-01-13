import React, { useEffect, useRef, memo } from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    NumberInput,
    Button,
    SelectInput,
} from '@togglecorp/toggle-ui';
import {
    PartialForm,
    useFormObject,
    Error,
    StateArg,
} from '@togglecorp/toggle-form';

import NonFieldError from '#components/NonFieldError';
import Row from '#components/Row';

import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import {
    AgeFormProps,
    GenderOptions,
} from '../types';
import styles from './styles.css';

type AgeInputValue = PartialForm<AgeFormProps>;

const defaultValue: AgeInputValue = {
    uuid: 'random-uuid',
};

interface AgeInputProps {
    index: number;
    value: AgeInputValue;
    error: Error<AgeFormProps> | undefined;
    onChange: (value: StateArg<PartialForm<AgeFormProps>>, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
    disabled?: boolean;
    mode: 'view' | 'edit';
    genderOptions: GenderOptions;
    selected?: boolean;
}

function AgeInput(props: AgeInputProps) {
    const {
        value,
        genderOptions,
        onChange,
        onRemove,
        error,
        index,
        className,
        disabled,
        mode,
        selected,
    } = props;

    const onValueChange = useFormObject(index, onChange, defaultValue);

    const editMode = mode === 'edit';

    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selected) {
            elementRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [selected]);

    return (
        <div
            ref={elementRef}
            className={_cs(className, styles.ageInput)}
        >
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <NumberInput
                    label="Age Start*"
                    name="ageFrom"
                    value={value.ageFrom}
                    onChange={onValueChange}
                    error={error?.fields?.ageFrom}
                    disabled={disabled}
                    readOnly={!editMode}
                />
                <NumberInput
                    label="Age End*"
                    name="ageTo"
                    value={value.ageTo}
                    onChange={onValueChange}
                    error={error?.fields?.ageTo}
                    disabled={disabled}
                    readOnly={!editMode}
                />
                <SelectInput
                    options={genderOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Gender *"
                    name="sex"
                    value={value.sex}
                    onChange={onValueChange}
                    error={error?.fields?.sex}
                    disabled={disabled}
                    readOnly={!editMode}
                />
                <NumberInput
                    label="Value *"
                    name="value"
                    value={value.value}
                    onChange={onValueChange}
                    error={error?.fields?.value}
                    disabled={disabled}
                    readOnly={!editMode}
                />
                {editMode && (
                    <Button
                        className={styles.removeButton}
                        onClick={onRemove}
                        name={index}
                        disabled={disabled}
                        transparent
                    >
                        Remove
                    </Button>
                )}
            </Row>
        </div>
    );
}

export default memo(AgeInput);
