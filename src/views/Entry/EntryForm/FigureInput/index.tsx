import React, { useEffect, useRef, useState, useContext, useMemo } from 'react';
import {
    NumberInput,
    DateInput,
    TextArea,
    Switch,
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import { isDefined, sum } from '@togglecorp/fujs';
import {
    PartialForm,
    Error,
    useFormArray,
    useFormObject,
    StateArg,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import NotificationContext from '#components/NotificationContext';
import Row from '#components/Row';
import GeoInput from '#components/GeoInput';
import NonFieldError from '#components/NonFieldError';
import NonFieldWarning from '#components/NonFieldWarning';
import Section from '#components/Section';
import Header from '#components/Header';
import TrafficLightInput from '#components/TrafficLightInput';
import { CountryOption } from '#components/selections/CountrySelectInput';

import {
    enumKeySelector,
    enumLabelSelector,
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';
import {
    HouseholdSizeQuery,
    Unit,
    FigureCategoryType,
} from '#generated/types';

import AgeInput from '../AgeInput';
import GeoLocationInput from '../GeoLocationInput';
import {
    FigureFormProps,
    AgeFormProps,
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

const household: Unit = 'HOUSEHOLD';
const stock: FigureCategoryType = 'STOCK';
const flow: FigureCategoryType = 'FLOW';

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

const defaultValue: FigureInputValue = {
    uuid: 'hari',
};

interface FigureInputProps {
    index: number;
    value: FigureInputValue;
    error: Error<FigureFormProps> | undefined;
    onChange: (value: StateArg<PartialForm<FigureFormProps>>, index: number) => void;
    onClone: (index: number) => void;
    onRemove: (index: number) => void;
    disabled?: boolean;
    mode: 'view' | 'review' | 'edit';
    review?: ReviewInputFields,
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
    trafficLightShown: boolean;

    countries: CountryOption[] | null | undefined;
    selected?: boolean;

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
        selected,

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

    const { notify } = useContext(NotificationContext);

    const [selectedAge, setSelectedAge] = useState<string | undefined>();

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

    const onValueChange = useFormObject(index, onChange, defaultValue);

    const handleAgeAdd = React.useCallback(() => {
        const uuid = uuidv4();
        const newAge: PartialForm<AgeFormProps> = { uuid };
        setSelectedAge(newAge.uuid);
        onValueChange(
            [...(value.disaggregationAgeJson ?? []), newAge],
            'disaggregationAgeJson' as const,
        );
        notify({ children: 'Age added!' });
    }, [onValueChange, value, notify]);

    const {
        onValueChange: onAgeChange,
        onValueRemove: onAgeRemove,
    } = useFormArray('disaggregationAgeJson', onValueChange);

    const {
        onValueChange: onGeoLocationChange,
        onValueRemove: onGeoLocationRemove,
    } = useFormArray('geoLocations', onValueChange);

    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selected) {
            elementRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [selected]);

    // FIXME: The type of value should have be FigureInputValueWithId instead.
    const { id: figureId } = value as FigureInputValueWithId;

    const currentCountry = countries?.find((item) => item.id === value.country);
    const currentCategory = categoryOptions?.find((item) => item.id === value.category);
    const selectedTerm = termOptions?.find((item) => item.id === value.term);

    const showHousingToggle = !!selectedTerm?.isHousingRelated;
    const showDisplacementOccurred = selectedTerm?.displacementOccur;

    const totalValue = useMemo(
        () => {
            if (value.unit !== household) {
                return value.reported;
            }
            if (isDefined(value.householdSize) && isDefined(value.reported)) {
                return value.householdSize * value.reported;
            }
            return undefined;
        },
        [value.householdSize, value.reported, value.unit],
    );

    const totalDisaggregatedValue = useMemo(
        () => {
            const values = value.disaggregationAgeJson?.map(
                (item) => item.value,
            ).filter(isDefined);
            if (!values || values.length <= 0) {
                return undefined;
            }
            return sum(values);
        },
        [value.disaggregationAgeJson],
    );

    const diff = isDefined(totalValue) && isDefined(totalDisaggregatedValue)
        ? totalValue - totalDisaggregatedValue
        : 0;

    return (
        <Section
            elementRef={elementRef}
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
                    label={currentCategory?.type === stock ? 'Stock Date *' : 'Start Date *'}
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
                    label={currentCategory?.type === stock ? 'Stock Date Accuracy' : 'Start Date Accuracy'}
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
                <DateInput
                    label={currentCategory?.type === stock ? 'Stock Reporting Date *' : 'End Date *'}
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
                {currentCategory?.type === flow && (
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
                {value.unit === household && (
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
                                    {...getFigureReviewProps(review, figureId, 'disaggregationDisplacementUrban')}
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
                                    {...getFigureReviewProps(review, figureId, 'disaggregationDisplacementRural')}
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
                                    {...getFigureReviewProps(review, figureId, 'disaggregationLocationCamp')}
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
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'disaggregationLocationNonCamp')}
                                />
                            )}
                        />
                    </Row>
                    <Row>
                        <NumberInput
                            label="Disability"
                            name="disaggregationDisability"
                            value={value.disaggregationDisability}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationDisability}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'disaggregationDisability')}
                                />
                            )}
                        />
                        <NumberInput
                            label="Indigenous People"
                            name="disaggregationIndigenousPeople"
                            value={value.disaggregationIndigenousPeople}
                            onChange={onValueChange}
                            error={error?.fields?.disaggregationIndigenousPeople}
                            disabled={disabled}
                            readOnly={!editMode}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'disaggregationIndigenousPeople')}
                                />
                            )}
                        />
                    </Row>
                    <div className={styles.block}>
                        <Header
                            size="extraSmall"
                            heading="Age & Gender"
                            actions={editMode && (
                                <Button
                                    name={undefined}
                                    onClick={handleAgeAdd}
                                    disabled={disabled}
                                >
                                    Add Age & Gender
                                </Button>
                            )}
                        />
                        <NonFieldError>
                            {error?.fields?.disaggregationAgeJson?.$internal}
                        </NonFieldError>
                        {isDefined(diff) && diff > 0 && (
                            <NonFieldWarning>
                                The sum of disaggregated values is less than reported value
                            </NonFieldWarning>
                        )}
                        {isDefined(diff) && diff < 0 && (
                            <NonFieldWarning>
                                The sum of disaggregated values is greater than reported value
                            </NonFieldWarning>
                        )}
                        {value?.disaggregationAgeJson?.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by age & gender.
                            </div>
                        ) : value?.disaggregationAgeJson?.map((age, i) => (
                            <AgeInput
                                key={age.uuid}
                                selected={age.uuid === selectedAge}
                                index={i}
                                value={age}
                                ageOptions={ageCategoryOptions}
                                genderOptions={genderCategoryOptions}
                                onChange={onAgeChange}
                                onRemove={onAgeRemove}
                                error={
                                    error?.fields?.disaggregationAgeJson?.members?.[age.uuid]
                                }
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
