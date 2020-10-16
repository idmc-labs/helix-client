import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    FaPlus,
    FaEdit,
    FaSearch,
    FaDownload,
} from 'react-icons/fa';

import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import QuickActionButton from '#components/QuickActionButton';

import styles from './styles.css';

interface CountriesProps {
    className?: string;
}

function Countries(props: CountriesProps) {
    const { className } = props;

    return (
        <div className={_cs(className, styles.countries)}>
            <PageHeader
                className={styles.pageHeader}
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
                    <div className={styles.bottom}>
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
                    <Container
                        className={styles.container}
                        heading="My Resources"
                        headerActions={(
                            <>
                                <QuickActionButton name={undefined}>
                                    <FaSearch />
                                </QuickActionButton>
                                <QuickActionButton name={undefined}>
                                    <FaPlus />
                                </QuickActionButton>
                                <QuickActionButton name={undefined}>
                                    <FaEdit />
                                </QuickActionButton>
                            </>
                        )}
                    >
                        <div className={styles.dummyContent} />
                        <div className={styles.dummyContent} />
                    </Container>
                </div>
            </div>
            <div className={styles.fullWidth}>
                <Container
                    className={styles.container}
                    heading="Country Entries"
                >
                    <div className={styles.dummyContent} />
                </Container>
                <Container
                    className={styles.container}
                    heading="Communication & Partners"
                >
                    <div className={styles.dummyContent} />
                </Container>
            </div>
        </div>
    );
}

export default Countries;
