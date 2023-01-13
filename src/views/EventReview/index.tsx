import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';
import { removeNull } from '@togglecorp/toggle-form';
import {
    isDefined,
    unique,
    _cs,
} from '@togglecorp/fujs';
import { Button, Pager } from '@togglecorp/toggle-ui';

import ButtonLikeLink from '#components/ButtonLikeLink';
import Container from '#components/Container';
import {
    FIGURE_LIST,
    FIGURE_OPTIONS,
} from '#components/forms/EntryForm/queries';
import Status from '#components/tableHelpers/Status';
import {
    FigureListQuery,
    FigureListQueryVariables,
    FigureOptionsForEntryFormQuery,
    GetEventForReviewQuery,
    GetEventForReviewQueryVariables,
    SignOffEventMutation,
    SignOffEventMutationVariables,
} from '#generated/types';
import {
    AccuracyOptions,
    DateAccuracyOptions,
    DisplacementOptions,
    UnitOptions,
    TermOptions,
    RoleOptions,
    GenderOptions,
    IdentifierOptions,
    QuantifierOptions,
    CauseOptions,
    CategoryOptions,
} from '#components/forms/EntryForm/types';
import EventForm from '#components/forms/EventForm';
import PageHeader from '#components/PageHeader';
import { EventListOption } from '#components/selections/EventListSelectInput';
import { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';
import { ViolenceContextOption } from '#components/selections/ViolenceContextMultiSelectInput';
import { OrganizationOption } from '#components/selections/OrganizationSelectInput';
import Preview from '#components/Preview';
import FigureInput from '#components/forms/EntryForm/FigureInput';
import NotificationContext from '#components/NotificationContext';
import DomainContext from '#components/DomainContext';
import useDebouncedValue from '#hooks/useDebouncedValue';
import route from '#config/routes';

import styles from './styles.css';

const SIGN_OFF_EVENT = gql`
    mutation SignOffEvent($id: ID!) {
        signOffEvent(eventId: $id) {
            result {
                id
                reviewStatus
                reviewStatusDisplay
            }
            ok
            errors
        }
    }
`;

const GET_EVENT = gql`
    query GetEventForReview($id: ID!) {
        event(id: $id) {
            id
            name
            reviewStatus
            reviewStatusDisplay
        }
    }
`;

const mode = 'view';
const trafficLightShown = mode === 'view';

function transform(figures: NonNullable<FigureListQuery['figureList']>['results']) {
    const transformedFigures = figures?.map((figure) => ({
        ...figure,
        event: figure.event?.id,
        country: figure.country?.id,
        geoLocations: figure.geoLocations?.results,
        tags: figure.tags?.map((tag) => tag.id),
        sources: figure.sources?.results?.map((item) => item.id),
        disaggregationAge: figure.disaggregationAge?.results,
        disasterSubType: figure.disasterSubType?.id,
        violenceSubType: figure.violenceSubType?.id,
        osvSubType: figure.osvSubType?.id,
        otherSubType: figure.otherSubType?.id,
        contextOfViolence: figure.contextOfViolence?.map((c) => c.id),

        eventReviewStatus: figure.event.reviewStatus,
    })) ?? [];
    return removeNull(transformedFigures);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noOp() {
}

interface Props {
    className: string;
}

function EventReview(props: Props) {
    const { user } = useContext(DomainContext);
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
    const {
        data: figureOptionsData,
        loading: figureOptionsLoading,
        error: figureOptionsError,
    } = useQuery<FigureOptionsForEntryFormQuery>(FIGURE_OPTIONS);

    const eventPermission = user?.permissions?.event;
    const { className } = props;
    const { eventId } = useParams<{ eventId: string }>();
    const [selectedFigure, setSelectedFigure] = useState<string | undefined>();

    const [
        events,
        setEvents,
    ] = useState<EventListOption[] | null | undefined>([]);
    const [
        tagOptions,
        setTagOptions,
    ] = useState<FigureTagOption[] | undefined | null>();
    const [
        violenceContextOptions,
        setViolenceContextOptions,
    ] = useState<ViolenceContextOption[] | null | undefined>();
    const [
        organizations,
        setOrganizations,
    ] = useState<OrganizationOption[] | null | undefined>([]);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const debouncedPage = useDebouncedValue(page);

    const figureListVariables = useMemo(
        (): FigureListQueryVariables => ({
            eventId,
            page: debouncedPage,
            pageSize,
        }),
        [
            eventId,
            debouncedPage,
            pageSize,
        ],
    );

    const {
        loading: getFiguresLoading,
        error: eventDataError,
        refetch: refetchEvent,
        previousData: figuresPreviousData,
        data: figureLists = figuresPreviousData,
    } = useQuery<FigureListQuery, FigureListQueryVariables>(FIGURE_LIST, {
        skip: !figureListVariables,
        variables: figureListVariables,
        onCompleted: (response) => {
            const { figureList } = removeNull(response);
            setEvents(figureList?.results?.map((item) => item.event).filter(isDefined));

            setTagOptions(figureList?.results?.flatMap((item) => item.tags).filter(isDefined));

            setViolenceContextOptions(
                figureList?.results?.flatMap((item) => item.contextOfViolence).filter(isDefined),
            );
            const organizationsFromEntry: OrganizationOption[] = [];

            organizationsFromEntry.push(
                ...(figureList?.results
                    ?.flatMap((item) => item.sources?.results)
                    .filter(isDefined) ?? []),
            );

            const uniqueOrganizations = unique(
                organizationsFromEntry,
                (o) => o.id,
            );
            setOrganizations(uniqueOrganizations);
        },
    });

    const eventVariables = useMemo(
        (): GetEventForReviewQueryVariables => ({
            id: eventId,
        }),
        [eventId],
    );
    const {
        loading: eventResponseLoading,
        previousData: eventsPreviousData,
        data: eventResponse = eventsPreviousData,
    } = useQuery<GetEventForReviewQuery, GetEventForReviewQueryVariables>(GET_EVENT, {
        variables: eventVariables,
        skip: !eventVariables,
    });

    const figureValue = useMemo(
        () => transform(figureLists?.figureList?.results),
        [figureLists],
    );

    const [
        signOffEvent,
        { loading: signOffLoading },
    ] = useMutation<SignOffEventMutation, SignOffEventMutationVariables>(
        SIGN_OFF_EVENT,
        {
            onCompleted: (response) => {
                const { signOffEvent: signOffResponse } = response;
                refetchEvent();
                if (!signOffResponse) {
                    return;
                }
                const { errors, result } = signOffResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Signed off successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
            },
        },
    );

    const handleSignOffEvent = useCallback(
        (id: string) => {
            signOffEvent({
                variables: {
                    id,
                },
            });
        },
        [signOffEvent],
    );

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
            setPage(1);
        },
        [],
    );

    const {
        preview,
        attachment,
    } = useMemo(
        () => {
            const selectedFigureEntry = figureValue.find(
                (v) => v.uuid === selectedFigure,
            );
            return {
                preview: selectedFigureEntry?.entry?.preview,
                attachment: selectedFigureEntry?.entry?.document,
            };
        },
        [
            figureValue,
            selectedFigure,
        ],
    );

    const totalFigureItemCount = figureLists?.figureList?.totalCount ?? 0;

    const eventName = eventResponse?.event?.name;
    const eventReviewStatus = eventResponse?.event?.reviewStatus;

    const disableSignOff = eventResponseLoading || signOffLoading;

    if (eventDataError) {
        return (
            <div className={_cs(styles.loadFailed, className)}>
                Failed to retrieve event data!
            </div>
        );
    }

    return (
        <div className={_cs(styles.eventReview, className)}>
            <div className={styles.mainContent}>
                <PageHeader
                    title={eventName ?? 'Event Review'}
                    icons={eventReviewStatus && (
                        <Status
                            className={styles.eventStatus}
                            status={eventReviewStatus}
                        />
                    )}
                    actions={(
                        <>
                            <ButtonLikeLink
                                title="View Entry"
                                route={route.event}
                                attrs={{ eventId }}
                            >
                                View Event
                            </ButtonLikeLink>
                            {eventPermission?.sign_off && eventReviewStatus === 'APPROVED' && (
                                <Button
                                    name={eventId}
                                    onClick={handleSignOffEvent}
                                    disabled={disableSignOff}
                                >
                                    Sign Off
                                </Button>
                            )}
                        </>
                    )}
                />
                <EventForm
                    className={styles.eventForm}
                    id={eventId}
                    readOnly
                    eventHiddenWhileReadonly
                />
                <Container
                    heading="Figures"
                    contentClassName={styles.figures}
                    footerContent={(
                        <Pager
                            activePage={page}
                            itemsCount={totalFigureItemCount}
                            maxItemsPerPage={pageSize}
                            onActivePageChange={setPage}
                            onItemsPerPageChange={handlePageSizeChange}
                        />
                    )}
                >
                    {figureValue?.length === 0 ? (
                        <div>
                            No figures yet
                        </div>
                    ) : figureValue?.map((fig, index) => (
                        <FigureInput
                            key={fig.uuid}
                            selectedFigure={selectedFigure}
                            setSelectedFigure={setSelectedFigure}
                            index={index}
                            value={fig}
                            onChange={noOp}
                            onRemove={noOp}
                            error={undefined}
                            disabled={getFiguresLoading}
                            mode={mode}
                            optionsDisabled={!!figureOptionsError || !!figureOptionsLoading}
                            tagOptions={tagOptions}
                            setTagOptions={setTagOptions}
                            violenceContextOptions={violenceContextOptions}
                            setViolenceContextOptions={setViolenceContextOptions}
                            events={events}
                            setEvents={setEvents}
                            // eslint-disable-next-line max-len
                            causeOptions={figureOptionsData?.crisisType?.enumValues as CauseOptions}
                            // eslint-disable-next-line max-len
                            accuracyOptions={figureOptionsData?.accuracyList?.enumValues as AccuracyOptions}
                            // eslint-disable-next-line max-len
                            categoryOptions={figureOptionsData?.figureCategoryList?.enumValues as CategoryOptions}
                            // eslint-disable-next-line max-len
                            unitOptions={figureOptionsData?.unitList?.enumValues as UnitOptions}
                            // eslint-disable-next-line max-len
                            termOptions={figureOptionsData?.figureTermList?.enumValues as TermOptions}
                            // eslint-disable-next-line max-len
                            roleOptions={figureOptionsData?.roleList?.enumValues as RoleOptions}
                            // eslint-disable-next-line max-len
                            displacementOptions={figureOptionsData?.displacementOccurence?.enumValues as DisplacementOptions}
                            // eslint-disable-next-line max-len
                            identifierOptions={figureOptionsData?.identifierList?.enumValues as IdentifierOptions}
                            // eslint-disable-next-line max-len
                            genderCategoryOptions={figureOptionsData?.disaggregatedGenderList?.enumValues as GenderOptions}
                            // eslint-disable-next-line max-len
                            quantifierOptions={figureOptionsData?.quantifierList?.enumValues as QuantifierOptions}
                            // eslint-disable-next-line max-len
                            dateAccuracyOptions={figureOptionsData?.dateAccuracy?.enumValues as DateAccuracyOptions}
                            // eslint-disable-next-line max-len
                            disasterCategoryOptions={figureOptionsData?.disasterCategoryList}
                            violenceCategoryOptions={figureOptionsData?.violenceList}
                            osvSubTypeOptions={figureOptionsData?.osvSubTypeList}
                            // eslint-disable-next-line max-len
                            otherSubTypeOptions={figureOptionsData?.otherSubTypeList}
                            trafficLightShown={trafficLightShown}
                            organizations={organizations}
                            setOrganizations={setOrganizations}
                            entryId={fig.entry.id}
                            reviewStatus={fig.reviewStatus}
                            fieldStatuses={fig.lastReviewCommentStatus}
                            isRecommended={fig.role === 'RECOMMENDED'}
                        />
                    ))}
                </Container>
            </div>
            <div className={styles.sideContent}>
                <Preview
                    className={styles.stickyContainer}
                    attachment={attachment}
                    preview={preview}
                />
            </div>
        </div>
    );
}

export default EventReview;
