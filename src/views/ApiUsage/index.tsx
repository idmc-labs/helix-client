import React, { useCallback, useContext } from 'react';
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

import ApiClientsTable from './ClientRecordsTable';
import ApiLogsTable from './ApiRecordsTable';

import styles from './styles.css';

const GRAPHIQL_ENDPOINT = process.env.REACT_APP_GRAPHIQL_ENDPOINT as string;
const SWAGGER_ENDPOINT = process.env.REACT_APP_SWAGGER_ENDPOINT as string;

interface TabReduxProps {
    children: React.ReactNode;
    className?: string;
    name: string;
}

// TODO: move this to components
function TabRedux(props: TabReduxProps) {
    const {
        className,
        name,
        children,
    } = props;
    const context = useContext(TabsContext);

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

interface ApiUsageProps{
    className?: string;
}

function ApiUsage(props: ApiUsageProps) {
    const { className } = props;

    return (
        <div className={_cs(styles.apiUsage, className)}>
            <Tabs
                useHash
                defaultHash="logs"
            >
                <div className={styles.sideContent}>
                    <div className={styles.sideContent}>
                        <Container
                            className={styles.sidePaneContainer}
                            contentClassName={styles.sidePaneContent}
                            heading="Categories"
                        >
                            <TabRedux
                                name="logs"
                            >
                                Logs
                            </TabRedux>
                            <TabRedux
                                name="clients"
                            >
                                Clients
                            </TabRedux>
                        </Container>
                        {(GRAPHIQL_ENDPOINT || SWAGGER_ENDPOINT) && (
                            <Container
                                className={styles.sidePaneContainer}
                                contentClassName={styles.sidePaneContent}
                                heading="APIs"
                            >
                                {GRAPHIQL_ENDPOINT && (
                                    <a
                                        className={styles.link}
                                        href={GRAPHIQL_ENDPOINT}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        Graphiql (Graphql API)
                                    </a>
                                )}
                                {SWAGGER_ENDPOINT && (
                                    <a
                                        className={styles.link}
                                        href={SWAGGER_ENDPOINT}
                                        rel="noreferrer"
                                        target="_blank"
                                    >
                                        Swagger (REST API)
                                    </a>
                                )}
                            </Container>
                        )}
                    </div>
                </div>
                <div className={styles.mainContent}>
                    <PageHeader
                        title="API Usage"
                    />
                    <TabPanel
                        name="logs"
                    >
                        <ApiLogsTable
                            className={styles.container}
                            title="Logs"
                        />
                    </TabPanel>
                    <TabPanel
                        name="clients"
                    >
                        <ApiClientsTable
                            className={styles.container}
                            title="Clients"
                        />
                    </TabPanel>
                </div>
            </Tabs>
        </div>
    );
}
export default ApiUsage;
