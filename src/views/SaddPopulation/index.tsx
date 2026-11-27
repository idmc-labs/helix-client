import React, { useMemo, useCallback, useContext, useState } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    Modal,
    Pager,
    SortContext,
    Table,
} from '@togglecorp/toggle-ui';
import { IoCloudUploadOutline } from 'react-icons/io5';

import Container from '#components/Container';
import FileUploader from '#components/FileUploader';
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';
import PageHeader from '#components/PageHeader';
import TableMessage from '#components/TableMessage';
import {
    createTextColumn,
    createNumberColumn,
    createDateTimeColumn,
} from '#components/tableHelpers';
import useFilterState from '#hooks/useFilterState';
import { hasNoData } from '#utils/common';

import SaddPopulationFilter, { SaddPopulationFilterFields } from './SaddPopulationFilter';
import {
    dummyPopulations,
    sexLabel,
    SaddPopulation as SaddPopulationType,
} from './dummyData';
import styles from './styles.module.css';

// FIXME: should come from server config once the upload API exists
const MAX_UPLOAD_SIZE_IN_MB = 50;
const REQUIRED_COLUMNS = [
    'ISO3_code',
    'Location',
    'Time',
    'LocTypeName',
    'AgeGrp',
    'PopTotal',
    'PopMale',
    'PopFemale',
];
const MAX_ERRORS_SHOWN = 100;

interface RowError {
    id: string;
    row: number;
    column: string;
    message: string;
}

// ponytail: minimal quote-aware CSV split; server parser replaces this whole mock
function splitCsvLine(line: string) {
    const cells: string[] = [];
    let current = '';
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"' && line[i + 1] === '"' && quoted) {
            current += '"';
            i += 1;
        } else if (char === '"') {
            quoted = !quoted;
        } else if (char === ',' && !quoted) {
            cells.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    cells.push(current);
    return cells.map((cell) => cell.trim());
}

// FIXME: mock of the server-side validation, remove once the upload mutation exists
function validateWppCsv(text: string): RowError[] {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length === 0) {
        return [{ id: 'empty', row: 1, column: '-', message: 'File is empty' }];
    }
    const header = splitCsvLine(lines[0]);
    const missing = REQUIRED_COLUMNS.filter((column) => !header.includes(column));
    if (missing.length > 0) {
        return missing.map((column) => ({
            id: `header-${column}`,
            row: 1,
            column,
            message: 'Required column is missing',
        }));
    }
    const index = Object.fromEntries(header.map((column, i) => [column, i]));

    const errors: RowError[] = [];
    for (let i = 1; i < lines.length && errors.length < MAX_ERRORS_SHOWN; i += 1) {
        const cells = splitCsvLine(lines[i]);
        if (cells[index.LocTypeName] === 'Country/Area') {
            const row = i + 1;
            if (!cells[index.ISO3_code]) {
                errors.push({ id: `${row}-iso3`, row, column: 'ISO3_code', message: 'ISO3 code is required' });
            }
            if (!/^\d{4}$/.test(cells[index.Time] ?? '')) {
                errors.push({ id: `${row}-time`, row, column: 'Time', message: 'Year must be a 4 digit number' });
            }
            ['PopTotal', 'PopMale', 'PopFemale'].forEach((column) => {
                const value = Number(cells[index[column]]);
                if (cells[index[column]] === '' || Number.isNaN(value) || value < 0) {
                    errors.push({ id: `${row}-${column}`, row, column, message: 'Must be a non-negative number' });
                }
            });
        }
    }
    return errors;
}

const keySelector = (item: SaddPopulationType) => item.id;
const errorKeySelector = (item: RowError) => item.id;

const errorColumns = [
    createNumberColumn<RowError, string>('row', 'Row', (item) => item.row, undefined, 'very-small'),
    createTextColumn<RowError, string>('column', 'Column', (item) => item.column, undefined, 'small'),
    createTextColumn<RowError, string>('message', 'Error', (item) => item.message, undefined, 'large'),
];

interface SaddPopulationProps {
    className?: string;
}

function SaddPopulation(props: SaddPopulationProps) {
    const { className } = props;

    const {
        page,
        rawPage,
        setPage,

        sortState,

        rawFilter,
        initialFilter,
        filter,
        setFilter,

        pageSize,
        rawPageSize,
        setPageSize,
    } = useFilterState<SaddPopulationFilterFields>({
        filter: { status: 'ACTIVE' },
        ordering: {
            name: 'year',
            direction: 'dsc',
        },
    });

    const { notify } = useContext(NotificationContext);

    const [uploadPending, setUploadPending] = useState(false);
    const [uploadErrors, setUploadErrors] = useState<RowError[] | undefined>();

    const columns = useMemo(
        () => ([
            createTextColumn<SaddPopulationType, string>(
                'country',
                'Country',
                (item) => item.countryName,
                { sortable: true },
                'medium',
            ),
            createTextColumn<SaddPopulationType, string>(
                'iso3',
                'ISO3',
                (item) => item.iso3,
                { sortable: true },
                'very-small',
            ),
            createTextColumn<SaddPopulationType, string>(
                'year',
                'Year',
                (item) => String(item.year),
                { sortable: true },
                'very-small',
            ),
            createTextColumn<SaddPopulationType, string>(
                'sex',
                'Sex',
                (item) => sexLabel[item.sex],
                undefined,
                'very-small',
            ),
            createNumberColumn<SaddPopulationType, string>(
                'age0To4',
                '0-4',
                (item) => item.age0To4,
                { sortable: true },
                'small',
            ),
            createNumberColumn<SaddPopulationType, string>(
                'age5To11',
                '5-11',
                (item) => item.age5To11,
                { sortable: true },
                'small',
            ),
            createNumberColumn<SaddPopulationType, string>(
                'age12To17',
                '12-17',
                (item) => item.age12To17,
                { sortable: true },
                'small',
            ),
            createNumberColumn<SaddPopulationType, string>(
                'age18To59',
                '18-59',
                (item) => item.age18To59,
                { sortable: true },
                'small',
            ),
            createNumberColumn<SaddPopulationType, string>(
                'age60Plus',
                '60+',
                (item) => item.age60Plus,
                { sortable: true },
                'small',
            ),
            createNumberColumn<SaddPopulationType, string>(
                'total',
                'Total',
                (item) => item.total,
                { sortable: true },
                'small',
            ),
            createTextColumn<SaddPopulationType, string>(
                'status',
                'Status',
                (item) => (item.isActive ? 'Active' : 'Archived'),
                undefined,
                'very-small',
            ),
            createTextColumn<SaddPopulationType, string>(
                'createdBy',
                'Changed By',
                (item) => item.createdBy,
                undefined,
                'small',
            ),
            createDateTimeColumn<SaddPopulationType, string>(
                'createdAt',
                'Changed On',
                (item) => item.createdAt,
                { sortable: true },
            ),
        ]),
        [],
    );

    // FIXME: filtering, sorting and paging move to the server with the list query
    const filteredData = useMemo(
        () => {
            const search = filter.search?.toLowerCase();
            const rows = dummyPopulations.filter((item) => (
                (!search
                    || item.countryName.toLowerCase().includes(search)
                    || item.iso3.toLowerCase().includes(search))
                && (!filter.year || item.year === filter.year)
                && (
                    !filter.status
                    || filter.status === 'ALL'
                    || item.isActive === (filter.status === 'ACTIVE')
                )
            ));
            const sortColumn = columns.find((column) => column.id === sortState.sorting?.name);
            if (!sortColumn) {
                return rows;
            }
            const direction = sortState.sorting?.direction === 'dsc' ? -1 : 1;
            return [...rows].sort(
                (foo, bar) => direction * sortColumn.valueComparator(foo, bar),
            );
        },
        [filter, columns, sortState.sorting],
    );

    const totalCount = filteredData.length;
    const pageData = filteredData.slice((page - 1) * pageSize, page * pageSize);

    const handleFileUpload = useCallback(
        async (files: File[]) => {
            const [file] = files;
            if (file.size > MAX_UPLOAD_SIZE_IN_MB * 1024 * 1024) {
                notify({
                    children: `File is larger than ${MAX_UPLOAD_SIZE_IN_MB} MB and was not read.`,
                    variant: 'error',
                });
                return;
            }
            setUploadPending(true);
            const errors = validateWppCsv(await file.text());
            setUploadPending(false);
            if (errors.length > 0) {
                setUploadErrors(errors);
                return;
            }
            notify({
                children: 'File is valid. (Dummy upload: nothing was saved.)',
                variant: 'success',
            });
        },
        [notify],
    );

    const hideUploadErrors = useCallback(() => setUploadErrors(undefined), []);

    return (
        <div className={_cs(styles.saddPopulation, className)}>
            <div className={styles.mainContent}>
                <PageHeader
                    title="SADD Population"
                    actions={(
                        <FileUploader
                            name={undefined}
                            onChange={handleFileUpload}
                            accept=".csv"
                            disabled={uploadPending}
                            variant="primary"
                            icons={<IoCloudUploadOutline />}
                        >
                            Upload WPP CSV
                        </FileUploader>
                    )}
                />
                <Container
                    compactContent
                    contentClassName={styles.content}
                    heading="SADD Population"
                    description={(
                        <SaddPopulationFilter
                            currentFilter={rawFilter}
                            initialFilter={initialFilter}
                            onFilterChange={setFilter}
                        />
                    )}
                    footerContent={(
                        <Pager
                            activePage={rawPage}
                            itemsCount={totalCount}
                            maxItemsPerPage={rawPageSize}
                            onActivePageChange={setPage}
                            onItemsPerPageChange={setPageSize}
                        />
                    )}
                >
                    {uploadPending && <Loading absolute />}
                    <SortContext.Provider value={sortState}>
                        {totalCount > 0 && (
                            <Table
                                data={pageData}
                                keySelector={keySelector}
                                columns={columns}
                                resizableColumn
                                fixedColumnWidth
                            />
                        )}
                    </SortContext.Provider>
                    <TableMessage
                        errored={false}
                        filtered={!hasNoData(filter)}
                        totalItems={totalCount}
                        emptyMessage="No population data found"
                        emptyMessageWithFilters="No population data found with applied filters"
                    />
                </Container>
                {uploadErrors && (
                    <Modal
                        heading="Upload rejected"
                        onClose={hideUploadErrors}
                        size="large"
                    >
                        <p>
                            No rows were created or changed.
                            {uploadErrors.length >= MAX_ERRORS_SHOWN && ` Showing first ${MAX_ERRORS_SHOWN} errors.`}
                        </p>
                        <Table
                            data={uploadErrors}
                            keySelector={errorKeySelector}
                            columns={errorColumns}
                            fixedColumnWidth
                        />
                    </Modal>
                )}
            </div>
        </div>
    );
}

export default SaddPopulation;
