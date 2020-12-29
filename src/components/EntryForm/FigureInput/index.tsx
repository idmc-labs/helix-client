import React from 'react';
import {
    NumberInput,
    DateInput,
    TextInput,
    TextArea,
    Switch,
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import GeoInput from '#components/GeoInput';
import NonFieldError from '#components/NonFieldError';
import Section from '#components/Section';
import Header from '#components/Header';
import TrafficLightInput from '#components/TrafficLightInput';
import CountrySelectInput, { CountryOption } from '#components/CountrySelectInput';

import {
    PartialForm,
} from '#types';
import {
    useFormObject,
    useFormArray,
} from '#utils/form';
import type { Error } from '#utils/schema';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import { FigureOptionsForEntryFormQuery } from '#generated/types';

import Row from '../Row';
import AgeInput from '../AgeInput';
import GeoLocationInput from '../GeoLocationInput';
import StrataInput from '../StrataInput';
import {
    FigureFormProps,
    AgeFormProps,
    StrataFormProps,
    ReviewInputFields,
    EntryReviewStatus,
} from '../types';
import { getFigureReviewProps } from '../utils';
import styles from './styles.css';

const FIGURE_OPTIONS = gql`
    query FigureOptionsForEntryForm {
        quantifierList: __type(name: "QUANTIFIER") {
            name
            enumValues {
                name
                description
            }
        }
        unitList: __type(name: "UNIT") {
            name
            enumValues {
                name
                description
            }
        }
        termList: __type(name: "TERM") {
            name
            enumValues {
                name
                description
            }
        }
        roleList: __type(name: "ROLE") {
            name
            enumValues {
                name
                description
            }
        }
        typeList: __type(name: "TYPE") {
            name
            enumValues {
                name
                description
            }
        }
        accuracyList: __type(name: "OSM_ACCURACY") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

type FigureInputValue = PartialForm<FigureFormProps>;
type FigureInputValueWithId = PartialForm<FigureFormProps> & { id: string };

interface FigureInputProps {
    index: number;
    value: FigureInputValue;
    error: Error<FigureFormProps> | undefined;
    onChange: (value: PartialForm<FigureFormProps>, index: number) => void;
    onClone: (index: number) => void;
    onRemove: (index: number) => void;
    disabled?: boolean;
    reviewMode?: boolean;
    review?: ReviewInputFields,
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;

    countries: CountryOption[] | null | undefined;
    onCountriesChange: React.Dispatch<React.SetStateAction<CountryOption[] | null | undefined>>;
}

function FigureInput(props: FigureInputProps) {
    const {
        value,
        onChange,
        onRemove,
        error,
        index,
        disabled,
        reviewMode,
        onClone,
        review,
        onReviewChange,

        countries,
        onCountriesChange,
    } = props;

    // FIXME: change enum to string as a hack
    const {
        data,
        loading: figureOptionsLoading,
        error: figureOptionsError,
    } = useQuery<FigureOptionsForEntryFormQuery>(FIGURE_OPTIONS);

    const figureOptionsDisabled = figureOptionsLoading || !!figureOptionsError;

    const onValueChange = useFormObject(index, value, onChange);

    const handleAgeAdd = React.useCallback(() => {
        const uuid = uuidv4();
        const newAge: PartialForm<AgeFormProps> = { uuid };
        onValueChange(
            [...(value.ageJson ?? []), newAge],
            'ageJson' as const,
        );
    }, [onValueChange, value]);

    const {
        onValueChange: onAgeChange,
        onValueRemove: onAgeRemove,
    } = useFormArray('ageJson', value.ageJson ?? [], onValueChange);

    const {
        onValueChange: onGeoLocationChange,
        onValueRemove: onGeoLocationRemove,
    } = useFormArray('geoLocations', value.geoLocations ?? [], onValueChange);

    const handleStrataAdd = React.useCallback(() => {
        const uuid = uuidv4();
        const newStrata: PartialForm<StrataFormProps> = { uuid };
        onValueChange(
            [...(value.strataJson ?? []), newStrata],
            'strataJson' as const,
        );
    }, [onValueChange, value]);

    const {
        onValueChange: onStrataChange,
        onValueRemove: onStrataRemove,
    } = useFormArray('strataJson', value.strataJson ?? [], onValueChange);

    // FIXME: The type of value should have be FigureInputValueWithId instead.
    const { id: figureId } = value as FigureInputValueWithId;

    const currentCountry = countries?.find((item) => item.id === value.country);

    return (
        <Section
            heading={`Figure #${index + 1}`}
            subSection
            actions={!reviewMode && (
                <>
                    <Button
                        name={index}
                        disabled={disabled}
                        onClick={onClone}
                    >
                        Clone
                    </Button>
                    <Button
                        name={index}
                        onClick={onRemove}
                        disabled={disabled}
                    >
                        Remove
                    </Button>
                </>
            )}
        >
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row mode="threeColumn">
                <CountrySelectInput
                    error={error?.fields?.country}
                    label="Country *"
                    name="country"
                    options={countries}
                    value={value.country}
                    onChange={onValueChange}
                    onOptionsChange={onCountriesChange}
                    disabled={disabled}
                    readOnly={reviewMode}
                    nonClearable
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'country')}
                        />
                    )}
                />
                <TextInput
                    label="District(s) *"
                    name="district"
                    value={value.district}
                    onChange={onValueChange}
                    error={error?.fields?.district}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'district')}
                        />
                    )}
                />
                <TextInput
                    label="Town / Village *"
                    name="town"
                    value={value.town}
                    onChange={onValueChange}
                    error={error?.fields?.town}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'town')}
                        />
                    )}
                />
            </Row>
            <Row>
                <GeoInput
                    className={styles.geoInput}
                    name="geoLocations"
                    value={value.geoLocations}
                    onChange={onValueChange}
                    country={currentCountry}
                    disabled={disabled}
                />
            </Row>
            <div className={styles.block}>
                <NonFieldError>
                    {error?.fields?.geoLocations?.$internal}
                </NonFieldError>
                {value?.geoLocations?.map((geoLocation, i) => (
                    <GeoLocationInput
                        key={geoLocation.uuid}
                        index={i}
                        value={geoLocation}
                        onChange={onGeoLocationChange}
                        onRemove={onGeoLocationRemove}
                        error={error?.fields?.geoLocations?.members?.[geoLocation.uuid]}
                        disabled={disabled}
                        reviewMode={reviewMode}
                        review={review}
                        onReviewChange={onReviewChange}
                        figureId={figureId}
                        accuracyOptions={data?.accuracyList?.enumValues}
                    />
                ))}
            </div>
            <Row mode="threeColumn">
                <SelectInput
                    options={data?.typeList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Figure Type *"
                    name="type"
                    value={value.type}
                    onChange={onValueChange}
                    error={error?.fields?.type}
                    disabled={disabled || figureOptionsDisabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'type')}
                        />
                    )}
                />
                <DateInput
                    label="Start date *"
                    name="startDate"
                    value={value.startDate}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.startDate}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'startDate')}
                        />
                    )}
                />
                <DateInput
                    label="End date"
                    name="endDate"
                    value={value.endDate}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.endDate}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'endDate')}
                        />
                    )}
                />
            </Row>
            <Row mode="threeColumn">
                <SelectInput
                    options={data?.quantifierList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Quantifier *"
                    name="quantifier"
                    value={value.quantifier}
                    onChange={onValueChange}
                    error={error?.fields?.quantifier}
                    disabled={disabled || figureOptionsDisabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'householdSize')}
                        />
                    )}
                />
                <NumberInput
                    label="Reported Figure *"
                    name="reported"
                    value={value.reported}
                    onChange={onValueChange}
                    error={error?.fields?.reported}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'reported')}
                        />
                    )}
                />
                <SelectInput
                    options={data?.unitList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Unit *"
                    name="unit"
                    value={value.unit}
                    onChange={onValueChange}
                    error={error?.fields?.unit}
                    disabled={disabled || figureOptionsDisabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'unit')}
                        />
                    )}
                />
            </Row>
            <Row mode="threeColumn">
                {value.unit === 'HOUSEHOLD' && (
                    // FIXME: this comparision is not type safe
                    <NumberInput
                        label="Household Size *"
                        name="householdSize"
                        value={value.householdSize}
                        onChange={onValueChange}
                        error={error?.fields?.householdSize}
                        disabled={disabled}
                        readOnly={reviewMode}
                        icons={reviewMode && review && (
                            <TrafficLightInput
                                onChange={onReviewChange}
                                {...getFigureReviewProps(review, figureId, 'householdSize')}
                            />
                        )}
                    />
                )}
                <SelectInput
                    options={data?.termList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Term *"
                    name="term"
                    value={value.term}
                    onChange={onValueChange}
                    error={error?.fields?.term}
                    disabled={disabled || figureOptionsDisabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'term')}
                        />
                    )}
                />
                <SelectInput
                    options={data?.roleList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Role *"
                    name="role"
                    value={value.role}
                    onChange={onValueChange}
                    error={error?.fields?.role}
                    disabled={disabled || figureOptionsDisabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'role')}
                        />
                    )}
                />
            </Row>
            <Row>
                {reviewMode && review && (
                    <TrafficLightInput
                        className={styles.trafficLight}
                        onChange={onReviewChange}
                        {...getFigureReviewProps(review, figureId, 'isDisaggregated')}
                    />
                )}
                <Switch
                    label="Disaggregated Data"
                    name="isDisaggregated"
                    // FIXME: typings of toggle-ui
                    value={value.isDisaggregated}
                    onChange={onValueChange}
                    // error={error?.fields?.isDisaggregated}
                    disabled={disabled}
                    readOnly={reviewMode}
                />
            </Row>
            {value.isDisaggregated && (
                <>
                    <Row mode="twoColumn">
                        <NumberInput
                            label="Urban displacement"
                            name="displacementUrban"
                            value={value.displacementUrban}
                            onChange={onValueChange}
                            error={error?.fields?.isDisaggregated}
                            disabled={disabled}
                            readOnly={reviewMode}
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'displacementUrban')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Rural displacement"
                            name="displacementRural"
                            value={value.displacementRural}
                            onChange={onValueChange}
                            error={error?.fields?.displacementRural}
                            disabled={disabled}
                            readOnly={reviewMode}
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'displacementRural')}
                                />
                            )}
                        />
                    </Row>
                    <Row mode="twoColumn">
                        <NumberInput
                            label="In Camp"
                            name="locationCamp"
                            value={value.locationCamp}
                            onChange={onValueChange}
                            error={error?.fields?.locationCamp}
                            disabled={disabled}
                            readOnly={reviewMode}
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'locationCamp')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Not in Camp"
                            name="locationNonCamp"
                            value={value.locationNonCamp}
                            onChange={onValueChange}
                            error={error?.fields?.locationNonCamp}
                            disabled={disabled}
                            readOnly={reviewMode}
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    className={styles.trafficLight}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'locationNonCamp')}
                                />
                            )}
                        />
                    </Row>
                    <Row mode="twoColumn">
                        <NumberInput
                            label="No. of Male"
                            name="sexMale"
                            value={value.sexMale}
                            onChange={onValueChange}
                            error={error?.fields?.sexMale}
                            disabled={disabled}
                            readOnly={reviewMode}
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'sexMale')}
                                />
                            )}
                        />
                        <NumberInput
                            label="No. of Female"
                            name="sexFemale"
                            value={value.sexFemale}
                            onChange={onValueChange}
                            error={error?.fields?.sexFemale}
                            disabled={disabled}
                            readOnly={reviewMode}
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'sexFemale')}
                                />
                            )}
                        />
                    </Row>
                    <Row mode="threeColumn">
                        <NumberInput
                            label="Conflict"
                            name="conflict"
                            value={value.conflict}
                            onChange={onValueChange}
                            error={error?.fields?.conflict}
                            disabled={disabled}
                            readOnly={reviewMode}
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'conflict')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Political Conflict"
                            name="conflictPolitical"
                            value={value.conflictPolitical}
                            onChange={onValueChange}
                            error={error?.fields?.conflictPolitical}
                            disabled={disabled}
                            readOnly={reviewMode}
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'conflictPolitical')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Criminal Conflict"
                            name="conflictCriminal"
                            value={value.conflictCriminal}
                            onChange={onValueChange}
                            error={error?.fields?.conflictCriminal}
                            disabled={disabled}
                            readOnly={reviewMode}
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'conflictCriminal')}
                                />
                            )}
                        />
                    </Row>
                    <Row mode="threeColumn">
                        <NumberInput
                            label="Communal Conflict"
                            name="conflictCommunal"
                            value={value.conflictCommunal}
                            onChange={onValueChange}
                            error={error?.fields?.conflictCommunal}
                            disabled={disabled}
                            readOnly={reviewMode}
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'conflictCommunal')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Other Conflict"
                            name="conflictOther"
                            value={value.conflictOther}
                            onChange={onValueChange}
                            error={error?.fields?.conflictOther}
                            disabled={disabled}
                            readOnly={reviewMode}
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'conflictOther')}
                                />
                            )}
                        />
                    </Row>
                    <div className={styles.block}>
                        <Header
                            size="extraSmall"
                            heading="Age"
                            actions={!reviewMode && (
                                <Button
                                    name={undefined}
                                    onClick={handleAgeAdd}
                                    disabled={disabled}
                                >
                                    Add Age
                                </Button>
                            )}
                        />
                        <NonFieldError>
                            {error?.fields?.ageJson?.$internal}
                        </NonFieldError>
                        {value?.ageJson?.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by age yet
                            </div>
                        ) : value?.ageJson?.map((age, i) => (
                            <AgeInput
                                key={age.uuid}
                                index={i}
                                value={age}
                                onChange={onAgeChange}
                                onRemove={onAgeRemove}
                                error={error?.fields?.ageJson?.members?.[age.uuid]}
                                disabled={disabled}
                                reviewMode={reviewMode}
                                review={review}
                                onReviewChange={onReviewChange}
                                figureId={figureId}
                            />
                        ))}
                    </div>
                    <div className={styles.block}>
                        <Header
                            size="extraSmall"
                            heading="Strata"
                            actions={!reviewMode && (
                                <Button
                                    name={undefined}
                                    onClick={handleStrataAdd}
                                    disabled={disabled || reviewMode}
                                >
                                    Add Strata
                                </Button>
                            )}
                        />
                        <NonFieldError>
                            {error?.fields?.strataJson?.$internal}
                        </NonFieldError>
                        {value?.strataJson?.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by strata yet
                            </div>
                        ) : value?.strataJson?.map((strata, i) => (
                            <StrataInput
                                key={strata.uuid}
                                index={i}
                                value={strata}
                                onChange={onStrataChange}
                                onRemove={onStrataRemove}
                                error={error?.fields?.strataJson?.members?.[strata.uuid]}
                                disabled={disabled}
                                reviewMode={reviewMode}
                                review={review}
                                onReviewChange={onReviewChange}
                                figureId={figureId}
                            />
                        ))}
                    </div>
                </>
            )}
            <Row>
                {reviewMode && review && (
                    <TrafficLightInput
                        className={styles.trafficLight}
                        onChange={onReviewChange}
                        {...getFigureReviewProps(review, figureId, 'includeIdu')}
                    />
                )}
                <Switch
                    label="Include in IDU"
                    name="includeIdu"
                    value={value.includeIdu}
                    onChange={onValueChange}
                    disabled={disabled}
                    readOnly={reviewMode}
                />
            </Row>
            {value.includeIdu && (
                <Row>
                    <TextArea
                        label="Excerpt for IDU"
                        name="excerptIdu"
                        value={value.excerptIdu}
                        onChange={onValueChange}
                        disabled={disabled}
                        error={error?.fields?.excerptIdu}
                        readOnly={reviewMode}
                        icons={reviewMode && review && (
                            <TrafficLightInput
                                onChange={onReviewChange}
                                {...getFigureReviewProps(review, figureId, 'excerptIdu')}
                            />
                        )}
                    />
                </Row>
            )}
        </Section>
    );
}

export default FigureInput;
