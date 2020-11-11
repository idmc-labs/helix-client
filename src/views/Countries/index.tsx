import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    FaEdit,
    FaDownload,
} from 'react-icons/fa';

import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import QuickActionButton from '#components/QuickActionButton';
import MyResources from '#components/MyResources';
import EntriesTable from '#components/EntriesTable';

import CommunicationAndPartners from '#components/CommunicationAndPartners';
import styles from './styles.css';

interface CountriesProps {
    className?: string;
}

function Countries(props: CountriesProps) {
    const { className } = props;

    return (
        <div className={_cs(className, styles.countries)}>
            <PageHeader
                title="Countries"
            />
            <div className={styles.content}>
                <div className={styles.leftContent}>
                    <div className={styles.top}>
                        <Container
                            className={styles.container}
                            heading="IDP Map"
                        >
                            <div className={styles.dummyContent} />
                        </Container>
                    </div>
                    <div className={styles.middle}>
                        <Container
                            className={styles.container}
                            heading="Summary"
                        >
                            <div className={styles.dummyContent} />
                        </Container>
                        <Container
                            className={styles.container}
                            heading="Recent Activity"
                        >
                            <div className={styles.dummyContent} />
                        </Container>
                    </div>
                    <div>
                        <Container
                            className={styles.container}
                            heading="Country Crises Overtime"
                        >
                            <div className={styles.dummyContent} />
                        </Container>
                    </div>
                </div>
                <div className={styles.sideContent}>
                    <Container
                        className={styles.container}
                        heading="Contextual Updates"
                        headerActions={(
                            <>
                                <QuickActionButton name={undefined}>
                                    <FaDownload />
                                </QuickActionButton>
                                <QuickActionButton name={undefined}>
                                    <FaEdit />
                                </QuickActionButton>
                            </>
                        )}
                    >
                        <div className={styles.dummyContent} />
                    </Container>
                    <MyResources
                        // TODO: pass country filter
                        className={styles.container}
                    />
                </div>
            </div>
            <div className={styles.fullWidth}>
                <EntriesTable
                    // TODO: pass country filter
                    heading="Country Entries"
                    className={styles.container}
                />
                <CommunicationAndPartners
                    className={styles.container}
                />
            </div>
        </div>
    );
}

export default Countries;
