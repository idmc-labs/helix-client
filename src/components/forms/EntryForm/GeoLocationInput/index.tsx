import React, {
    memo,
    Dispatch,
    SetStateAction,
} from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    TextInput,
    SelectInput,
    NumberInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    PartialForm,
    useFormObject,
    Error,
    StateArg,
} from '@togglecorp/toggle-form';

import { EventListOption } from '#components/selections/EventListSelectInput';
import {
    Review_Field_Type as ReviewFieldType,
    Review_Comment_Type as ReviewCommentType,
} from '#generated/types';
import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';
import Row from '#components/Row';

import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

import {
    GeoLocationFormProps,
    IdentifierOptions,
    GeocoderOptions,
    AccuracyOptions,
    FigureMetadata,
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
    mode: 'view' | 'edit';
    figureId: string | undefined;
    eventId: string | undefined;
    accuracyOptions?: AccuracyOptions;
    identifierOptions?: IdentifierOptions;
    geocoderOptions?: GeocoderOptions;
    trafficLightShown: boolean;

    fieldStatusMapping?: {
        [key in ReviewFieldType]?: ReviewCommentType;
    };

    assigneeMode?: boolean;
    reviewDisabled?: boolean;
    defaultShownField?: string | null;

    setEvents: Dispatch<SetStateAction<EventListOption[] | null | undefined>>;
    setFigureMetadata: (
        value: FigureMetadata
            | ((oldValue: FigureMetadata | undefined) => FigureMetadata)
            | undefined,
        key: string,
    ) => void;
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
        figureId,
        eventId,
        accuracyOptions,
        identifierOptions,
        geocoderOptions,
        trafficLightShown,

        fieldStatusMapping,

        assigneeMode,
        reviewDisabled,
        defaultShownField,

        setEvents,
        setFigureMetadata,
    } = props;

    const editMode = mode === 'edit';
    // const reviewMode = !editMode;

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
                <div>
                    <Row>
                        <TextInput
                            label="Location"
                            name="displayName"
                            value={value.displayName}
                            error={error?.fields?.displayName}
                            onChange={onValueChange}
                            disabled={disabled}
                            readOnly={!editMode}
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
                            icons={trafficLightShown && geoLocationId && figureId && eventId && (
                                <TrafficLightInput
                                    eventId={eventId}
                                    figureId={figureId}
                                    geoLocationId={geoLocationId}
                                    name="LOCATION_TYPE"
                                    value={fieldStatusMapping?.LOCATION_TYPE}
                                    // disabled={!reviewMode}
                                    assigneeMode={assigneeMode}
                                    reviewDisabled={reviewDisabled}
                                    defaultShown={defaultShownField === 'LOCATION_TYPE'}
                                    setEvents={setEvents}
                                    setFigureMetadata={setFigureMetadata}
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
                            icons={trafficLightShown && geoLocationId && figureId && eventId && (
                                <TrafficLightInput
                                    eventId={eventId}
                                    figureId={figureId}
                                    geoLocationId={geoLocationId}
                                    name="LOCATION_ACCURACY"
                                    value={fieldStatusMapping?.LOCATION_ACCURACY}
                                    // disabled={!reviewMode}
                                    assigneeMode={assigneeMode}
                                    reviewDisabled={reviewDisabled}
                                    defaultShown={defaultShownField === 'LOCATION_ACCURACY'}
                                    setEvents={setEvents}
                                    setFigureMetadata={setFigureMetadata}
                                />
                            )}
                        />
                    </Row>
                    <Row>
                        <SelectInput
                            label="Geocoder *"
                            name="geocoder"
                            value={value.geocoder}
                            keySelector={enumKeySelector}
                            labelSelector={enumLabelSelector}
                            options={geocoderOptions}
                            onChange={onValueChange}
                            error={error?.fields?.geocoder}
                            disabled={disabled}
                            readOnly={!editMode}
                        />
                        <NumberInput
                            label="Latitude *"
                            name="lat"
                            value={value.lat}
                            error={error?.fields?.lat}
                            onChange={onValueChange}
                            disabled={disabled}
                            readOnly={!editMode}
                        />
                        <NumberInput
                            label="Longitude *"
                            name="lon"
                            value={value.lon}
                            error={error?.fields?.lon}
                            onChange={onValueChange}
                            disabled={disabled}
                            readOnly={!editMode}
                        />
                    </Row>
                </div>
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
