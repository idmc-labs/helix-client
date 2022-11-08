import React, {
    Dispatch,
    SetStateAction,
} from 'react';

import PageHeader from '#components/PageHeader';
import UrlPreview from '#components/UrlPreview';
import { Attachment, FigureFormProps, SourcePreview } from '#views/Entry/EntryForm/types';
import FigureInput from '#views/Entry/EntryForm/FigureInput';
import { EventListOption } from '#components/selections/EventListSelectInput';

import styles from './styles.css';

interface Props {
    loading: boolean;
    figures: FigureFormProps[] | undefined | null;
    events: EventListOption[] | null | undefined;
    setEvents: Dispatch<SetStateAction<EventListOption[] | null | undefined>>;
    selectedFigure?: string;
    setSelectedFigure: React.Dispatch<React.SetStateAction<string | undefined>>;
    attachment?: Attachment;
    preview?: SourcePreview;
}

const mode = 'view';

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

    } = props;

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
                            optionsDisabled={false}
                            tagOptions={undefined}
                            setTagOptions={() => null}
                            violenceContextOptions={undefined}
                            setViolenceContextOptions={() => null}
                            events={events}
                            setEvents={setEvents}
                            causeOptions={undefined}
                            accuracyOptions={undefined}
                            // eslint-disable-next-line max-len
                            categoryOptions={undefined}
                            unitOptions={undefined}
                            termOptions={undefined}
                            roleOptions={undefined}
                            // eslint-disable-next-line max-len
                            displacementOptions={undefined}
                            // eslint-disable-next-line max-len
                            identifierOptions={undefined}
                            // eslint-disable-next-line max-len
                            genderCategoryOptions={undefined}
                            // eslint-disable-next-line max-len
                            quantifierOptions={undefined}
                            // eslint-disable-next-line max-len
                            dateAccuracyOptions={undefined}
                            // eslint-disable-next-line max-len
                            disasterCategoryOptions={undefined}
                            violenceCategoryOptions={undefined}
                            osvSubTypeOptions={undefined}
                            // eslint-disable-next-line max-len
                            otherSubTypeOptions={undefined}
                            // trafficLightShown={mode === 'view'}
                            trafficLightShown={false}
                            organizations={undefined}
                            setOrganizations={() => null}
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
