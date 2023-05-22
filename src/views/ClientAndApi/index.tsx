import React, { useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Tabs,
    TabPanel,
    TabsContext,
    setHashToBrowser,
} from '@togglecorp/toggle-ui';

import BasicItem from '#components/BasicItem';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import Heading from '#components/Heading';
import ClientRecordsTable from '#components/tables/ClientRecordsTable';
import ApiRecordsTable from '#components/tables/ApiRecordsTable';

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

interface ClientAndApiProps {
    className?: string;
}

function ClientAndApi(props: ClientAndApiProps) {
    const { className } = props;

    return (
        <div className={_cs(styles.recordTable, className)}>
            <Tabs
                useHash
                defaultHash="client-records"
            >
                <div className={styles.sideContent}>
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
                                Record tables
                            </Heading>
                            <div className={styles.group}>
                                <TabRedux
                                    name="client-records"
                                >
                                    Client Records
                                </TabRedux>
                                <TabRedux
                                    name="api-records"
                                >
                                    API Records
                                </TabRedux>
                            </div>
                        </Container>
                    </div>
                </div>
                <div className={styles.mainContent}>
                    <PageHeader
                        title="Client and API records"
                    />
                    <TabPanel
                        name="client-records"
                    >
                        <ClientRecordsTable
                            className={styles.container}
                            title="Statistics for client"
                        />
                    </TabPanel>
                    <TabPanel
                        name="api-records"
                    >
                        <ApiRecordsTable
                            className={styles.container}
                            title="Statistics for API"
                        />
                    </TabPanel>
                </div>
            </Tabs>
        </div>
    );
}
export default ClientAndApi;
