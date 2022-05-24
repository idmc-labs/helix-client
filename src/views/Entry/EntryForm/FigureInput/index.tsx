import React, {
    Dispatch,
    memo,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    NumberInput,
    DateInput,
    Switch,
    SelectInput,
    Button,
    Modal,
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
import { IoMdEye, IoMdEyeOff } from 'react-icons/io';
import { v4 as uuidv4 } from 'uuid';
import { IoCalculator } from 'react-icons/io5';

import MarkdownEditor from '#components/MarkdownEditor';
import NotificationContext from '#components/NotificationContext';
import Row from '#components/Row';
import GeoInput from '#components/GeoInput';
import NonFieldError from '#components/NonFieldError';
import NonFieldWarning from '#components/NonFieldWarning';
import Section from '#components/Section';
import Header from '#components/Header';
import useModalState from '#hooks/useModalState';
import EventForm from '#components/forms/EventForm';
import DomainContext from '#components/DomainContext';
import TrafficLightInput from '#components/TrafficLightInput';
import FigureTagMultiSelectInput, { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';
import EventListSelectInput, { EventListOption } from '#components/selections/EventListSelectInput';
import ViolenceContextMultiSelectInput, { ViolenceContextOption } from '#components/selections/ViolenceContextMultiSelectInput';

import {
    enumKeySelector,
    enumLabelSelector,
    formatDate,
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';
import {
    HouseholdSizeQuery,
    Unit,
    Figure_Category_Types as FigureCategoryTypes,
    Figure_Terms as FigureTerms,
    EventOptionsQuery,
} from '#generated/types';
import {
    isFlowCategory,
    isStockCategory,
    isHousingCategory,
    isDisplacementCategory,
} from '#utils/selectionConstants';

import AgeInput from '../AgeInput';
import GeoLocationInput from '../GeoLocationInput';
import {
    FigureFormProps,
    AgeFormProps,
    ReviewInputFields,
    EntryReviewStatus,

    TagOptions,
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

const HOUSEHOLD_SIZE = gql`
    query HouseholdSize($country: ID!, $year: Int!) {
        householdSize(country: $country, year: $year) {
            id
            size
            year
        }
    }
`;

function generateIduText(
    quantifier?: string | undefined | null,
    figureInfo?: string | undefined,
    unitInfo?: string | undefined | null,
    displacementInfo?: string | undefined,
    locationInfo?: string | undefined,
    startDateInfo?: string | undefined,
) {
    const quantifierField = quantifier || 'Quantifier: More than, Around, Less than, Atleast...';
    const figureField = figureInfo || '(total-figure)';
    const unitField = unitInfo || '(people or household)';
    const displacementField = displacementInfo || '(Displacement term: Displaced, ...)';
    const locationField = locationInfo || '(Location)';
    const startDateField = startDateInfo || '(Start Date of Event DD/MM/YYY)';
    const triggerField = '(Trigger info)';

    return `${quantifierField} ${figureField} ${unitField} were ${displacementField} in ${locationField} on ${startDateField} due to ${triggerField}`;
}

const FIGURE_EVENT_OPTIONS = gql`
    query FigureEventOptions {
        osvSubTypeList {
            results {
                id
                name
            }
        }
        figureCause: __type(name: "CRISIS_TYPE") {
            name
            enumValues {
                name
                description
            }
        }
        disasterCategoryList {
            results {
                id
                name
                subCategories {
                    results {
                        id
                        name
                        types {
                            results {
                                id
                                name
                                subTypes {
                                    results {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        violenceList {
            results {
                id
                name
                subTypes {
                    results {
                        id
                        name
                    }
                }
            }
        }
    }
`;

const countryKeySelector = (data: { id: string; idmcShortName: string }) => data.id;
const countryLabelSelector = (data: { id: string; idmcShortName: string }) => data.idmcShortName;

interface ViolenceOption {
    violenceTypeId: string;
    violenceTypeName: string;
}
const violenceGroupKeySelector = (item: ViolenceOption) => (
    item.violenceTypeId
);
const violenceGroupLabelSelector = (item: ViolenceOption) => (
    item.violenceTypeName
);

interface DisasterOption {
    disasterTypeId: string;
    disasterTypeName: string;
    disasterSubCategoryId: string;
    disasterSubCategoryName: string;
    disasterCategoryId: string;
    disasterCategoryName: string;
}
const disasterGroupKeySelector = (item: DisasterOption) => (
    `${item.disasterCategoryId}-${item.disasterSubCategoryId}-${item.disasterTypeId}`
);
const disasterGroupLabelSelector = (item: DisasterOption) => (
    `${item.disasterCategoryName} › ${item.disasterSubCategoryName} › ${item.disasterTypeName}`
);

type FigureInputValue = PartialForm<FigureFormProps>;
type FigureInputValueWithId = PartialForm<FigureFormProps> & { id: string };

type HouseholdSize = NonNullable<HouseholdSizeQuery['householdSize']>;
const householdKeySelector = (item: HouseholdSize) => String(item.size);

const defaultValue: FigureInputValue = {
    uuid: 'random',
};

interface FigureInputProps {
    index: number;
    value: FigureInputValue;
    error: Error<FigureFormProps> | undefined;
    onChange: (value: StateArg<PartialForm<FigureFormProps>>, index: number) => void;
    onRemove: (index: number) => void;
    disabled?: boolean;
    mode: 'view' | 'review' | 'edit';
    review?: ReviewInputFields,
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
    trafficLightShown: boolean;

    selected?: boolean;
    events: EventListOption[] | null | undefined;
    setEvents: Dispatch<SetStateAction<EventListOption[] | null | undefined>>;
    tagOptions: TagOptions;
    setTagOptions: Dispatch<SetStateAction<FigureTagOption[] | null | undefined>>;
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
        review,
        events,
        onReviewChange,

        selected,

        optionsDisabled: figureOptionsDisabled,
        tagOptions,
        setTagOptions,
        setEvents,
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
    const { user } = useContext(DomainContext);
    const eventPermissions = user?.permissions?.event;

    const [selectedAge, setSelectedAge] = useState<string | undefined>();
    const [mapShown, setMapShown] = useState<boolean | undefined>(false);
    const [eventDetailsShown, , , , toggleEventDetailsShown] = useModalState(false);
    const [
        violenceContextOptions,
        setViolenceContextOptions,
    ] = useState<ViolenceContextOption[] | null | undefined>();

    const [
        shouldShowEventModal,
        eventModalId,
        showEventModal,
        hideEventModal,
    ] = useModalState();

    const editMode = mode === 'edit';
    const reviewMode = mode === 'review';
    const eventNotChosen = !value.event;

    const { country, startDate } = value;
    const year = (() => (startDate?.match(/^\d+/)?.[0]))();

    const variables = useMemo(
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
    } = useQuery<HouseholdSizeQuery>(HOUSEHOLD_SIZE, {
        skip: !variables,
        variables,
    });

    const {
        data,
    } = useQuery<EventOptionsQuery>(FIGURE_EVENT_OPTIONS);

    const violenceSubTypeOptions = useMemo(
        () => data?.violenceList?.results?.flatMap((violenceType) => (
            violenceType.subTypes?.results?.map((violenceSubType) => ({
                ...violenceSubType,
                violenceTypeId: violenceType.id,
                violenceTypeName: violenceType.name,
            }))
        )).filter(isDefined),
        [data?.violenceList],
    );

    // eslint-disable-next-line max-len
    const disasterSubTypeOptions = data?.disasterCategoryList?.results?.flatMap((disasterCategory) => (
        disasterCategory.subCategories?.results?.flatMap((disasterSubCategory) => (
            disasterSubCategory.types?.results?.flatMap((disasterType) => (
                disasterType.subTypes?.results?.map((disasterSubType) => ({
                    ...disasterSubType,
                    disasterTypeId: disasterType.id,
                    disasterTypeName: disasterType.name,
                    disasterSubCategoryId: disasterSubCategory.id,
                    disasterSubCategoryName: disasterSubCategory.name,
                    disasterCategoryId: disasterCategory.id,
                    disasterCategoryName: disasterCategory.name,
                }))
            ))
        ))
    )).filter(isDefined);

    const households = [householdData?.householdSize].filter(isDefined);

    const onValueChange = useFormObject(index, onChange, defaultValue);

    const handleEventCreate = useCallback(
        (newEvent: EventListOption) => {
            setEvents((oldEvents) => [...(oldEvents ?? []), newEvent]);
            onValueChange(newEvent.id, 'event' as const);
            hideEventModal();
        },
        [
            onValueChange,
            hideEventModal,
            setEvents,
        ],
    );

    const handleCountryChange = useCallback(
        (countryValue: string | undefined, countryName: 'country') => {
            setMapShown(true);
            onValueChange(countryValue, countryName);
        },
        [onValueChange],
    );

    const handleAgeAdd = useCallback(() => {
        const uuid = uuidv4();
        const newAge: PartialForm<AgeFormProps> = { uuid };
        setSelectedAge(newAge.uuid);
        onValueChange(
            [...(value.disaggregationAge ?? []), newAge],
            'disaggregationAge' as const,
        );
        notify({
            children: 'Age added!',
            variant: 'success',
        });
    }, [onValueChange, value, notify]);

    const handleShowMapAction = useCallback(() => {
        setMapShown((oldValue) => !oldValue);
    }, []);

    type DisaggregationAge = NonNullable<(typeof value.disaggregationAge)>[number];
    const {
        onValueChange: onAgeChange,
        onValueRemove: onAgeRemove,
    } = useFormArray<'disaggregationAge', DisaggregationAge>('disaggregationAge', onValueChange);

    type GeoLocations = NonNullable<(typeof value.geoLocations)>[number];
    const {
        onValueChange: onGeoLocationChange,
        onValueRemove: onGeoLocationRemove,
    } = useFormArray<'geoLocations', GeoLocations>('geoLocations', onValueChange);

    const elementRef = useRef<HTMLDivElement>(null);

    const handleIduGenerate = useCallback(() => {
        const originLocations = value?.geoLocations?.filter((location) => location.identifier === 'ORIGIN');
        const locationNames = originLocations?.map((loc) => loc.name).join(', ');
        const figureText = value?.reported?.toString();
        const quantifierText = quantifierOptions
            ?.find((q) => q.name === value?.quantifier)?.description;

        const unitText = unitOptions
            ?.find((unit) => unit.name === value?.unit)?.description?.toLowerCase();

        const displacementText = termOptions
            ?.find((termValue) => termValue.name === value?.term)?.name.toLowerCase();
        const startDateInfo = formatDate(value.startDate);

        const excerptIduText = generateIduText(
            quantifierText,
            figureText,
            unitText,
            displacementText,
            locationNames,
            startDateInfo,
        );
        onValueChange(excerptIduText, 'excerptIdu' as const);
    }, [
        onValueChange,
        value.unit,
        value.term,
        value.reported,
        value.quantifier,
        value.geoLocations,
        value.startDate,
        termOptions,
        quantifierOptions,
        unitOptions,
    ]);

    useEffect(() => {
        if (selected) {
            elementRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [selected]);

    // FIXME: The type of value should have be FigureInputValueWithId instead.
    const { id: figureId } = value as FigureInputValueWithId;

    const selectedEvent = events?.find((item) => item.id === value?.event);

    // FIXME: The value "countries" of selectedEvent needs to be handled from server.
    const currentCountry = selectedEvent?.countries.find((item) => item.id === value?.country);
    const currentCategory = value.category as (FigureCategoryTypes | undefined);
    const currentTerm = value.term as (FigureTerms | undefined);

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
            const values = value.disaggregationAge?.map(
                (item) => item.value,
            ).filter(isDefined);
            if (!values || values.length <= 0) {
                return undefined;
            }
            return sum(values);
        },
        [value.disaggregationAge],
    );

    const diff = isDefined(totalValue) && isDefined(totalDisaggregatedValue)
        ? totalValue - totalDisaggregatedValue
        : 0;

    const eventBlock = (
        <>
            <Row>
                <div className={styles.eventRow}>
                    <EventListSelectInput
                        error={error?.fields?.event}
                        label="Event *"
                        name="event"
                        className={styles.eventSelectInput}
                        options={events}
                        value={value.event}
                        onChange={onValueChange}
                        onOptionsChange={setEvents}
                        disabled={disabled || figureOptionsDisabled}
                        readOnly={!editMode || !!value.country}
                        icons={trafficLightShown && review && (
                            <TrafficLightInput
                                disabled={!reviewMode}
                                name="event"
                                onChange={onReviewChange}
                                value={review.event?.value}
                                comment={review.event?.comment}
                            />
                        )}
                        actions={(
                            <Button
                                onClick={toggleEventDetailsShown}
                                name={undefined}
                                transparent
                                title={eventDetailsShown ? 'Hide event details' : 'Show event details'}
                                compact
                            >
                                {eventDetailsShown ? <IoMdEyeOff /> : <IoMdEye />}
                            </Button>
                        )}
                    />
                    {eventPermissions && !value.country && (
                        <Button
                            name={undefined}
                            className={styles.addEventButton}
                            onClick={showEventModal}
                        >
                            Add Event
                        </Button>
                    )}
                </div>
            </Row>
            {shouldShowEventModal && (
                <Modal
                    className={styles.addEventModal}
                    bodyClassName={styles.body}
                    heading="Add Event"
                    onClose={hideEventModal}
                >
                    <EventForm
                        id={eventModalId}
                        onEventCreate={handleEventCreate}
                        onEventFormCancel={hideEventModal}
                    />
                </Modal>
            )}
            {value.event && eventDetailsShown && (
                <EventForm
                    className={styles.eventDetails}
                    id={value.event}
                    readOnly
                />
            )}
        </>
    );

    return (
        <Section
            elementRef={elementRef}
            heading={`Figure #${index + 1}`}
            headerClassName={styles.header}
            subSection
            actions={editMode && (
                <Button
                    name={index}
                    onClick={onRemove}
                    disabled={disabled}
                >
                    Remove
                </Button>
            )}
        >
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            {eventBlock}
            <Row>
                <SelectInput
                    error={error?.fields?.country}
                    label="Country *"
                    name="country"
                    options={selectedEvent?.countries}
                    value={value.country}
                    keySelector={countryKeySelector}
                    labelSelector={countryLabelSelector}
                    onChange={handleCountryChange}
                    disabled={disabled || eventNotChosen}
                    // NOTE: Disable changing country when there are more than one geolocation
                    readOnly={!editMode || (value.geoLocations?.length ?? 0) > 0}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'country')}
                        />
                    )}
                    actions={value.country && (
                        <Button
                            name={undefined}
                            onClick={handleShowMapAction}
                            disabled={eventNotChosen}
                            compact
                            transparent
                        >
                            {mapShown ? 'Hide Map' : 'Show Map'}
                        </Button>
                    )}
                />
            </Row>
            {value.country && mapShown && (
                <Row>
                    <GeoInput
                        className={styles.geoInput}
                        name="geoLocations"
                        value={value.geoLocations}
                        onChange={onValueChange}
                        country={currentCountry}
                        readOnly={!editMode}
                        disabled={disabled || eventNotChosen}
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
                            disabled={disabled || eventNotChosen}
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
                <MarkdownEditor
                    name="calculationLogic"
                    label="Analysis and calculation logic *"
                    onChange={onValueChange}
                    value={value.calculationLogic}
                    error={error?.fields?.calculationLogic}
                    disabled={disabled || eventNotChosen}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'calculationLogic')}
                        />
                    )}
                />
            </Row>
            <Row>
                <MarkdownEditor
                    name="caveats"
                    label="Caveats"
                    onChange={onValueChange}
                    value={value.caveats}
                    error={error?.fields?.caveats}
                    disabled={disabled || eventNotChosen}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'caveats')}
                        />
                    )}
                />
            </Row>
            <Row>
                <MarkdownEditor
                    label="Source Excerpt"
                    onChange={onValueChange}
                    value={value.sourceExcerpt}
                    name="sourceExcerpt"
                    error={error?.fields?.sourceExcerpt}
                    disabled={disabled || eventNotChosen}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'sourceExcerpt')}
                        />
                    )}
                />
            </Row>
            <Row>
                <FigureTagMultiSelectInput
                    options={tagOptions}
                    name="tags"
                    label="Tags"
                    onChange={onValueChange}
                    value={value.tags}
                    error={error?.fields?.tags?.$internal}
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
                    readOnly={!editMode}
                    onOptionsChange={setTagOptions}
                />
            </Row>
            <Row>
                <ViolenceContextMultiSelectInput
                    className={styles.input}
                    options={violenceContextOptions}
                    label="Context of Violence"
                    name="contextOfViolence"
                    value={value.contextOfViolence}
                    onChange={onValueChange}
                    onOptionsChange={setViolenceContextOptions}
                    error={error?.fields?.contextOfViolence?.$internal}
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
                />
                <SelectInput
                    options={data?.osvSubTypeList?.results}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    label="OSV Subtype"
                    name="osvSubType"
                    value={value.osvSubType}
                    onChange={onValueChange}
                    error={error?.fields?.osvSubType}
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
                />
                <SelectInput
                    options={data?.eventType?.enumValues}
                    label="Figure Cause *"
                    name="figureCause"
                    error={error?.fields?.figureCause}
                    value={value.figureCause}
                    onChange={onValueChange}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
                />
            </Row>
            <Row>
                <SelectInput
                    options={violenceSubTypeOptions}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    label="Violence Type *"
                    name="violenceSubType"
                    value={value.violenceSubType}
                    onChange={onValueChange}
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
                    error={error?.fields?.violenceSubType}
                    groupLabelSelector={violenceGroupLabelSelector}
                    groupKeySelector={violenceGroupKeySelector}
                    grouped
                />
                <SelectInput
                    options={disasterSubTypeOptions}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    label="Disaster Type *"
                    name="disasterSubType"
                    value={value.disasterSubType}
                    onChange={onValueChange}
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
                    error={error?.fields?.disasterSubType}
                    groupLabelSelector={disasterGroupLabelSelector}
                    groupKeySelector={disasterGroupKeySelector}
                    grouped
                />
            </Row>
            <Row>
                <SelectInput
                    options={categoryOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Type *"
                    name="category"
                    value={value.category}
                    onChange={onValueChange}
                    error={error?.fields?.category}
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'category')}
                        />
                    )}
                />
                <SelectInput
                    options={roleOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Role *"
                    name="role"
                    value={value.role}
                    onChange={onValueChange}
                    error={error?.fields?.role}
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'role')}
                        />
                    )}
                />
                <SelectInput
                    options={termOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Term *"
                    name="term"
                    value={value.term}
                    onChange={onValueChange}
                    error={error?.fields?.term}
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'term')}
                        />
                    )}
                />
                {isDisplacementCategory(currentTerm) && (
                    <SelectInput
                        options={displacementOptions}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        label="Displacement Occurred"
                        name="displacementOccurred"
                        value={value.displacementOccurred}
                        onChange={onValueChange}
                        error={error?.fields?.displacementOccurred}
                        disabled={eventNotChosen}
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
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'quantifier')}
                        />
                    )}
                />
                <NumberInput
                    label="Reported Figure *"
                    name="reported"
                    value={value.reported}
                    onChange={onValueChange}
                    error={error?.fields?.reported}
                    disabled={disabled || eventNotChosen}
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
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getFigureReviewProps(review, figureId, 'unit')}
                        />
                    )}
                />
                {value.unit === household && (
                    <>
                        <NumberInput
                            label="Household Size *"
                            name="householdSize"
                            value={value.householdSize}
                            onChange={onValueChange}
                            error={error?.fields?.householdSize}
                            disabled={disabled || eventNotChosen}
                            readOnly={!editMode}
                            suggestions={households}
                            suggestionKeySelector={householdKeySelector}
                            suggestionLabelSelector={householdKeySelector}
                        />
                        <NumberInput
                            label="Total Figure"
                            name="totalFigure"
                            value={Math.round((value.householdSize ?? 0) * (value.reported ?? 0))}
                            disabled={disabled || eventNotChosen}
                            readOnly
                        />
                    </>
                )}
            </Row>
            <Row>
                <DateInput
                    label={isStockCategory(currentCategory) ? 'Stock Date *' : 'Start Date *'}
                    name="startDate"
                    value={value.startDate}
                    onChange={onValueChange}
                    disabled={disabled || eventNotChosen}
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
                    label={isStockCategory(currentCategory) ? 'Stock Date Accuracy' : 'Start Date Accuracy'}
                    name="startDateAccuracy"
                    value={value.startDateAccuracy}
                    onChange={onValueChange}
                    error={error?.fields?.startDateAccuracy}
                    disabled={disabled || figureOptionsDisabled || eventNotChosen}
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
                    label={isStockCategory(currentCategory) ? 'Stock Reporting Date *' : 'End Date *'}
                    name="endDate"
                    value={value.endDate}
                    onChange={onValueChange}
                    disabled={disabled || eventNotChosen}
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
                {isFlowCategory(currentCategory) && (
                    <SelectInput
                        options={dateAccuracyOptions}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        label="End Date Accuracy"
                        name="endDateAccuracy"
                        value={value.endDateAccuracy}
                        onChange={onValueChange}
                        error={error?.fields?.endDateAccuracy}
                        disabled={disabled || figureOptionsDisabled || eventNotChosen}
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
            {isHousingCategory(currentTerm) && (
                <Row>
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
                        disabled={disabled || eventNotChosen}
                        readOnly={!editMode}
                    />
                </Row>
            )}
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
                    disabled={disabled || eventNotChosen}
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
                            disabled={disabled || eventNotChosen}
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
                            disabled={disabled || eventNotChosen}
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
                            disabled={disabled || eventNotChosen}
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
                            disabled={disabled || eventNotChosen}
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
                            disabled={disabled || eventNotChosen}
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
                            disabled={disabled || eventNotChosen}
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
                                    disabled={disabled || eventNotChosen}
                                >
                                    Add Age & Gender
                                </Button>
                            )}
                        />
                        <NonFieldError>
                            {error?.fields?.disaggregationAge?.$internal}
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
                        {value?.disaggregationAge?.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by age & gender.
                            </div>
                        ) : value?.disaggregationAge?.map((age, i) => (
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
                                    error?.fields?.disaggregationAge?.members?.[age.uuid]
                                }
                                disabled={disabled || eventNotChosen}
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
                    disabled={disabled || eventNotChosen}
                    readOnly={!editMode}
                />
            </Row>
            {value.includeIdu && (
                <Row>
                    <MarkdownEditor
                        label="Excerpt for IDU"
                        name="excerptIdu"
                        value={value.excerptIdu}
                        onChange={onValueChange}
                        disabled={disabled || eventNotChosen}
                        error={error?.fields?.excerptIdu}
                        readOnly={!editMode}
                        icons={trafficLightShown && review && (
                            <TrafficLightInput
                                disabled={!reviewMode}
                                onChange={onReviewChange}
                                {...getFigureReviewProps(review, figureId, 'excerptIdu')}
                            />
                        )}
                        hint={generateIduText()}
                        actions={!trafficLightShown && (
                            <Button
                                name={undefined}
                                onClick={handleIduGenerate}
                                transparent
                                title="Generate excerpt for IDU"
                                disabled={disabled}
                            >
                                <IoCalculator />
                            </Button>
                        )}
                    />
                </Row>
            )}
        </Section>
    );
}

export default memo(FigureInput);
