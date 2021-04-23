import React from 'react';
import {
    NumberInput,
    DateInput,
    TextArea,
    Switch,
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import { isDefined } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import Row from '#components/Row';
import GeoInput from '#components/GeoInput';
import NonFieldError from '#components/NonFieldError';
import Section from '#components/Section';
import Header from '#components/Header';
import TrafficLightInput from '#components/TrafficLightInput';
import { CountryOption } from '#components/selections/CountrySelectInput';

import { PartialForm } from '#types';
import {
    useFormObject,
    useFormArray,
} from '#utils/form';
import type { Error } from '#utils/schema';
import {
    enumKeySelector,
    enumLabelSelector,
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';
import {
    HouseholdSizeQuery,
} from '#generated/types';

import AgeInput from '../AgeInput';
import GeoLocationInput from '../GeoLocationInput';
import StrataInput from '../StrataInput';
import {
    FigureFormProps,
    AgeFormProps,
    StrataFormProps,
    ReviewInputFields,
    EntryReviewStatus,

    Category,
    AccuracyOptions,
    UnitOptions,
    TermOptions,
    RoleOptions,
    GenderOptions,
    AgeOptions,
    IdentifierOptions,
    QuantifierOptions,
    CategoryOptions,
    DateAccuracyOptions,
    DisplacementOptions,
} from '../types';
import { getFigureReviewProps } from '../utils';
import styles from './styles.css';

const HOUSEHOLD_SIZE = gql`
    query HouseholdSize($country: ID!, $year: Int!) {
        householdSize(country: $country, year: $year) {
            id
            size
            year
        }
    }
`;

const countryKeySelector = (data: { id: string; idmcShortName: string }) => data.id;
const countryLabelSelector = (data: { id: string; idmcShortName: string }) => data.idmcShortName;

type FigureInputValue = PartialForm<FigureFormProps>;
type FigureInputValueWithId = PartialForm<FigureFormProps> & { id: string };

const keySelector = (item: Category) => item.id;
const labelSelector = (item: Category) => item.name;
const groupKeySelector = (item: Category) => item.type;
const groupLabelSelector = (item: Category) => item.type;

type HouseholdSize = NonNullable<HouseholdSizeQuery['householdSize']>;
const householdKeySelector = (item: HouseholdSize) => String(item.size);

interface FigureInputProps {
    index: number;
    value: FigureInputValue;
    error: Error<FigureFormProps> | undefined;
    onChange: (value: PartialForm<FigureFormProps>, index: number) => void;
    onClone: (index: number) => void;
    onRemove: (index: number) => void;
    disabled?: boolean;
    mode: 'view' | 'review' | 'edit';
    review?: ReviewInputFields,
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
    trafficLightShown: boolean;

    countries: CountryOption[] | null | undefined;

    optionsDisabled: boolean;
    accuracyOptions: AccuracyOptions;
    identifierOptions: IdentifierOptions;
    categoryOptions: CategoryOptions;
    quantifierOptions: QuantifierOptions;
    unitOptions: UnitOptions;
    termOptions: TermOptions;
    roleOptions: RoleOptions;
    dateAccuracyOptions: DateAccuracyOptions;
    displacementOptions: DisplacementOptions;
    ageCategoryOptions: AgeOptions;
    genderCategoryOptions: GenderOptions;
}

function FigureInput(props: FigureInputProps) {
    const {
        value,
        onChange,
        onRemove,
        error,
        index,
        disabled,
        mode,
        onClone,
        review,
        onReviewChange,

        countries,

        optionsDisabled: figureOptionsDisabled,

        accuracyOptions,
        identifierOptions,
        categoryOptions,
        quantifierOptions,
        unitOptions,
        termOptions,
        roleOptions,
        trafficLightShown,
        dateAccuracyOptions,
        displacementOptions,
        ageCategoryOptions,
        genderCategoryOptions,
    } = props;

    const editMode = mode === 'edit';
    const reviewMode = mode === 'review';

    const { country, startDate } = value;
    const year = startDate?.match(/^\d+/)?.[0];

    const variables = React.useMemo(
        () => (
            year && country
                ? {
                    year,
                    country,
                }
                : undefined
        ),
        [year, country],
    );

    const {
        data: householdData,
        // loading: householdDataLoading,
        // error: householdDataError,
    } = useQuery<HouseholdSizeQuery>(HOUSEHOLD_SIZE, {
        skip: !variables,
        variables,
    });

    const households = [householdData?.householdSize].filter(isDefined);

    // const figureOptionsDisabled = figureOptionsLoading || !!figureOptionsError;

    const onValueChange = useFormObject(index, value, onChange);

    const handleAgeAdd = React.useCallback(() => {
        const uuid = uuidv4();
        const newAge: PartialForm<AgeFormProps> = { uuid };
        onValueChange(
            [...(value.disaggregationAgeJson ?? []), newAge],
            'disaggregationAgeJson' as const,
        );
    }, [onValueChange, value]);

    const {
        onValueChange: onAgeChange,
        onValueRemove: onAgeRemove,
    } = useFormArray('disaggregationAgeJson', value.disaggregationAgeJson ?? [], onValueChange);

    const {
        onValueChange: onGeoLocationChange,
        onValueRemove: onGeoLocationRemove,
    } = useFormArray('geoLocations', value.geoLocations ?? [], onValueChange);

    const handleStrataAdd = React.useCallback(() => {
        const uuid = uuidv4();
        const newStrata: PartialForm<StrataFormProps> = { uuid };
        onValueChange(
            [...(value.disaggregationStrataJson ?? []), newStrata],
            'disaggregationStrataJson' as const,
        );
    }, [onValueChange, value]);

    const {
        onValueChange: onStrataChange,
        onValueRemove: onStrataRemove,
    } = useFormArray('disaggregationStrataJson', value.disaggregationStrataJson ?? [], onValueChange);

    // FIXME: The type of value should have be FigureInputValueWithId instead.
    const { id: figureId } = value as FigureInputValueWithId;

    const currentCountry = countries?.find((item) => item.id === value.country);
    const currentCatetory = categoryOptions?.find((item) => item.id === value.category);
    const selectedTerm = termOptions?.find((item) => item.id === value.term);
    const showHousingToggle = !!selectedTerm?.isHousingRelated;
    const showDisplacementOccurred = selectedTerm?.displacementOccur;
    return (
        <Section
            heading={`Figure #${index + 1}`}
            headerClassName={styles.header}
            subSection
            actions={editMode && (
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
            <Row>
                <SelectInput
                    error={error?.fields?.country}
                    label="Country *"
                    name="country"
                    options={countries}
                    value={value.country}
                    keySelector={countryKeySelector}
                    labelSelector={countryLabelSelector}
                    onChange={onValueChange}
                    disabled={disabled}
                    // Disable changing country when there are more than one geolocation
                    readOnly={!editMode || (value.geoLocations?.length ?? 0) > 0}
                    nonClearable
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'country')}
                        />
                    )}
                />
            </Row>
            {value.country && (
                <Row>
                    <GeoInput
                        className={styles.geoInput}
                        name="geoLocations"
                        value={value.geoLocations}
                        onChange={onValueChange}
                        country={currentCountry}
                        readOnly={!editMode}
                        disabled={disabled}
                    />
                </Row>
            )}
            {value.country && (
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
                            mode={mode}
                            review={review}
                            onReviewChange={onReviewChange}
                            figureId={figureId}
                            accuracyOptions={accuracyOptions}
                            identifierOptions={identifierOptions}
                            trafficLightShown={trafficLightShown}
                        />
                    ))}
                </div>
            )}
            <Row>
                <SelectInput
                    options={categoryOptions}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                    label="Figure Type *"
                    name="category"
                    value={value.category}
                    onChange={onValueChange}
                    error={error?.fields?.category}
                    disabled={disabled || figureOptionsDisabled}
                    readOnly={!editMode}
                    groupLabelSelector={groupLabelSelector}
                    groupKeySelector={groupKeySelector}
                    grouped
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'category')}
                        />
                    )}
                />
            </Row>
            <Row>
                <DateInput
                    label="Start Date *"
                    name="startDate"
                    value={value.startDate}
                    onChange={onValueChange}
                    disabled={disabled}
                    error={error?.fields?.startDate}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'startDate')}
                        />
                    )}
                />
                <SelectInput
                    options={dateAccuracyOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Start Date Accuracy"
                    name="startDateAccuracy"
                    value={value.startDateAccuracy}
                    onChange={onValueChange}
                    error={error?.fields?.startDateAccuracy}
                    disabled={disabled || figureOptionsDisabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'startDateAccuracy')}
                        />
                    )}
                />
                {currentCatetory?.type === 'FLOW' && (
                    <>
                        <DateInput
                            label="End date"
                            name="endDate"
                            value={value.endDate}
                            onChange={onValueChange}
                            disabled={disabled}
                            error={error?.fields?.endDate}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'endDate')}
                                />
                            )}
                        />
                        <SelectInput
                            options={dateAccuracyOptions}
                            keySelector={enumKeySelector}
                            labelSelector={enumLabelSelector}
                            label="End Date Accuracy"
                            name="endDateAccuracy"
                            value={value.endDateAccuracy}
                            onChange={onValueChange}
                            error={error?.fields?.endDateAccuracy}
                            disabled={disabled || figureOptionsDisabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'endDateAccuracy')}
                                />
                            )}
                        />
                    </>
                )}
            </Row>
            <Row>
                <SelectInput
                    options={quantifierOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Quantifier *"
                    name="quantifier"
                    value={value.quantifier}
                    onChange={onValueChange}
                    error={error?.fields?.quantifier}
                    disabled={disabled || figureOptionsDisabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
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
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'reported')}
                        />
                    )}
                />
                <SelectInput
                    options={unitOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Unit *"
                    name="unit"
                    value={value.unit}
                    onChange={onValueChange}
                    error={error?.fields?.unit}
                    disabled={disabled || figureOptionsDisabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'unit')}
                        />
                    )}
                />
            </Row>
            <Row>
                {value.unit === 'HOUSEHOLD' && (
                    // FIXME: this comparision is not type safe
                    <>
                        <NumberInput
                            label="Household Size *"
                            name="householdSize"
                            value={value.householdSize}
                            onChange={onValueChange}
                            error={error?.fields?.householdSize}
                            disabled={disabled}
                            readOnly={!editMode}
                            suggestions={households}
                            suggestionKeySelector={householdKeySelector}
                            suggestionLabelSelector={householdKeySelector}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'householdSize')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Total Figure"
                            name="totalFigure"
                            value={(value.householdSize ?? 0) * (value.reported ?? 0)}
                            disabled={disabled}
                            readOnly
                        />
                    </>
                )}
                <SelectInput
                    options={termOptions}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    label="Term *"
                    name="term"
                    value={value.term}
                    onChange={onValueChange}
                    error={error?.fields?.term}
                    disabled={disabled || figureOptionsDisabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'term')}
                        />
                    )}
                />
                {showDisplacementOccurred && (
                    <SelectInput
                        options={displacementOptions}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        label="Displacement Occurred"
                        name="displacementOccurred"
                        value={value.displacementOccurred}
                        onChange={onValueChange}
                        error={error?.fields?.displacementOccurred}
                        readOnly={!editMode}
                        icons={trafficLightShown && review && (
                            <TrafficLightInput
                                disabled={!reviewMode}
                                onChange={onReviewChange}
                                {...getFigureReviewProps(review, figureId, 'displacementOccurred')}
                            />
                        )}
                    />
                )}
                <SelectInput
                    options={roleOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Role *"
                    name="role"
                    value={value.role}
                    onChange={onValueChange}
                    error={error?.fields?.role}
                    disabled={disabled || figureOptionsDisabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'role')}
                        />
                    )}
                />
            </Row>
            <Row>
                {showHousingToggle && (
                    <>
                        {trafficLightShown && review && (
                            <TrafficLightInput
                                disabled={!reviewMode}
                                className={styles.trafficLight}
                                onChange={onReviewChange}
                                {...getFigureReviewProps(review, figureId, 'isHousingDestruction')}
                            />
                        )}
                        <Switch
                            label="Housing destruction (recommended estimate for this entry)"
                            name="isHousingDestruction"
                            // FIXME: typings of toggle-ui
                            value={value.isHousingDestruction}
                            onChange={onValueChange}
                            // error={error?.fields?.isHousingDestruction}
                            disabled={disabled}
                            readOnly={!editMode}
                        />
                    </>
                )}
            </Row>
            <Row>
                {trafficLightShown && review && (
                    <TrafficLightInput
                        disabled={!reviewMode}
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
                    readOnly={!editMode}
                />
            </Row>
            {value.isDisaggregated && (
                <>
                    <Row>
                        <NumberInput
                            label="Urban displacement"
                            name="disaggregationDisplacementUrban"
                            value={value.disaggregationDisplacementUrban}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationDisplacementUrban}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'displacementUrban')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Rural displacement"
                            name="disaggregationDisplacementRural"
                            value={value.disaggregationDisplacementRural}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationDisplacementRural}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'displacementRural')}
                                />
                            )}
                        />
                    </Row>
                    <Row>
                        <NumberInput
                            label="In Camp"
                            name="disaggregationLocationCamp"
                            value={value.disaggregationLocationCamp}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationLocationCamp}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'locationCamp')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Not in Camp"
                            name="disaggregationLocationNonCamp"
                            value={value.disaggregationLocationNonCamp}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationLocationNonCamp}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    className={styles.trafficLight}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'locationNonCamp')}
                                />
                            )}
                        />
                    </Row>
                    <Row>
                        <NumberInput
                            label="No. of Male"
                            name="disaggregationSexMale"
                            value={value.disaggregationSexMale}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationSexMale}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'sexMale')}
                                />
                            )}
                        />
                        <NumberInput
                            label="No. of Female"
                            name="disaggregationSexFemale"
                            value={value.disaggregationSexFemale}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationSexFemale}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'sexFemale')}
                                />
                            )}
                        />
                    </Row>
                    <Row>
                        <NumberInput
                            label="Conflict"
                            name="disaggregationConflict"
                            value={value.disaggregationConflict}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationConflict}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'conflict')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Political Conflict"
                            name="disaggregationConflictPolitical"
                            value={value.disaggregationConflictPolitical}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationConflictPolitical}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'conflictPolitical')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Criminal Conflict"
                            name="disaggregationConflictCriminal"
                            value={value.disaggregationConflictCriminal}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationConflictCriminal}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'conflictCriminal')}
                                />
                            )}
                        />
                    </Row>
                    <Row>
                        <NumberInput
                            label="Communal Conflict"
                            name="disaggregationConflictCommunal"
                            value={value.disaggregationConflictCommunal}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationConflictCommunal}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'conflictCommunal')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Other Conflict"
                            name="disaggregationConflictOther"
                            value={value.disaggregationConflictOther}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationConflictOther}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
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
                            actions={editMode && (
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
                            {error?.fields?.disaggregationAgeJson?.$internal}
                        </NonFieldError>
                        {value?.disaggregationAgeJson?.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by age yet
                            </div>
                        ) : value?.disaggregationAgeJson?.map((age, i) => (
                            <AgeInput
                                key={age.uuid}
                                index={i}
                                value={age}
                                ageOptions={ageCategoryOptions}
                                genderOptions={genderCategoryOptions}
                                onChange={onAgeChange}
                                onRemove={onAgeRemove}
                                error={error?.fields?.disaggregationAgeJson?.members?.[age.uuid]}
                                disabled={disabled}
                                mode={mode}
                                review={review}
                                onReviewChange={onReviewChange}
                                figureId={figureId}
                                trafficLightShown={trafficLightShown}
                            />
                        ))}
                    </div>
                    <div className={styles.block}>
                        <Header
                            size="extraSmall"
                            heading="Strata"
                            actions={editMode && (
                                <Button
                                    name={undefined}
                                    onClick={handleStrataAdd}
                                    disabled={disabled}
                                >
                                    Add Strata
                                </Button>
                            )}
                        />
                        <NonFieldError>
                            {error?.fields?.disaggregationStrataJson?.$internal}
                        </NonFieldError>
                        {value?.disaggregationStrataJson?.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by strata yet
                            </div>
                        ) : value?.disaggregationStrataJson?.map((strata, i) => (
                            <StrataInput
                                key={strata.uuid}
                                index={i}
                                value={strata}
                                onChange={onStrataChange}
                                onRemove={onStrataRemove}
                                // eslint-disable-next-line max-len
                                error={error?.fields?.disaggregationStrataJson?.members?.[strata.uuid]}
                                disabled={disabled}
                                mode={mode}
                                review={review}
                                onReviewChange={onReviewChange}
                                figureId={figureId}
                                trafficLightShown={trafficLightShown}
                            />
                        ))}
                    </div>
                </>
            )}
            <Row>
                {trafficLightShown && review && (
                    <TrafficLightInput
                        disabled={!reviewMode}
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
                    readOnly={!editMode}
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
                        readOnly={!editMode}
                        icons={trafficLightShown && review && (
                            <TrafficLightInput
                                disabled={!reviewMode}
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
