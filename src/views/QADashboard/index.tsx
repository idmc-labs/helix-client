import React, { useContext, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Tabs,
    TabPanel,
    TabsContext,
    setHashToBrowser,
} from '@togglecorp/toggle-ui';
import BasicItem from '#components/BasicItem';
import Container from '#components/Container';
import EventsTable from '#components/tables/EventsTable';
import DomainContext from '#components/DomainContext';
import PageHeader from '#components/PageHeader';
import Heading from '#components/Heading';
import EntriesFiguresTable from '#components/tables/EntriesFiguresTable';

import styles from './styles.css';

interface TabReduxProps {
    children: React.ReactNode;
    className?: string;
    name: string;
}

function TabRedux(props: TabReduxProps) {
    const {
        className,
        name,
        children,
    } = props;
    const context = React.useContext(TabsContext);

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            setHashToBrowser(name);
        },
        [name],
    );
    // eslint-disable-next-line react/destructuring-assignment
    if (!context.useHash) {
        return null;
    }

    // eslint-disable-next-line react/destructuring-assignment
    const isActive = context.hash === name;

    return (
        <BasicItem
            className={_cs(className)}
            selected={isActive}
        >
            <a
                // eslint-disable-next-line react/destructuring-assignment
                href={context.hash}
                rel="noreferrer"
                target="_blank"
                onClick={handleClick}
            >
                {children}
            </a>
        </BasicItem>
    );
}

interface QAProps {
    className?: string;
}

function QADashboard(props: QAProps) {
    const {
        className,
    } = props;

    const {
        user,
    } = useContext(DomainContext);

    return (
        <div className={_cs(styles.qaEvents, className)}>
            <Tabs
                useHash
                defaultHash="events-with-multiple-recommended-figures"
            >
                <div className={styles.sideContent}>
                    <Container
                        className={styles.sidePaneContainer}
                        contentClassName={styles.sidePaneContent}
                        heading="Categories"
                    >
                        <Heading
                            size="small"
                            className={styles.groupHeading}
                        >
                            Potential Errors
                        </Heading>
                        <div className={styles.group}>
                            <TabRedux
                                name="events-with-multiple-recommended-figures"
                            >
                                Events with multiple recommended figures
                            </TabRedux>
                            <TabRedux
                                name="events-with-no-recommended-figures"
                            >
                                Events with no recommended figures
                            </TabRedux>
                        </div>
                        <Heading
                            size="small"
                            className={styles.groupHeading}
                        >
                            QA Process
                        </Heading>
                        <div className={styles.group}>
                            <TabRedux
                                name="figures-with-review-requested"
                            >
                                Figures with review requested
                            </TabRedux>
                            <TabRedux
                                name="assigned-events"
                            >
                                Assigned Events
                            </TabRedux>
                            <TabRedux
                                name="ignored-events"
                            >
                                Ignored Events
                            </TabRedux>
                        </div>
                    </Container>
                </div>
                <div className={styles.mainContent}>
                    <PageHeader
                        title="QA"
                    />
                    <TabPanel
                        name="events-with-multiple-recommended-figures"
                    >
                        <EventsTable
                            className={styles.container}
                            qaMode="MULTIPLE_RF"
                            title="Events with multiple recommended figures"
                        />
                    </TabPanel>
                    <TabPanel
                        name="events-with-no-recommended-figures"
                    >
                        <EventsTable
                            className={styles.container}
                            qaMode="NO_RF"
                            title="Events with no recommended figures"
                        />
                    </TabPanel>
                    <TabPanel
                        name="assigned-events"
                    >
                        <EventsTable
                            className={styles.container}
                            title="Assigned events"
                            assignee={user?.id}
                        />
                    </TabPanel>
                    <TabPanel
                        name="figures-with-review-requested"
                    >
                        <EntriesFiguresTable
                            className={styles.container}
                            userId={user?.id}
                            reviewStatus="REVIEW_RE_REQUESTED"
                        />
                    </TabPanel>
                    <TabPanel
                        name="ignored-events"
                    >
                        <EventsTable
                            className={styles.container}
                            qaMode="IGNORE_QA"
                            title="Ignored events"
                        />
                    </TabPanel>
                </div>
            </Tabs>
        </div>
    );
}

export default QADashboard;
