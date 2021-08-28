import React, { useState } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TabList,
    Tab,
    Tabs,
    TabPanel,
} from '@togglecorp/toggle-ui';

import EntryPanel from './EntryPanel';
import FigurePanel from './FigurePanel';
import styles from './styles.css';

interface EntriesTableProps {
    page?: number;
    pageSize?: number;
    pagerDisabled?: boolean;
    heading?: string;
    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;

    eventId?: string;
    userId?: string;
    country?: string;
}

function EntriesTable(props: EntriesTableProps) {
    const {
        page,
        pageSize,
        pagerDisabled,
        heading = 'Entries',
        className,
        eventColumnHidden,
        crisisColumnHidden,
        eventId,
        userId,
        country,
    } = props;

    const [selectedTab, setSelectedTab] = useState('entry');

    const tabs = (
        <TabList>
            <Tab name="entry">
                {heading ?? 'Latest Entries'}
            </Tab>
            <Tab name="figure">
                Latest Figures
            </Tab>
        </TabList>
    );

    return (
        <div className={_cs(styles.entriesTable, className)}>
            <div className={styles.fullWidth}>
                <Tabs
                    value={selectedTab}
                    onChange={setSelectedTab}
                >
                    <TabPanel name="entry">
                        <EntryPanel
                            heading={tabs}
                            className={styles.largeContainer}
                            eventColumnHidden={eventColumnHidden}
                            crisisColumnHidden={crisisColumnHidden}
                            pagerDisabled={pagerDisabled}
                            page={page}
                            pageSize={pageSize}
                            eventId={eventId}
                            userId={userId}
                            country={country}
                        />
                    </TabPanel>
                    <TabPanel name="figure">
                        <FigurePanel
                            heading={tabs}
                            className={styles.largeContainer}
                            eventColumnHidden={eventColumnHidden}
                            crisisColumnHidden={crisisColumnHidden}
                            pagerDisabled={pagerDisabled}
                            page={page}
                            pageSize={pageSize}
                            eventId={eventId}
                            userId={userId}
                            country={country}
                        />
                    </TabPanel>
                </Tabs>
            </div>
        </div>
    );
}
export default EntriesTable;
