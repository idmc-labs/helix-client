import React, { useState } from 'react';
import {
    TabList,
    Tab,
    Tabs,
    TabPanel,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import {
    ExtractionEntryListFiltersQueryVariables,
} from '#generated/types';

import EntriesPanel from './EntriesPanel';
import FiguresPanel from './FiguresPanel';
import styles from './styles.css';

interface ExtractionEntriesTableProps {
    headingActions?: React.ReactNode;
    className?: string;
    extractionQueryFilters?: ExtractionEntryListFiltersQueryVariables;
    page: number;
    onPageChange: React.Dispatch<React.SetStateAction<number>>;
    pageSize: number,
    onPageSizeChange: React.Dispatch<React.SetStateAction<number>>;
}

function ExtractionEntriesTable(props: ExtractionEntriesTableProps) {
    const {
        headingActions,
        className,
        extractionQueryFilters,
        page,
        onPageChange,
        pageSize,
        onPageSizeChange,
    } = props;

    const [selectedTab, setSelectedTab] = useState('entry');

    const tabs = (
        <TabList>
            <Tab name="entry">
                Entries
            </Tab>
            <Tab name="figure">
                Figures
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
                        <EntriesPanel
                            heading={tabs}
                            headingActions={headingActions}
                            className={styles.largeContainer}
                            page={page}
                            onPageChange={onPageChange}
                            pageSize={pageSize}
                            onPageSizeChange={onPageSizeChange}
                            extractionQueryFilters={extractionQueryFilters}
                        />
                    </TabPanel>
                    <TabPanel name="figure">
                        <FiguresPanel
                            heading={tabs}
                            headingActions={headingActions}
                            className={styles.largeContainer}
                            page={page}
                            onPageChange={onPageChange}
                            pageSize={pageSize}
                            onPageSizeChange={onPageSizeChange}
                            extractionQueryFilters={extractionQueryFilters}
                        />
                    </TabPanel>
                </Tabs>
            </div>
        </div>
    );
}
export default ExtractionEntriesTable;
