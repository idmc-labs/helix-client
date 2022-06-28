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
    TextInput,
    NumberInput,
    DateInput,
    Switch,
    SelectInput,
    Button,
    Modal,
} from '@togglecorp/toggle-ui';
import {
    isDefined,
    sum,
    unique,
    _cs,
    isTruthyString,
    listToMap,
} from '@togglecorp/fujs';
import {
    PartialForm,
    Error,
    useFormArray,
    useFormObject,
    StateArg,
    removeNull,
    analyzeErrors,
} from '@togglecorp/toggle-form';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';
import { IoCalculator, IoAdd, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';

import OrganizationForm from '#views/Organizations/OrganizationTable/OrganizationForm';
import OrganizationMultiSelectInput, { OrganizationOption } from '#components/selections/OrganizationMultiSelectInput';
import CollapsibleContent from '#components/CollapsibleContent';
import MarkdownEditor from '#components/MarkdownEditor';
import NotificationContext from '#components/NotificationContext';
import Row from '#components/Row';
import GeoInput from '#components/GeoInput';
import NonFieldError from '#components/NonFieldError';
import NonFieldWarning from '#components/NonFieldWarning';
import Section from '#components/Section';
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
    Crisis_Type as CrisisType,
    Quantifier,
} from '#generated/types';
import {
    isFlowCategory,
    isStockCategory,
    isHousingTerm,
    isDisplacementTerm,
} from '#utils/selectionConstants';

import AgeInput from '../AgeInput';
import GeoLocationInput from '../GeoLocationInput';
import {
    FigureFormProps,
    AgeFormProps,
    ReviewInputFields,
    EntryReviewStatus,

    TagOptions,
    CauseOptions,
    AccuracyOptions,
    UnitOptions,
    TermOptions,
    RoleOptions,
    GenderOptions,
    IdentifierOptions,
    QuantifierOptions,
    CategoryOptions,
    DateAccuracyOptions,
    DisplacementOptions,
    DisasterCategoryOptions,
    ViolenceCategoryOptions,
    OsvSubTypeOptions,
    OtherSubTypeOptions,
} from '../types';
import { getFigureReviewProps } from '../utils';
import styles from './styles.css';

// FIXME: the comparision should be type-safe but
// we are currently downcasting string literals to string
const conflict: CrisisType = 'CONFLICT';
const disaster: CrisisType = 'DISASTER';
const other: CrisisType = 'OTHER';

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
    simplified?: boolean,
) {
    const quantifierField = quantifier || (simplified ? '(Quantifier)' : 'Quantifier: More than, Around, Less than, At least...');
    const figureField = figureInfo || '(Figure)';
    const unitField = unitInfo || '(People or Household)';
    const displacementField = displacementInfo || (simplified ? '(Displacement term)' : '(Displacement term: Displaced, ...)');
    const locationField = locationInfo || '(Location)';
    const startDateField = startDateInfo || (simplified ? '(Start Date)' : '(Start Date of Event DD/MM/YYY)');

    const withoutQuantifier = `${figureField} ${unitField} were ${displacementField} in ${locationField} on ${startDateField}`;
    const withoutTrigger = `${quantifierField} ${figureField} ${unitField} were ${displacementField} in ${locationField} on ${startDateField}`;

    const triggerField = '(Trigger)';
    return simplified ? withoutQuantifier : `${withoutTrigger} due to ${triggerField}`;
}

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

    organizations: OrganizationOption[] | null | undefined;
    setOrganizations: React.Dispatch<React.SetStateAction<OrganizationOption[] | null | undefined>>;

    selectedFigure?: string;
    setSelectedFigure: React.Dispatch<React.SetStateAction<string | undefined>>;

    events: EventListOption[] | null | undefined;
    setEvents: Dispatch<SetStateAction<EventListOption[] | null | undefined>>;
    tagOptions: TagOptions;
    setTagOptions: Dispatch<SetStateAction<FigureTagOption[] | null | undefined>>;
    violenceContextOptions: ViolenceContextOption[] | null | undefined;
    setViolenceContextOptions: Dispatch<SetStateAction<ViolenceContextOption[] | null | undefined>>;
    causeOptions: CauseOptions,
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
    genderCategoryOptions: GenderOptions;

    otherSubTypeOptions: OtherSubTypeOptions | null | undefined;
    disasterCategoryOptions: DisasterCategoryOptions | null | undefined;
    violenceCategoryOptions: ViolenceCategoryOptions | null | undefined,
    osvSubTypeOptions: OsvSubTypeOptions | null | undefined,
}

interface DisplacementTypeOption {
    name: string;
    description?: string | null | undefined;
}

const figureCategoryGroupKeySelector = (item: DisplacementTypeOption) => (
    isFlowCategory(item.name as FigureCategoryTypes) ? 'Flow' : 'Stock'
);

const figureCategoryGroupLabelSelector = (item: DisplacementTypeOption) => (
    isFlowCategory(item.name as FigureCategoryTypes) ? 'Flow' : 'Stock'
);

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

        selectedFigure,
        setSelectedFigure,

        optionsDisabled: figureOptionsDisabled,
        violenceContextOptions,
        setViolenceContextOptions,
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
        genderCategoryOptions,
        causeOptions,

        organizations,
        setOrganizations,

        disasterCategoryOptions,
        violenceCategoryOptions,
        osvSubTypeOptions,
        otherSubTypeOptions,
    } = props;

    const [
        shouldShowAddOrganizationModal,
        editableOrganizationId,
        showAddOrganizationModal,
        hideAddOrganizationModal,
    ] = useModalState();

    const { notify } = useContext(NotificationContext);
    const { user } = useContext(DomainContext);
    const eventPermissions = user?.permissions?.event;

    const [selectedAge, setSelectedAge] = useState<string | undefined>();
    const [locationsShown, setLocationsShown] = useState<boolean | undefined>(false);
    const [eventDetailsShown, , , , toggleEventDetailsShown] = useModalState(false);
    const [expanded, setExpanded] = useState<boolean>(selectedFigure === value.uuid);

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

    const violenceSubTypeOptions = useMemo(
        () => violenceCategoryOptions?.results?.flatMap((violenceType) => (
            violenceType.subTypes?.results?.map((violenceSubType) => ({
                ...violenceSubType,
                violenceTypeId: violenceType.id,
                violenceTypeName: violenceType.name,
            }))
        )).filter(isDefined),
        [violenceCategoryOptions],
    );

    // FIXME: use memo
    const disasterSubTypeOptions = useMemo(
        () => disasterCategoryOptions?.results?.flatMap((disasterCategory) => (
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
        )).filter(isDefined),
        [disasterCategoryOptions],
    );

    const households = [householdData?.householdSize].filter(isDefined);

    const onValueChange = useFormObject(index, onChange, defaultValue);

    const handleCountryChange = useCallback(
        (countryValue: string | undefined, countryName: 'country') => {
            setLocationsShown(true);
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
            children: 'Added new age & gender!',
            variant: 'default',
        });
    }, [onValueChange, value, notify]);

    const handleEventChange = useCallback((val: string | undefined, _: 'event', option: EventListOption) => {
        const safeOption = removeNull(option);
        onChange((prevVal) => {
            if (!prevVal) {
                return defaultValue;
            }
            return {
                ...prevVal,
                event: val,
                figureCause: safeOption.eventType,
                contextOfViolence: safeOption.contextOfViolence?.map((c) => c.id),
                osvSubType: safeOption.osvSubType?.id,
                violenceSubType: safeOption.violenceSubType?.id,

                disasterSubType: safeOption.disasterSubType?.id,

                otherSubType: safeOption.otherSubType?.id,
            };
        }, index);

        setViolenceContextOptions((oldVal) => (unique(
            [...(oldVal ?? []), ...safeOption.contextOfViolence],
            (v) => v.id,
        )));
    }, [
        onChange,
        index,
        setViolenceContextOptions,
    ]);

    const handleEventCreate = useCallback(
        (newEvent: EventListOption) => {
            setEvents((oldEvents) => [...(oldEvents ?? []), newEvent]);
            handleEventChange(newEvent.id, 'event', newEvent);
            hideEventModal();
        },
        [
            handleEventChange,
            hideEventModal,
            setEvents,
        ],
    );

    const handleShowLocationsAction = useCallback(() => {
        setLocationsShown((oldValue) => !oldValue);
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

    const handleExpansionChange = useCallback((val: boolean, key: string) => {
        setExpanded(val);
        setSelectedFigure((oldValue) => (
            oldValue === key ? undefined : key
        ));
    }, [setSelectedFigure]);

    const handleIduGenerate = useCallback(() => {
        const originLocations = value?.geoLocations?.filter((location) => location.identifier === 'ORIGIN');
        const locationNames = originLocations?.map((loc) => loc.name).join(', ');
        const figureText = value?.reported?.toString();

        const quantifierValue = value?.quantifier as (Quantifier | undefined);

        // NOTE: we have an exception to quanitifier text
        const quantifierText = quantifierValue === 'EXACT'
            ? 'At least'
            : quantifierOptions?.find((q) => q.name === quantifierValue)?.description;

        const unitText = unitOptions
            ?.find((unit) => unit.name === value?.unit)?.description?.toLowerCase();

        const displacementText = termOptions
            ?.find((termValue) => termValue.name === value?.term)?.description?.toLowerCase();
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

    const handleStartDateChange = useCallback((val: string | undefined) => {
        onValueChange(val, 'startDate');
        if (val && !value.endDate) {
            onValueChange(val, 'endDate');
        }
    }, [onValueChange, value.endDate]);

    const selected = selectedFigure === value.uuid;
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

    const generatedFigureName = useMemo(
        () => {
            const originLocations = value?.geoLocations?.filter((location) => location.identifier === 'ORIGIN');
            const locationNames = originLocations?.map((loc) => loc.name).join(', ');
            const figureText = value?.reported?.toString();
            const unitText = unitOptions
                ?.find((unit) => unit.name === value?.unit)?.description?.toLowerCase();

            const displacementText = termOptions
                ?.find((termValue) => termValue.name === value?.term)?.description?.toLowerCase();
            const startDateInfo = formatDate(value.startDate);

            return generateIduText(
                undefined,
                figureText,
                unitText,
                displacementText,
                locationNames,
                startDateInfo,
                true,
            );
        },
        [
            value,
            termOptions,
            unitOptions,
        ],
    );

    const errored = analyzeErrors(error);

    const geospatialErrored = useMemo(
        () => (
            analyzeErrors(error?.fields?.country)
            || analyzeErrors(error?.fields?.geoLocations)
        ),
        [error?.fields?.country, error?.fields?.geoLocations],
    );

    const diff = useMemo(
        () => (
            isDefined(totalValue) && isDefined(totalDisaggregatedValue)
                ? totalValue - totalDisaggregatedValue
                : 0
        ),
        [totalDisaggregatedValue, totalValue],
    );

    const selectedSources = useMemo(
        () => {
            const mapping = listToMap(
                organizations ?? [],
                (item) => item.id,
                (item) => item,
            );
            return value.sources?.map((item) => mapping[item]).filter(isDefined);
        },
        [organizations, value?.sources],
    );

    const methodology = selectedSources
        ?.map((item) => item.methodology)
        .filter(isTruthyString)
        .join('\n\n');

    const reliability = useMemo(
        () => {
            const sourcesReliablities = selectedSources?.map(
                (item) => item.organizationKind?.reliability,
            ) ?? [];
            const low = (
                (sourcesReliablities.includes('LOW') && 'LOW')
                || (sourcesReliablities.includes('MEDIUM') && 'MEDIUM')
                || (sourcesReliablities.includes('HIGH') && 'HIGH')
                || undefined
            );
            const high = (
                (sourcesReliablities.includes('HIGH') && 'HIGH')
                || (sourcesReliablities.includes('MEDIUM') && 'MEDIUM')
                || (sourcesReliablities.includes('LOW') && 'LOW')
                || undefined
            );

            if (!low && !high) {
                return undefined;
            }
            if (low === high) {
                return low;
            }
            return `${low} to ${high}`;
        },
        [selectedSources],
    );

    return (
        <CollapsibleContent
            elementRef={elementRef}
            name={value.uuid}
            header={generatedFigureName}
            headerClassName={_cs(errored && styles.errored)}
            onExpansionChange={handleExpansionChange}
            isExpanded={expanded}
        >
            <Section
                heading={undefined}
                contentClassName={styles.sectionContent}
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
                <Row>
                    <EventListSelectInput
                        error={error?.fields?.event}
                        label="Event *"
                        name="event"
                        options={events}
                        value={value.event}
                        onChange={handleEventChange}
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
                            <>
                                <Button
                                    onClick={toggleEventDetailsShown}
                                    name={undefined}
                                    transparent
                                    compact
                                    title={eventDetailsShown ? 'Hide Event Details' : 'Show Event Details'}
                                >
                                    {eventDetailsShown ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                </Button>

                                {eventPermissions && editMode && !value.country && (
                                    <Button
                                        name={undefined}
                                        onClick={showEventModal}
                                        disabled={disabled}
                                        compact
                                        transparent
                                        label="Add Event"
                                    >
                                        <IoAdd />
                                    </Button>
                                )}
                            </>
                        )}
                        nonClearable
                    />
                </Row>
                {shouldShowEventModal && (
                    <Modal
                        className={styles.addEventModal}
                        bodyClassName={styles.body}
                        heading="Add Event"
                        onClose={hideEventModal}
                        size="large"
                        freeHeight
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
                <Row>
                    <SelectInput
                        options={causeOptions}
                        label="Cause *"
                        name="figureCause"
                        error={error?.fields?.figureCause}
                        value={value.figureCause}
                        onChange={onValueChange}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        readOnly
                        disabled={disabled || figureOptionsDisabled || eventNotChosen}
                        nonClearable
                    />
                    {value.figureCause === conflict && (
                        <>
                            <SelectInput
                                options={violenceSubTypeOptions}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="Main trigger of reported figure *"
                                name="violenceSubType"
                                value={value.violenceSubType}
                                onChange={onValueChange}
                                readOnly={!editMode}
                                disabled={disabled || figureOptionsDisabled || eventNotChosen}
                                error={error?.fields?.violenceSubType}
                                groupLabelSelector={violenceGroupLabelSelector}
                                groupKeySelector={violenceGroupKeySelector}
                                grouped
                                icons={trafficLightShown && review && (
                                    <TrafficLightInput
                                        disabled={!reviewMode}
                                        onChange={onReviewChange}
                                        {...getFigureReviewProps(review, figureId, 'violenceSubType')}
                                    />
                                )}
                            />
                            <SelectInput
                                options={osvSubTypeOptions?.results}
                                keySelector={basicEntityKeySelector}
                                labelSelector={basicEntityLabelSelector}
                                label="OSV Subtype"
                                name="osvSubType"
                                value={value.osvSubType}
                                onChange={onValueChange}
                                error={error?.fields?.osvSubType}
                                readOnly={!editMode}
                                disabled={disabled || figureOptionsDisabled || eventNotChosen}
                                icons={trafficLightShown && review && (
                                    <TrafficLightInput
                                        disabled={!reviewMode}
                                        onChange={onReviewChange}
                                        {...getFigureReviewProps(review, figureId, 'osvSubType')}
                                    />
                                )}
                            />
                            <ViolenceContextMultiSelectInput
                                className={styles.input}
                                options={violenceContextOptions}
                                label="Context of Violence"
                                name="contextOfViolence"
                                value={value.contextOfViolence}
                                onChange={onValueChange}
                                onOptionsChange={setViolenceContextOptions}
                                error={error?.fields?.contextOfViolence?.$internal}
                                readOnly={!editMode}
                                disabled={disabled || figureOptionsDisabled || eventNotChosen}
                                icons={trafficLightShown && review && (
                                    <TrafficLightInput
                                        disabled={!reviewMode}
                                        onChange={onReviewChange}
                                        {...getFigureReviewProps(review, figureId, 'contextOfViolence')}
                                    />
                                )}
                            />
                        </>
                    )}
                    {value.figureCause === disaster && (
                        <SelectInput
                            options={disasterSubTypeOptions}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            label="Main trigger of reported figures *"
                            name="disasterSubType"
                            value={value.disasterSubType}
                            onChange={onValueChange}
                            readOnly={!editMode}
                            disabled={disabled || figureOptionsDisabled || eventNotChosen}
                            error={error?.fields?.disasterSubType}
                            groupLabelSelector={disasterGroupLabelSelector}
                            groupKeySelector={disasterGroupKeySelector}
                            grouped
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'disasterSubType')}
                                />
                            )}
                        />
                    )}
                    {value.figureCause === other && (
                        <SelectInput
                            label="Main trigger of reported figures *"
                            name="otherSubType"
                            options={otherSubTypeOptions?.results}
                            value={value.otherSubType}
                            keySelector={basicEntityKeySelector}
                            labelSelector={basicEntityLabelSelector}
                            onChange={onValueChange}
                            error={error?.fields?.otherSubType}
                            readOnly={!editMode}
                            disabled={disabled || figureOptionsDisabled || eventNotChosen}
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    onChange={onReviewChange}
                                    {...getFigureReviewProps(review, figureId, 'otherSubType')}
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
                                value={Math.round(
                                    (value.householdSize ?? 0) * (value.reported ?? 0),
                                )}
                                disabled={disabled || eventNotChosen}
                                readOnly
                            />
                        </>
                    )}
                </Row>
                <Row>
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
                    <SelectInput
                        options={categoryOptions}
                        keySelector={enumKeySelector}
                        labelSelector={enumLabelSelector}
                        label="Category *"
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
                        grouped
                        groupKeySelector={figureCategoryGroupKeySelector}
                        groupLabelSelector={figureCategoryGroupLabelSelector}
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
                    {isDisplacementTerm(currentTerm) && (
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
                    {isHousingTerm(currentTerm) && (
                        <div className={styles.housingDestroyedContainer}>
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
                        </div>
                    )}
                </Row>
                <Row>
                    <OrganizationMultiSelectInput
                        label="Sources *"
                        onChange={onValueChange}
                        value={value.sources}
                        name="sources"
                        error={error?.fields?.sources?.$internal}
                        disabled={disabled || figureOptionsDisabled || eventNotChosen}
                        options={organizations}
                        onOptionsChange={setOrganizations}
                        readOnly={!editMode}
                        icons={trafficLightShown && review && (
                            <TrafficLightInput
                                disabled={!reviewMode}
                                className={styles.trafficLight}
                                onChange={onReviewChange}
                                {...getFigureReviewProps(review, figureId, 'sources')}
                            />
                        )}
                        onOptionEdit={showAddOrganizationModal}
                        optionEditable={editMode}
                        chip
                    />
                    <TextInput
                        name="reliability"
                        label="Level of Reliability"
                        value={reliability}
                        readOnly
                    />
                </Row>
                <MarkdownEditor
                    label="Source Methodology"
                    value={methodology}
                    name="sourceMethodology"
                    disabled={disabled}
                    readOnly
                />
                <Row>
                    <DateInput
                        label={isStockCategory(currentCategory) ? 'Stock Date *' : 'Start Date *'}
                        name="startDate"
                        value={value.startDate}
                        onChange={handleStartDateChange}
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
                <MarkdownEditor
                    name="calculationLogic"
                    label="Analysis, Caveats and Calculation Logic *"
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
                        <Section
                            contentClassName={styles.block}
                            subSection
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
                        >
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
                        </Section>
                    </>
                )}
                <Section
                    contentClassName={styles.block}
                    subSection
                    heading="Geospatial"
                    headerClassName={_cs(geospatialErrored && styles.errored)}
                >
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
                        // NOTE: Disable changing country when there are
                        // more than one geolocation
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
                                onClick={handleShowLocationsAction}
                                disabled={eventNotChosen}
                                compact
                                transparent
                                title={eventDetailsShown ? 'Hide Locations' : 'Show Locations'}
                            >
                                {locationsShown ? <IoEyeOffOutline /> : <IoEyeOutline />}
                            </Button>
                        )}
                    />
                    {value.country && locationsShown && (
                        <GeoInput
                            className={styles.geoInput}
                            name="geoLocations"
                            value={value.geoLocations}
                            onChange={onValueChange}
                            country={currentCountry}
                            readOnly={!editMode}
                            disabled={disabled || eventNotChosen}
                        />
                    )}
                    {value.country && locationsShown && (
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
                </Section>
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
                <Switch
                    label="Include in IDU"
                    name="includeIdu"
                    value={value.includeIdu}
                    onChange={onValueChange}
                    disabled={disabled || eventNotChosen}
                    readOnly={!editMode}
                />
                {value.includeIdu && (
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
                )}
            </Section>
            {shouldShowAddOrganizationModal && (
                <Modal
                    onClose={hideAddOrganizationModal}
                    heading="Edit Organization"
                    size="large"
                    freeHeight
                >
                    <OrganizationForm
                        id={editableOrganizationId}
                        onHideAddOrganizationModal={hideAddOrganizationModal}
                    />
                </Modal>
            )}
        </CollapsibleContent>
    );
}

export default memo(FigureInput);
