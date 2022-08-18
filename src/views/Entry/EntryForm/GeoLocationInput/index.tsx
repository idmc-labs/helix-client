import React, { memo } from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    TextInput,
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    PartialForm,
    useFormObject,
    Error,
    StateArg,
} from '@togglecorp/toggle-form';

import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';
import Row from '#components/Row';

import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import { getGeoLocationReviewProps } from '../utils';
import {
    GeoLocationFormProps,
    ReviewInputFields,
    EntryReviewStatus,
} from '../types';

import styles from './styles.css';

type GeoLocationInputValue = PartialForm<GeoLocationFormProps>;

const defaultValue: GeoLocationInputValue = {
    uuid: 'random-uuid',
};

interface GeoLocationInputProps {
    index: number;
    value: GeoLocationInputValue;
    error: Error<GeoLocationFormProps> | undefined;
    onChange: (value: StateArg<PartialForm<GeoLocationFormProps>>, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
    disabled?: boolean;
    mode: 'view' | 'review' | 'edit';
    review?: ReviewInputFields;
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
    figureId: string;
    accuracyOptions?: { name: string, description?: string | null }[] | null | undefined;
    identifierOptions?: { name: string, description?: string | null }[] | null | undefined;
    trafficLightShown: boolean;
}

function GeoLocationInput(props: GeoLocationInputProps) {
    const {
        value,
        onChange,
        onRemove,
        error,
        index,
        className,
        disabled,
        mode,
        review,
        onReviewChange,
        figureId,
        accuracyOptions,
        identifierOptions,
        trafficLightShown,
    } = props;

    const editMode = mode === 'edit';
    const reviewMode = mode === 'review';

    const onValueChange = useFormObject(index, onChange, defaultValue);
    const geoLocationId = value.id;

    return (
        <div
            className={_cs(className, styles.locationInput)}
        >
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <TextInput
                    label="Location"
                    name="location"
                    value={value.displayName}
                    disabled={disabled}
                    readOnly
                />
                <SelectInput
                    label="Type *"
                    name="identifier"
                    value={value.identifier}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    options={identifierOptions}
                    onChange={onValueChange}
                    error={error?.fields?.identifier}
                    disabled={disabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && geoLocationId && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getGeoLocationReviewProps(review, figureId, geoLocationId, 'identifier')}
                        />
                    )}
                />
                <SelectInput
                    label="Accuracy *"
                    name="accuracy"
                    value={value.accuracy}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    options={accuracyOptions}
                    onChange={onValueChange}
                    error={error?.fields?.accuracy}
                    disabled={disabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && geoLocationId && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getGeoLocationReviewProps(review, figureId, geoLocationId, 'accuracy')}
                        />
                    )}
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

export default memo(GeoLocationInput);
