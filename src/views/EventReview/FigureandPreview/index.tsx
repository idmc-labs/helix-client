import React, {
    Dispatch,
    SetStateAction,
} from 'react';
import { useQuery } from '@apollo/client';
import { PartialForm } from '@togglecorp/toggle-form';

import PageHeader from '#components/PageHeader';
import UrlPreview from '#components/UrlPreview';
import { Attachment, FigureFormProps, SourcePreview, TagOptions } from '#views/Entry/EntryForm/types';
import FigureInput from '#views/Entry/EntryForm/FigureInput';
import { EventListOption } from '#components/selections/EventListSelectInput';
import { FigureOptionsForEntryFormQuery } from '#generated/types';
import { FIGURE_OPTIONS } from '#views/Entry/EntryForm/queries';
import { OrganizationOption } from '#components/selections/OrganizationMultiSelectInput';
import { ViolenceContextOption } from '#components/selections/ViolenceContextMultiSelectInput';
import { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';

import styles from './styles.css';

type FigureInputValue = PartialForm<FigureFormProps>;

interface Props {
    loading: boolean;
    figures: FigureInputValue[] | undefined;
    events: EventListOption[] | null | undefined;
    setEvents: Dispatch<SetStateAction<EventListOption[] | null | undefined>>;
    selectedFigure?: string;
    setSelectedFigure: React.Dispatch<React.SetStateAction<string | undefined>>;
    attachment?: Attachment;
    preview?: SourcePreview;
    organizations: OrganizationOption[] | null | undefined;
    setOrganizations: React.Dispatch<React.SetStateAction<OrganizationOption[] | null | undefined>>;
    tagOptions: TagOptions;
    setTagOptions: Dispatch<SetStateAction<FigureTagOption[] | null | undefined>>;
    violenceContextOptions: ViolenceContextOption[] | null | undefined;
    setViolenceContextOptions: Dispatch<SetStateAction<ViolenceContextOption[] | null | undefined>>;
}

const mode = 'view';
const trafficLightShown = mode === 'view';

function FigureAndPreview(props: Props) {
    const {
        loading,
        figures: value,
        events,
        setEvents,
        selectedFigure,
        setSelectedFigure,
        preview,
        attachment,
        organizations,
        setOrganizations,
        violenceContextOptions,
        setViolenceContextOptions,
        tagOptions,
        setTagOptions,
    } = props;

    const {
        data: figureOptionsData,
        loading: figureOptionsLoading,
        error: figureOptionsError,
    } = useQuery<FigureOptionsForEntryFormQuery>(FIGURE_OPTIONS);

    return (
        <div className={styles.container}>
            <div className={styles.figureContainer}>
                <PageHeader
                    title="Figure"
                />
                <div className={styles.figuresContent}>
                    {value?.length === 0 ? (
                        <div>
                            No figures yet
                        </div>
                    ) : value?.map((fig, index) => (
                        <FigureInput
                            key={fig.uuid}
                            selectedFigure={selectedFigure}
                            setSelectedFigure={setSelectedFigure}
                            index={index}
                            value={fig}
                            onChange={() => null}
                            onRemove={() => null}
                            error={undefined}
                            disabled={loading}
                            mode={mode}
                            optionsDisabled={!!figureOptionsError || !!figureOptionsLoading}
                            tagOptions={tagOptions}
                            setTagOptions={setTagOptions}
                            violenceContextOptions={violenceContextOptions}
                            setViolenceContextOptions={setViolenceContextOptions}
                            events={events}
                            setEvents={setEvents}
                            causeOptions={figureOptionsData?.crisisType?.enumValues}
                            accuracyOptions={figureOptionsData?.accuracyList?.enumValues}
                            // eslint-disable-next-line max-len
                            categoryOptions={figureOptionsData?.figureCategoryList?.enumValues}
                            unitOptions={figureOptionsData?.unitList?.enumValues}
                            termOptions={figureOptionsData?.figureTermList?.enumValues}
                            roleOptions={figureOptionsData?.roleList?.enumValues}
                            // eslint-disable-next-line max-len
                            displacementOptions={figureOptionsData?.displacementOccurence?.enumValues}
                            // eslint-disable-next-line max-len
                            identifierOptions={figureOptionsData?.identifierList?.enumValues}
                            // eslint-disable-next-line max-len
                            genderCategoryOptions={figureOptionsData?.disaggregatedGenderList?.enumValues}
                            // eslint-disable-next-line max-len
                            quantifierOptions={figureOptionsData?.quantifierList?.enumValues}
                            // eslint-disable-next-line max-len
                            dateAccuracyOptions={figureOptionsData?.dateAccuracy?.enumValues}
                            // eslint-disable-next-line max-len
                            disasterCategoryOptions={figureOptionsData?.disasterCategoryList}
                            violenceCategoryOptions={figureOptionsData?.violenceList}
                            osvSubTypeOptions={figureOptionsData?.osvSubTypeList}
                            // eslint-disable-next-line max-len
                            otherSubTypeOptions={figureOptionsData?.otherSubTypeList}
                            trafficLightShown={trafficLightShown}
                            organizations={organizations}
                            setOrganizations={setOrganizations}
                        />
                    ))}
                </div>
            </div>
            <div className={styles.previewContainer}>
                <PageHeader
                    title="Preview"
                />
                {preview && (
                    <UrlPreview
                        className={styles.preview}
                        mode="html"
                        url={preview.url}
                    />
                )}
                {attachment && (
                    <UrlPreview
                        className={styles.preview}
                        url={attachment.attachment}
                    />
                )}
            </div>
        </div>
    );
}

export default FigureAndPreview;
