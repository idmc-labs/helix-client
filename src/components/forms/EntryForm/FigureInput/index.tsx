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
    ConfirmButton,
    Modal,
    Chip,
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
    useMutation,
    useQuery,
} from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';
import {
    IoCalculatorOutline,
    IoAddOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoOpenOutline,
} from 'react-icons/io5';

import useOptions from '#hooks/useOptions';
import Message from '#components/Message';
import { EVENT_FRAGMENT } from '#components/forms/EntryForm/queries';
import Status from '#components/tableHelpers/Status';
import OrganizationMultiSelectInput from '#components/selections/OrganizationMultiSelectInput';
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
import FigureTagMultiSelectInput from '#components/selections/FigureTagMultiSelectInput';
import EventListSelectInput, { EventListOption } from '#components/selections/EventListSelectInput';
import ViolenceContextMultiSelectInput from '#components/selections/ViolenceContextMultiSelectInput';
import {
    enumKeySelector,
    enumLabelSelector,
    formatDate,
    formatDateYmd,
    capitalizeFirstLetter,
    calculateHouseHoldSize,
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';
import {
    HouseholdSizeQuery,
    Unit,
    Role,
    Figure_Category_Types as FigureCategoryTypes,
    Figure_Terms as FigureTerms,
    Crisis_Type as CrisisType,
    Quantifier,
    Date_Accuracy as DateAccuracy,
    Displacement_Occurred as DisplacementOccurred,
    Gender_Type as GenderType,
    ApproveFigureMutation,
    ApproveFigureMutationVariables,
    UnApproveFigureMutation,
    UnApproveFigureMutationVariables,
    Figure_Review_Status as FigureReviewStatus,
    ReReviewFigureMutation,
    ReReviewFigureMutationVariables,

    FigureLastReviewCommentStatusType,
    Identifier,
} from '#generated/types';
import {
    isFlowCategory,
    isStockCategory,
    isVisibleCategory,
    isHousingTerm,
    isDisplacementTerm,
} from '#utils/selectionConstants';
import OrganizationForm from '#components/forms/OrganizationForm';
import ButtonLikeLink from '#components/ButtonLikeLink';
import route from '#config/routes';

import AgeInput from '../AgeInput';
import GeoLocationInput from '../GeoLocationInput';
import {
    FigureFormProps,
    AgeFormProps,

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
import styles from './styles.css';

// NOTE: the comparison should be type-safe but
// we are currently downcasting string literals to string
const conflict: CrisisType = 'CONFLICT';
const disaster: CrisisType = 'DISASTER';
const other: CrisisType = 'OTHER';

const household: Unit = 'HOUSEHOLD';
const person: Unit = 'PERSON';

const FIGURE_STATUS_FRAGMENT = gql`
    ${EVENT_FRAGMENT}
    fragment FigureStatusResponse on FigureType {
        id
        reviewStatus
        reviewStatusDisplay
        event {
            ...EventResponse
        }
    }
`;

const HOUSEHOLD_SIZE = gql`
    query HouseholdSize($country: ID!, $year: Int!) {
        householdSize(country: $country, year: $year) {
            id
            size
            year
        }
    }
`;

const APPROVE_FIGURE = gql`
    ${FIGURE_STATUS_FRAGMENT}
    mutation ApproveFigure($id: ID!) {
        approveFigure(id: $id) {
            errors
            ok
            result {
                ...FigureStatusResponse
            }
        }
    }
`;

const UN_APPROVE_FIGURE = gql`
    ${FIGURE_STATUS_FRAGMENT}
    mutation UnApproveFigure($id: ID!) {
        unapproveFigure(id: $id) {
            errors
            ok
            result {
                ...FigureStatusResponse
            }
        }
    }
`;

const RE_REQUEST_REVIEW_FIGURE = gql`
    ${FIGURE_STATUS_FRAGMENT}
    mutation ReReviewFigure($id: ID!) {
        reRequestReviewFigure(id: $id) {
            errors
            ok
            result {
                ...FigureStatusResponse
            }
        }
    }
`;

function generateFigureTitle(
    locationInfo?: string | undefined,
    countryInfo?: string | undefined,
    totalFigureInfo?: string | number | undefined,
    figureTypeInfo?: string | undefined | null,
    roleInfo?: string | undefined | null,
    causeInfo?: string | undefined | null,
    mainTriggerInfo?: string | undefined | null,
    startDateInfo?: string | undefined,
    includeIdu?: boolean | undefined,
    isHousingDestruction?: boolean | undefined,
    isTermDestroyedHousing?: boolean | undefined,
) {
    const locationField = locationInfo || '(Location)';
    const countryField = countryInfo || '(Country)';
    const totalFigureField = totalFigureInfo ?? '(Total Figure)';
    const figureTypeField = figureTypeInfo || '(Figure Type)';
    const figureRoleField = roleInfo || '(Figure Role)';
    const figureCauseType = causeInfo || '(Cause)';
    const causeField = mainTriggerInfo || '(Main Trigger)';
    const startDateField = startDateInfo || '(Start Date)';

    return [
        `${locationField},  ${countryField}`,
        isTermDestroyedHousing
            ? `${totalFigureField} ${figureTypeField} (DH)`
            : `${totalFigureField} ${figureTypeField}`,
        figureRoleField,
        `${figureCauseType}, ${causeField}`,
        includeIdu ? 'IDU' : undefined,
        isHousingDestruction ? 'Housing destruction Toggle On' : undefined,
        startDateField,
    ].filter(isDefined).join(' - ');
}

function generateIduText(
    mainTriggerInfo?: string | undefined | null,
    quantifierInfo?: string | undefined | null,
    figureInfo?: number | undefined,
    unitInfo?: string | undefined | null,
    displacementInfo?: string | undefined | null,
    locationInfo?: string | undefined | null,
    startDateInfo?: string | undefined | null,
    sourceTypeInfo?: string | undefined | null,
) {
    const causeField = mainTriggerInfo || '(Main trigger)';
    const quantifierField = quantifierInfo || 'Quantifier: More than, Around, Less than, At least...'; // here
    const figureField = figureInfo ?? '(Figure)';
    const unitField = unitInfo || '(People or Household)';
    const displacementField = displacementInfo || '(Displacement term: Displaced, ...)'; // here
    const locationField = locationInfo || '(Location)';
    const startDateField = startDateInfo || '(Start Date of Event DD/MM/YYY)';

    const sourceType = sourceTypeInfo || '(Source Type)';

    const rand = Math.floor(Math.random() * 3);
    if (rand === 0) {
        return `According to ${sourceType}, ${quantifierField} ${figureField} ${unitField} were ${displacementField} in ${locationField} due to ${causeField} on ${startDateField}`;
    }
    if (rand === 1) {
        return `${capitalizeFirstLetter(quantifierField)} ${figureField} ${unitField} were ${displacementField} due to ${causeField} on ${startDateField} in ${locationField}, according to ${sourceType}.`;
    }
    return `${capitalizeFirstLetter(causeField)} resulted in ${quantifierField} ${figureField} ${unitField} being ${displacementField} in ${locationField} on ${startDateField}, according to ${sourceType}.`;
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
    mode: 'view' | 'edit';
    trafficLightShown: boolean;

    selectedFigure?: string;
    setSelectedFigure: React.Dispatch<React.SetStateAction<string | undefined>>;

    events: EventListOption[] | null | undefined;
    setEvents: Dispatch<SetStateAction<EventListOption[] | null | undefined>>;
    causeOptions: CauseOptions;
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
    onFigureClone?: (item: FigureInputValue) => void;

    reviewStatus?: FigureReviewStatus | null | undefined;
    fieldStatuses?: FigureLastReviewCommentStatusType[] | null | undefined;
    isRecommended?: boolean;

    defaultShownField?: string | null;
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

const figureCategoryHideOptionFilter = (item: DisplacementTypeOption) => (
    isVisibleCategory(item.name as FigureCategoryTypes)
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
        events,

        selectedFigure,
        setSelectedFigure,

        optionsDisabled: figureOptionsDisabled,
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

        disasterCategoryOptions,
        violenceCategoryOptions,
        osvSubTypeOptions,
        otherSubTypeOptions,
        onFigureClone,

        reviewStatus,

        fieldStatuses,
        isRecommended,
        defaultShownField,
    } = props;
    const {
        notify,
        notifyGQLError,

    } = useContext(NotificationContext);
    const { user } = useContext(DomainContext);

    const [, setViolenceContextOptions] = useOptions('contextOfViolence');

    const elementRef = useRef<HTMLDivElement>(null);

    const editMode = mode === 'edit';
    const reviewMode = !editMode;
    const eventNotChosen = !value.event;
    const { country, startDate } = value;

    const [selectedAge, setSelectedAge] = useState<string | undefined>();

    const selected = selectedFigure === value.uuid;
    const [expanded, setExpanded] = useState<boolean>(selected);
    const [locationsShown, setLocationsShown] = useState<boolean | undefined>(
        reviewMode
        || (selected && !!defaultShownField),
    );

    const jumpToElement = selected && !defaultShownField;

    const fieldStatusMapping = useMemo(
        () => listToMap(
            fieldStatuses,
            (item) => item.field,
            (item) => item.commentType,
        ),
        [fieldStatuses],
    );

    const [
        shouldShowAddOrganizationModal,
        editableOrganizationId,
        showAddOrganizationModal,
        hideAddOrganizationModal,
    ] = useModalState();
    const [eventDetailsShown, , , , toggleEventDetailsShown] = useModalState(false);
    const [
        shouldShowEventModal,
        eventModalId,
        showEventModal,
        hideEventModal,
    ] = useModalState();

    useEffect(() => {
        if (jumpToElement) {
            elementRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [jumpToElement]);

    const year = useMemo(
        () => (startDate?.match(/^\d+/)?.[0]),
        [startDate],
    );

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

    const [
        approveFigure,
        { loading: approvingFigure },
    ] = useMutation<ApproveFigureMutation, ApproveFigureMutationVariables>(
        APPROVE_FIGURE,
        {
            onCompleted: (response) => {
                const { approveFigure: approveResponse } = response;
                if (!approveResponse) {
                    return;
                }
                const { errors, result } = approveResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    setEvents([result.event]);
                    notify({
                        children: 'Figure approved successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (err) => {
                notify({
                    children: err.message,
                    variant: 'error',
                });
            },
        },
    );

    const [
        unApproveFigure,
        { loading: unApprovingFigure },
    ] = useMutation<UnApproveFigureMutation, UnApproveFigureMutationVariables>(
        UN_APPROVE_FIGURE,
        {
            onCompleted: (response) => {
                const { unapproveFigure: unApproveResponse } = response;
                if (!unApproveResponse) {
                    return;
                }
                const { errors, result } = unApproveResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    setEvents([result.event]);
                    notify({
                        children: 'Figure unapproved successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (err) => {
                notify({
                    children: err.message,
                    variant: 'error',
                });
            },
        },
    );

    const [
        reRequestReviewFigure,
        { loading: reRequestingReviewFigure },
    ] = useMutation<ReReviewFigureMutation, ReReviewFigureMutationVariables>(
        RE_REQUEST_REVIEW_FIGURE,
        {
            onCompleted: (response) => {
                const { reRequestReviewFigure: reRequestReviewResponse } = response;
                if (!reRequestReviewResponse) {
                    return;
                }
                const { errors, result } = reRequestReviewResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    setEvents([result.event]);
                    notify({
                        children: 'Figure re-request review successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (err) => {
                notify({
                    children: err.message,
                    variant: 'error',
                });
            },
        },
    );

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

    const households = useMemo(
        () => [householdData?.householdSize].filter(isDefined),
        [householdData],
    );

    const onValueChange = useFormObject(index, onChange, defaultValue);

    const [organizations] = useOptions('organization');

    const selectedSources = useMemo(
        () => {
            const mapping = listToMap(
                organizations ?? [],
                (item) => item.id,
                (item) => item,
            );
            return value.sources?.map((item) => mapping[item]).filter(isDefined);
        },
        [organizations, value.sources],
    );

    const selectedEvent = useMemo(
        () => events?.find((item) => item.id === value.event),
        [events, value.event],
    );

    const eventAssignee = useMemo(
        () => selectedEvent?.assignee?.id,
        [selectedEvent],
    );
    const isUserAssignee = eventAssignee === user?.id;

    const { id: figureId, event: eventId } = value;

    const isFigureToReview = useMemo(
        () => (
            (selectedEvent && selectedEvent.includeTriangulationInQa)
            || isRecommended
        ),
        [selectedEvent, isRecommended],
    );

    const currentCountry = useMemo(
        () => selectedEvent?.countries.find((item) => item.id === value.country),
        [selectedEvent, value.country],
    );

    const currentCategory = value.category as (FigureCategoryTypes | undefined);
    const currentTerm = value.term as (FigureTerms | undefined);

    const totalValue = useMemo(
        () => {
            if (value.unit !== household) {
                return value.reported;
            }
            return calculateHouseHoldSize(
                value.reported,
                value.householdSize,
            );
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
            const sortedLocations = [...(value.geoLocations ?? [])].sort((a, b) => {
                const order: {
                    [key in Identifier]: number
                } = {
                    ORIGIN: 3,
                    ORIGIN_AND_DESTINATION: 2,
                    DESTINATION: 1,
                };
                return (
                    (isDefined(b.identifier) ? order[b.identifier] : 0)
                    - (isDefined(a.identifier) ? order[a.identifier] : 0)
                );
            });
            const locationsText = unique(
                // FIXME: get admin 1 for locations
                sortedLocations.map((loc) => loc.name),
            ).join(', ');

            const totalFigure = value.unit === household
                ? calculateHouseHoldSize(value.reported, value.householdSize)
                : value.reported;

            let mainTrigger: string | undefined;
            if (isDefined(value.figureCause)) {
                if (value.figureCause === conflict && isDefined(value.violenceSubType)) {
                    mainTrigger = violenceSubTypeOptions
                        ?.find((item) => item.id === value.violenceSubType)
                        ?.name;
                } else if (value.figureCause === disaster && isDefined(value.disasterSubType)) {
                    mainTrigger = disasterSubTypeOptions
                        ?.find((item) => item.id === value.disasterSubType)
                        ?.name;
                } else if (value.figureCause === other && isDefined(value.otherSubType)) {
                    mainTrigger = otherSubTypeOptions?.results
                        ?.find((item) => item.id === value.otherSubType)
                        ?.name;
                }
            }

            const startDateFormatted = formatDateYmd(value.startDate);

            const figureType = value.category as (FigureCategoryTypes | undefined);
            let figureTypeText: string | undefined;
            if (figureType === 'NEW_DISPLACEMENT') {
                figureTypeText = 'ND';
            } else if (figureType === 'IDPS') {
                figureTypeText = 'IDPs';
            } else if (figureType) {
                figureTypeText = 'Other';
            }

            const figureRole = value.role as (Role | undefined);
            let figureRoleText: string | undefined;
            if (figureRole === 'RECOMMENDED') {
                figureRoleText = 'RF';
            } else if (figureRole === 'TRIANGULATION') {
                figureRoleText = 'TF';
            }

            const figureCause = causeOptions
                ?.find((causeOption) => causeOption.name === value.figureCause)
                ?.description;

            const figureTerm = value.term as (FigureTerms | undefined);
            const isTermDestroyedHousing = figureTerm === 'DESTROYED_HOUSING';

            return generateFigureTitle(
                locationsText,
                currentCountry?.idmcShortName,
                totalFigure,
                figureTypeText,
                figureRoleText,
                figureCause,
                mainTrigger,
                startDateFormatted,

                value.includeIdu,
                value.isHousingDestruction,
                isTermDestroyedHousing,
            );
        },
        [
            value,
            violenceSubTypeOptions,
            disasterSubTypeOptions,
            otherSubTypeOptions?.results,
            causeOptions,
            currentCountry,
        ],
    );

    const errored = analyzeErrors(error);

    const geospatialErrored = useMemo(
        () => {
            const countryError = error?.fields?.country;
            const geoLocationsError = error?.fields?.geoLocations;
            return analyzeErrors(countryError) || analyzeErrors(geoLocationsError);
        },
        [error],
    );

    const diff = useMemo(
        () => (
            isDefined(totalValue) && isDefined(totalDisaggregatedValue)
                ? totalValue - totalDisaggregatedValue
                : 0
        ),
        [totalDisaggregatedValue, totalValue],
    );

    const methodology = useMemo(
        () => (
            selectedSources
                ?.map((item) => item.methodology)
                .filter(isTruthyString)
                .join('\n\n')
        ),
        [selectedSources],
    );

    const reliability = useMemo(
        () => {
            const sourcesReliabilities = selectedSources?.map(
                (item) => item.organizationKind?.reliability,
            ) ?? [];
            const low = (
                (sourcesReliabilities.includes('LOW') && 'LOW')
                || (sourcesReliabilities.includes('MEDIUM') && 'MEDIUM')
                || (sourcesReliabilities.includes('HIGH') && 'HIGH')
                || undefined
            );
            const high = (
                (sourcesReliabilities.includes('HIGH') && 'HIGH')
                || (sourcesReliabilities.includes('MEDIUM') && 'MEDIUM')
                || (sourcesReliabilities.includes('LOW') && 'LOW')
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
    const handleCountryChange = useCallback(
        (countryValue: string | undefined, countryName: 'country') => {
            setLocationsShown(true);
            onValueChange(countryValue, countryName);
        },
        [onValueChange],
    );

    const handleAgeAdd = useCallback(() => {
        const uuid = uuidv4();
        const unspecifiedGender: GenderType = 'UNSPECIFIED';
        const newAge: PartialForm<AgeFormProps> = {
            uuid,
            sex: unspecifiedGender,
        };
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
        setViolenceContextOptions(safeOption.contextOfViolence);
    }, [
        onChange,
        index,
        setViolenceContextOptions,
    ]);

    const handleEventCreate = useCallback(
        (newEvent: EventListOption) => {
            setEvents([newEvent]);
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

    const handleExpansionChange = useCallback((val: boolean, key: string) => {
        setExpanded(val);
        setSelectedFigure((oldValue) => (
            oldValue === key ? undefined : key
        ));
    }, [setSelectedFigure]);

    const handleIduGenerate = useCallback(() => {
        const sortedLocations = [...(value.geoLocations ?? [])].sort((a, b) => {
            if (a.identifier === 'ORIGIN' && b.identifier === 'DESTINATION') {
                return -1;
            }

            if (a.identifier === 'DESTINATION' && b.identifier === 'ORIGIN') {
                return 1;
            }

            return 0;
        });
        const locationsText = unique(
            // FIXME: get admin 1 for locations
            sortedLocations.map((loc) => loc.name),
        ).join(', ');

        const totalFigure = value.reported;

        let mainTrigger: string | undefined;
        if (isDefined(value.figureCause)) {
            if (value.figureCause === conflict && isDefined(value.violenceSubType)) {
                mainTrigger = violenceSubTypeOptions
                    ?.find((item) => item.id === value.violenceSubType)
                    ?.name;
            } else if (value.figureCause === disaster && isDefined(value.disasterSubType)) {
                mainTrigger = disasterSubTypeOptions
                    ?.find((item) => item.id === value.disasterSubType)
                    ?.name;
            } else if (value.figureCause === other && isDefined(value.otherSubType)) {
                mainTrigger = otherSubTypeOptions?.results
                    ?.find((item) => item.id === value.otherSubType)
                    ?.name;
            }
        }

        const startDateFormatted = formatDate(value.startDate);

        const quantifierValue = value.quantifier as (Quantifier | undefined);
        // NOTE: we have an exception to quanitifier text
        const quantifierText = quantifierValue === 'EXACT'
            ? 'a total of'
            : quantifierOptions
                ?.find((q) => q.name === quantifierValue)
                ?.description;

        const termValue = value.term as (FigureTerms | undefined);
        const termText = termValue === 'DESTROYED_HOUSING'
            ? 'displaced due to destroyed housing'
            : termOptions
                ?.find((term) => term.name === value.term)
                ?.description;

        let unitText: string | undefined;
        if (isDefined(value.reported)) {
            if (value.unit === person) {
                unitText = value.reported === 1 ? 'person' : 'people';
            } else if (value.unit === household) {
                unitText = value.reported === 1 ? 'household' : 'households';
            }
        }

        const sourceTypes = unique(
            selectedSources
                ?.map((item) => {
                    const { organizationKind, name } = item;
                    // FIXME: we need to add a boolean on server to
                    // indicate that organization name should be used
                    if (
                        !organizationKind
                        || organizationKind.name === 'United Nations'
                        || organizationKind.name === 'International Organisations'
                    ) {
                        // NOTE: Let's not lowercase organization names
                        return name;
                    }
                    if (organizationKind.name === 'National/Regional Disaster Authority') {
                        return 'national/regional disaster authorities';
                    }
                    return organizationKind.name.toLowerCase();
                }) ?? [],
            (organizationKind) => organizationKind,
        ).join(', ');

        const excerptIduText = generateIduText(
            mainTrigger?.toLowerCase(),
            quantifierText?.toLowerCase(),
            totalFigure,
            unitText,
            termText?.toLowerCase(),
            locationsText,
            startDateFormatted,
            sourceTypes,
        );
        onValueChange(excerptIduText, 'excerptIdu' as const);
    }, [
        onValueChange,
        value.unit,
        value.term,
        value.figureCause,
        value.reported,
        value.quantifier,
        value.geoLocations,
        value.startDate,
        termOptions,
        quantifierOptions,
        selectedSources,
        violenceSubTypeOptions,
        disasterSubTypeOptions,
        otherSubTypeOptions?.results,
        value.disasterSubType,
        value.otherSubType,
        value.violenceSubType,
    ]);

    const handleStartDateChange = useCallback((val: string | undefined) => {
        onValueChange(val, 'startDate');
        if (val && !value.endDate) {
            onValueChange(val, 'endDate');
        }
    }, [onValueChange, value.endDate]);

    const handleClearForm = useCallback((name: number) => {
        onChange((prevVal) => {
            if (!prevVal) {
                return defaultValue;
            }
            const dayAccuracy: DateAccuracy = 'DAY';
            const unknownDisplacement: DisplacementOccurred = 'UNKNOWN';
            return {
                uuid: prevVal.uuid,
                id: prevVal.id,

                includeIdu: false,
                isDisaggregated: false,
                isHousingDestruction: false,
                startDateAccuracy: dayAccuracy,
                endDateAccuracy: dayAccuracy,
                displacementOccurred: unknownDisplacement,
            };
        }, name);
    }, [onChange]);

    const handleFigureCloneClick = useCallback(() => {
        if (onFigureClone) {
            onFigureClone(value);
        }
    }, [onFigureClone, value]);

    const handleFigureApprove = useCallback(
        (id: string) => {
            approveFigure({
                variables: {
                    id,
                },
            });
        },
        [approveFigure],
    );
    const handleFigureUnApprove = useCallback(
        (id: string) => {
            unApproveFigure({
                variables: {
                    id,
                },
            });
        },
        [unApproveFigure],
    );
    const handleFigureReRequestReview = useCallback(
        (id: string) => {
            reRequestReviewFigure({
                variables: {
                    id,
                },
            });
        },
        [reRequestReviewFigure],
    );

    const figurePermission = user?.permissions?.figure;

    const sectionActions = (
        <>
            {editMode && (
                <>
                    <Button
                        name={undefined}
                        onClick={handleFigureCloneClick}
                        disabled={disabled}
                    >
                        Clone
                    </Button>
                    <ConfirmButton
                        name={index}
                        onConfirm={handleClearForm}
                        disabled={disabled}
                    >
                        Clear
                    </ConfirmButton>
                    <ConfirmButton
                        name={index}
                        onConfirm={onRemove}
                        disabled={disabled}
                    >
                        Remove
                    </ConfirmButton>
                </>
            )}
            {figureId && reviewMode && (
                <>
                    {value.entry && (
                        <ButtonLikeLink
                            route={route.entryEdit}
                            attrs={{ entryId: value.entry }}
                            hash="/figures-and-analysis"
                            search={`id=${figureId}`}
                        >
                            Edit
                        </ButtonLikeLink>
                    )}
                    {isFigureToReview && isUserAssignee && figurePermission?.approve && (
                        reviewStatus === 'APPROVED' ? (
                            <Button
                                name={figureId}
                                variant="primary"
                                onClick={handleFigureUnApprove}
                                disabled={disabled || unApprovingFigure}
                            >
                                Unapprove
                            </Button>
                        ) : (
                            <Button
                                name={figureId}
                                variant="primary"
                                onClick={handleFigureApprove}
                                disabled={disabled || approvingFigure}
                            >
                                Approve
                            </Button>
                        )
                    )}
                    {(
                        isFigureToReview
                        && (
                            figurePermission?.change
                            || figurePermission?.add
                            || figurePermission?.delete
                            || figurePermission?.approve
                        )
                        && reviewStatus === 'REVIEW_IN_PROGRESS'
                        && eventAssignee
                        && !isUserAssignee
                    ) && (
                        <Button
                            name={figureId}
                            variant="primary"
                            onClick={handleFigureReRequestReview}
                            disabled={disabled || reRequestingReviewFigure}
                        >
                            Re-request Review
                        </Button>
                    )}
                </>
            )}
        </>
    );

    return (
        <CollapsibleContent
            elementRef={elementRef}
            name={value.uuid}
            header={generatedFigureName}
            headerClassName={_cs(errored && styles.errored)}
            onExpansionChange={handleExpansionChange}
            isExpanded={expanded}
            icons={(
                <Status
                    status={reviewStatus}
                />
            )}
            actions={value.stale && (
                <Chip>
                    Unsaved
                </Chip>
            )}
            contentClassName={styles.content}
        >
            {selectedEvent?.reviewStatus === 'APPROVED_BUT_CHANGED' && (
                <div className={styles.info}>
                    The event previously was approved!
                </div>
            )}
            {selectedEvent?.reviewStatus === 'SIGNED_OFF_BUT_CHANGED' && (
                <div className={styles.info}>
                    The event previously was signed off!
                </div>
            )}
            {selectedEvent?.reviewStatus === 'APPROVED' && (
                <div className={styles.info}>
                    The event has already been approved!
                </div>
            )}
            {selectedEvent?.reviewStatus === 'SIGNED_OFF' && (
                <div className={styles.info}>
                    The event has already been signed off!
                </div>
            )}
            {figureId && !isFigureToReview && (
                <div className={styles.info}>
                    The figure does not need to be QA&apos;ed.
                </div>
            )}
            <Section
                heading={undefined}
                contentClassName={styles.sectionContent}
                subSection
                actions={sectionActions}
            >
                <NonFieldError>
                    {error?.$internal}
                </NonFieldError>
                <Row>
                    <EventListSelectInput
                        options={events}
                        onOptionsChange={setEvents}
                        error={error?.fields?.event}
                        label="Event *"
                        name="event"
                        value={value.event}
                        onChange={handleEventChange}
                        disabled={disabled || figureOptionsDisabled}
                        readOnly={!editMode || !!value.country}
                        actions={(
                            <>
                                {value.event && (
                                    <ButtonLikeLink
                                        route={route.event}
                                        attrs={{ eventId: value.event }}
                                        transparent
                                        compact
                                        title="Open Event"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <IoOpenOutline />
                                    </ButtonLikeLink>
                                )}
                                <Button
                                    onClick={toggleEventDetailsShown}
                                    name={undefined}
                                    transparent
                                    compact
                                    title={eventDetailsShown ? 'Hide Event Details' : 'Show Event Details'}
                                >
                                    {eventDetailsShown ? <IoEyeOffOutline /> : <IoEyeOutline />}
                                </Button>
                                {(
                                    user?.permissions?.event?.add
                                    && editMode
                                    && !value.country
                                ) && (
                                    <Button
                                        name={undefined}
                                        onClick={showEventModal}
                                        disabled={disabled}
                                        compact
                                        transparent
                                        title="Add Event"
                                    >
                                        <IoAddOutline />
                                    </Button>
                                )}
                            </>
                        )}
                        nonClearable
                    />
                </Row>
                {shouldShowEventModal && (
                    <Modal
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
                    <Section
                        heading="Event"
                        subSection
                        bordered
                    >
                        <EventForm
                            id={value.event}
                            disabled={disabled}
                            readOnly
                            eventHiddenWhileReadonly
                        />
                    </Section>
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
                                icons={trafficLightShown && figureId && eventId && (
                                    <TrafficLightInput
                                        name="FIGURE_MAIN_TRIGGER_OF_REPORTED_FIGURE"
                                        figureId={figureId}
                                        eventId={eventId}
                                        // eslint-disable-next-line max-len
                                        value={fieldStatusMapping?.FIGURE_MAIN_TRIGGER_OF_REPORTED_FIGURE}
                                        assigneeMode={isUserAssignee}
                                        reviewDisabled={!isFigureToReview}
                                        defaultShown={defaultShownField === 'FIGURE_MAIN_TRIGGER_OF_REPORTED_FIGURE'}
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
                            />
                            <ViolenceContextMultiSelectInput
                                label="Context of Violence"
                                name="contextOfViolence"
                                value={value.contextOfViolence}
                                onChange={onValueChange}
                                error={error?.fields?.contextOfViolence?.$internal}
                                readOnly={!editMode}
                                disabled={disabled || figureOptionsDisabled || eventNotChosen}
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
                            icons={trafficLightShown && figureId && eventId && (
                                <TrafficLightInput
                                    name="FIGURE_MAIN_TRIGGER_OF_REPORTED_FIGURE"
                                    figureId={figureId}
                                    eventId={eventId}
                                    // eslint-disable-next-line max-len
                                    value={fieldStatusMapping?.FIGURE_MAIN_TRIGGER_OF_REPORTED_FIGURE}
                                    assigneeMode={isUserAssignee}
                                    reviewDisabled={!isFigureToReview}
                                    defaultShown={defaultShownField === 'FIGURE_MAIN_TRIGGER_OF_REPORTED_FIGURE'}
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
                            icons={trafficLightShown && figureId && eventId && (
                                <TrafficLightInput
                                    name="FIGURE_MAIN_TRIGGER_OF_REPORTED_FIGURE"
                                    figureId={figureId}
                                    eventId={eventId}
                                    // eslint-disable-next-line max-len
                                    value={fieldStatusMapping?.FIGURE_MAIN_TRIGGER_OF_REPORTED_FIGURE}
                                    assigneeMode={isUserAssignee}
                                    reviewDisabled={!isFigureToReview}
                                    defaultShown={defaultShownField === 'FIGURE_MAIN_TRIGGER_OF_REPORTED_FIGURE'}
                                />
                            )}
                        />
                    )}
                </Row>
                <Section
                    contentClassName={styles.block}
                    subSection
                    bordered
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
                        icons={trafficLightShown && figureId && eventId && (
                            <TrafficLightInput
                                name="FIGURE_COUNTRY"
                                figureId={figureId}
                                eventId={eventId}
                                value={fieldStatusMapping?.FIGURE_COUNTRY}
                                assigneeMode={isUserAssignee}
                                reviewDisabled={!isFigureToReview}
                                defaultShown={defaultShownField === 'FIGURE_COUNTRY'}
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
                            {value.geoLocations?.map((geoLocation, i) => (
                                <GeoLocationInput
                                    key={geoLocation.uuid}
                                    index={i}
                                    value={geoLocation}
                                    onChange={onGeoLocationChange}
                                    onRemove={onGeoLocationRemove}
                                    error={error?.fields?.geoLocations?.members?.[geoLocation.uuid]}
                                    disabled={disabled || eventNotChosen}
                                    mode={mode}
                                    figureId={figureId}
                                    eventId={eventId}
                                    accuracyOptions={accuracyOptions}
                                    identifierOptions={identifierOptions}
                                    trafficLightShown={trafficLightShown}
                                    assigneeMode={isUserAssignee}
                                    reviewDisabled={!isFigureToReview}
                                    fieldStatusMapping={fieldStatusMapping}
                                    defaultShownField={defaultShownField}
                                />
                            ))}
                        </div>
                    )}
                </Section>
                <Row>
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
                        icons={trafficLightShown && figureId && eventId && (
                            <TrafficLightInput
                                name="FIGURE_CATEGORY"
                                figureId={figureId}
                                eventId={eventId}
                                value={fieldStatusMapping?.FIGURE_CATEGORY}
                                assigneeMode={isUserAssignee}
                                reviewDisabled={!isFigureToReview}
                                defaultShown={defaultShownField === 'FIGURE_CATEGORY'}
                            />
                        )}
                        grouped
                        groupKeySelector={figureCategoryGroupKeySelector}
                        groupLabelSelector={figureCategoryGroupLabelSelector}
                        hideOptionFilter={figureCategoryHideOptionFilter}
                    />
                    <DateInput
                        label={isStockCategory(currentCategory) ? 'Stock Date *' : 'Start Date *'}
                        name="startDate"
                        value={value.startDate}
                        onChange={handleStartDateChange}
                        disabled={disabled || eventNotChosen}
                        error={error?.fields?.startDate}
                        readOnly={!editMode}
                        icons={trafficLightShown && figureId && eventId && (
                            <TrafficLightInput
                                name={isStockCategory(currentCategory) ? 'FIGURE_STOCK_DATE' : 'FIGURE_START_DATE'}
                                figureId={figureId}
                                eventId={eventId}
                                value={isStockCategory(currentCategory)
                                    ? fieldStatusMapping?.FIGURE_STOCK_DATE
                                    : fieldStatusMapping?.FIGURE_START_DATE}
                                assigneeMode={isUserAssignee}
                                reviewDisabled={!isFigureToReview}
                                defaultShown={isStockCategory(currentCategory)
                                    ? defaultShownField === 'FIGURE_STOCK_DATE'
                                    : defaultShownField === 'FIGURE_START_DATE'}
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
                    />
                    <DateInput
                        label={isStockCategory(currentCategory) ? 'Stock Reporting Date *' : 'End Date *'}
                        name="endDate"
                        value={value.endDate}
                        onChange={onValueChange}
                        disabled={disabled || eventNotChosen}
                        error={error?.fields?.endDate}
                        readOnly={!editMode}
                        icons={trafficLightShown && figureId && eventId && (
                            <TrafficLightInput
                                name={isStockCategory(currentCategory) ? 'FIGURE_STOCK_REPORTING_DATE' : 'FIGURE_END_DATE'}
                                figureId={figureId}
                                eventId={eventId}
                                value={isStockCategory(currentCategory)
                                    ? fieldStatusMapping?.FIGURE_STOCK_REPORTING_DATE
                                    : fieldStatusMapping?.FIGURE_END_DATE}
                                assigneeMode={isUserAssignee}
                                reviewDisabled={!isFigureToReview}
                                defaultShown={isStockCategory(currentCategory)
                                    ? defaultShownField === 'FIGURE_STOCK_REPORTING_DATE'
                                    : defaultShownField === 'FIGURE_END_DATE'}
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
                        />
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
                        icons={trafficLightShown && figureId && eventId && (
                            <TrafficLightInput
                                name="FIGURE_TERM"
                                figureId={figureId}
                                eventId={eventId}
                                value={fieldStatusMapping?.FIGURE_TERM}
                                assigneeMode={isUserAssignee}
                                reviewDisabled={!isFigureToReview}
                                defaultShown={defaultShownField === 'FIGURE_TERM'}
                            />
                        )}
                    />
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
                    />
                    <NumberInput
                        label="Reported Figure *"
                        name="reported"
                        value={value.reported}
                        onChange={onValueChange}
                        error={error?.fields?.reported}
                        disabled={disabled || eventNotChosen}
                        readOnly={!editMode}
                        icons={trafficLightShown && figureId && eventId && (
                            <TrafficLightInput
                                name="FIGURE_REPORTED_FIGURE"
                                figureId={figureId}
                                eventId={eventId}
                                value={fieldStatusMapping?.FIGURE_REPORTED_FIGURE}
                                assigneeMode={isUserAssignee}
                                reviewDisabled={!isFigureToReview}
                                defaultShown={defaultShownField === 'FIGURE_REPORTED_FIGURE'}
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
                        icons={trafficLightShown && figureId && eventId && (
                            <TrafficLightInput
                                name="FIGURE_UNIT"
                                figureId={figureId}
                                eventId={eventId}
                                value={fieldStatusMapping?.FIGURE_UNIT}
                                assigneeMode={isUserAssignee}
                                reviewDisabled={!isFigureToReview}
                                defaultShown={defaultShownField === 'FIGURE_UNIT'}
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
                                value={calculateHouseHoldSize(
                                    value.reported,
                                    value.householdSize,
                                )}
                                disabled={disabled || eventNotChosen}
                                readOnly
                            />
                        </>
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
                        disabled={disabled || figureOptionsDisabled || eventNotChosen}
                        readOnly={!editMode}
                        icons={trafficLightShown && figureId && eventId && (
                            <TrafficLightInput
                                name="FIGURE_ROLE"
                                figureId={figureId}
                                eventId={eventId}
                                value={fieldStatusMapping?.FIGURE_ROLE}
                                assigneeMode={isUserAssignee}
                                reviewDisabled={!isFigureToReview}
                                defaultShown={defaultShownField === 'FIGURE_ROLE'}
                            />
                        )}
                    />
                </Row>
                <Row>
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
                            disabled={disabled || figureOptionsDisabled || eventNotChosen}
                            readOnly={!editMode}
                            icons={trafficLightShown && figureId && eventId && (
                                <TrafficLightInput
                                    name="FIGURE_DISPLACEMENT_OCCURRED"
                                    figureId={figureId}
                                    eventId={eventId}
                                    value={fieldStatusMapping?.FIGURE_DISPLACEMENT_OCCURRED}
                                    assigneeMode={isUserAssignee}
                                    reviewDisabled={!isFigureToReview}
                                    defaultShown={defaultShownField === 'FIGURE_DISPLACEMENT_OCCURRED'}
                                />
                            )}
                        />
                    )}
                    {isHousingTerm(currentTerm) && (
                        <Switch
                            label="Housing destruction (recommended estimate for this entry)"
                            name="isHousingDestruction"
                            value={value.isHousingDestruction}
                            onChange={onValueChange}
                            error={error?.fields?.isHousingDestruction}
                            disabled={disabled || eventNotChosen}
                            readOnly={!editMode}
                        />
                    )}
                    <FigureTagMultiSelectInput
                        name="tags"
                        label="Tags"
                        onChange={onValueChange}
                        value={value.tags}
                        error={error?.fields?.tags?.$internal}
                        disabled={disabled || figureOptionsDisabled || eventNotChosen}
                        readOnly={!editMode}
                    />
                </Row>
                <Row>
                    <OrganizationMultiSelectInput
                        label="Sources *"
                        onChange={onValueChange}
                        value={value.sources}
                        name="sources"
                        error={error?.fields?.sources?.$internal}
                        disabled={disabled || figureOptionsDisabled || eventNotChosen}
                        country={value.country}
                        readOnly={!editMode}
                        icons={trafficLightShown && figureId && eventId && (
                            <TrafficLightInput
                                className={styles.trafficLight}
                                name="FIGURE_SOURCES"
                                figureId={figureId}
                                eventId={eventId}
                                value={fieldStatusMapping?.FIGURE_SOURCES}
                                assigneeMode={isUserAssignee}
                                reviewDisabled={!isFigureToReview}
                                defaultShown={defaultShownField === 'FIGURE_SOURCES'}
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
                        disabled={disabled || eventNotChosen}
                        readOnly
                    />
                </Row>
                <MarkdownEditor
                    label="Source Methodology"
                    value={methodology}
                    name="sourceMethodology"
                    disabled={disabled || eventNotChosen}
                    readOnly
                />
                <MarkdownEditor
                    name="calculationLogic"
                    label="Analysis, Caveats and Calculation Logic *"
                    onChange={onValueChange}
                    value={value.calculationLogic}
                    error={error?.fields?.calculationLogic}
                    disabled={disabled || eventNotChosen}
                    readOnly={!editMode}
                    icons={trafficLightShown && figureId && eventId && (
                        <TrafficLightInput
                            name="FIGURE_ANALYSIS_CAVEATS_AND_CALCULATION_LOGIC"
                            figureId={figureId}
                            eventId={eventId}
                            // eslint-disable-next-line max-len
                            value={fieldStatusMapping?.FIGURE_ANALYSIS_CAVEATS_AND_CALCULATION_LOGIC}
                            assigneeMode={isUserAssignee}
                            reviewDisabled={!isFigureToReview}
                            defaultShown={defaultShownField === 'FIGURE_ANALYSIS_CAVEATS_AND_CALCULATION_LOGIC'}
                        />
                    )}
                />
                <Row>
                    <Switch
                        label="Disaggregated Data"
                        name="isDisaggregated"
                        value={value.isDisaggregated}
                        onChange={onValueChange}
                        error={error?.fields?.isDisaggregated}
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
                            />
                            <NumberInput
                                label="Rural displacement"
                                name="disaggregationDisplacementRural"
                                value={value.disaggregationDisplacementRural}
                                onChange={onValueChange}
                                error={error?.fields?.disaggregationDisplacementRural}
                                disabled={disabled || eventNotChosen}
                                readOnly={!editMode}
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
                            />
                            <NumberInput
                                label="Not in Camp"
                                name="disaggregationLocationNonCamp"
                                value={value.disaggregationLocationNonCamp}
                                onChange={onValueChange}
                                error={error?.fields?.disaggregationLocationNonCamp}
                                disabled={disabled || eventNotChosen}
                                readOnly={!editMode}
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
                            />
                            <NumberInput
                                label="Indigenous People"
                                name="disaggregationIndigenousPeople"
                                value={value.disaggregationIndigenousPeople}
                                onChange={onValueChange}
                                error={error?.fields?.disaggregationIndigenousPeople}
                                disabled={disabled || eventNotChosen}
                                readOnly={!editMode}
                            />
                        </Row>
                        <Section
                            contentClassName={styles.block}
                            subSection
                            bordered
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
                            {value.disaggregationAge?.length === 0 ? (
                                <Message
                                    message="No disaggregation by age & gender found."
                                />
                            ) : value.disaggregationAge?.map((age, i) => (
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
                                />
                            ))}
                        </Section>
                    </>
                )}
                <MarkdownEditor
                    label="Source Excerpt"
                    onChange={onValueChange}
                    value={value.sourceExcerpt}
                    name="sourceExcerpt"
                    error={error?.fields?.sourceExcerpt}
                    disabled={disabled || eventNotChosen}
                    readOnly={!editMode}
                    icons={trafficLightShown && figureId && eventId && (
                        <TrafficLightInput
                            name="FIGURE_SOURCE_EXCERPT"
                            figureId={figureId}
                            eventId={eventId}
                            value={fieldStatusMapping?.FIGURE_SOURCE_EXCERPT}
                            assigneeMode={isUserAssignee}
                            reviewDisabled={!isFigureToReview}
                            defaultShown={defaultShownField === 'FIGURE_SOURCE_EXCERPT'}
                        />
                    )}
                />
                <Switch
                    label="Include in IDU"
                    name="includeIdu"
                    value={value.includeIdu}
                    onChange={onValueChange}
                    disabled={disabled || eventNotChosen}
                    error={error?.fields?.includeIdu}
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
                        // hint={generateIduText()}
                        actions={editMode && (
                            <Button
                                name={undefined}
                                onClick={handleIduGenerate}
                                transparent
                                title="Generate excerpt for IDU"
                                disabled={disabled}
                            >
                                <IoCalculatorOutline />
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
