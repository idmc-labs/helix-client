import React from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    TextInput,
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';

import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';

import { PartialForm } from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';
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
import Row from '../Row';
import styles from './styles.css';

type GeoLocationInputValue = PartialForm<GeoLocationFormProps>;
type GeoLocationInputValueWithId = PartialForm<GeoLocationFormProps> & { id: string };

interface GeoLocationInputProps {
    index: number;
    value: GeoLocationInputValue;
    error: Error<GeoLocationFormProps> | undefined;
    onChange: (value: PartialForm<GeoLocationFormProps>, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
    disabled?: boolean;
    reviewMode?: boolean;
    review?: ReviewInputFields;
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
    figureId: string;
    accuracyOptions?: { name: string, description?: string | null }[] | null | undefined;
    identifierOptions?: { name: string, description?: string | null }[] | null | undefined;
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
        reviewMode,
        review,
        onReviewChange,
        figureId,
        accuracyOptions,
        identifierOptions,
    } = props;

    const onValueChange = useFormObject(index, value, onChange);
    const { id: geoLocationId } = value as GeoLocationInputValueWithId;

    return (
        <div className={_cs(className, styles.geoLocationInput)}>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <TextInput
                    label="Reported Name *"
                    name="reportedName"
                    value={value.reportedName}
                    onChange={onValueChange}
                    error={error?.fields?.reportedName}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getGeoLocationReviewProps(review, figureId, geoLocationId, 'reportedName')}
                        />
                    )}
                />
                <SelectInput
                    label="Origin *"
                    name="identifier"
                    value={value.identifier}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    options={identifierOptions}
                    onChange={onValueChange}
                    error={error?.fields?.identifier}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
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
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getGeoLocationReviewProps(review, figureId, geoLocationId, 'accuracy')}
                        />
                    )}
                />
                {!reviewMode && (
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

export default GeoLocationInput;
