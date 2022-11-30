import { compareString, compareNumber, compareDate } from '@togglecorp/fujs';
import {
    TableHeaderCell,
    TableHeaderCellProps,
    TableColumn,
    TableSortDirection,
    TableFilterType,
    Numeral,
    NumeralProps,
    DateTimeProps,
    DateTime,
} from '@togglecorp/toggle-ui';

import { RouteData, Attrs } from '#hooks/useRouteMatching';
import Link, { LinkProps } from './Link';
import ExternalLink, { ExternalLinkProps } from './ExternalLink';
import StatusLink, { Props as StatusLinkProps } from './StatusLink';
import { ReviewStatus } from './Status';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import Text, { TextProps } from './Text';
import styles from './styles.css';

type Size = 'very-small' | 'small' | 'medium' | 'medium-large' | 'large';

export function getWidthFromSize(size: Size | undefined) {
    switch (size) {
        case 'very-small':
            return 40;
        case 'small':
            return 80;
        case 'medium':
            return 120;
        case 'medium-large':
            return 160;
        case 'large':
            return 240;
        default:
            return undefined;
    }
}

export interface ColumnOptions {
    sortable?: boolean,
    defaultSortDirection?: TableSortDirection,
    filterType?: TableFilterType,
    orderable?: boolean;
    hideable?: boolean;
    columnClassName?: string,
}

export function createLinkColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => {
        title: string | undefined | null,
        attrs?: Attrs,
        ext: string | undefined,
        hash?: string,
        search?: string,
    } | undefined | null,
    route: RouteData,
    options?: ColumnOptions,
    size: Size = 'large',
) {
    const item: TableColumn<D, K, LinkProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        columnWidth: getWidthFromSize(size),
        columnStretch: true,
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: Link,
        cellRendererParams: (_: K, datum: D): LinkProps => {
            const value = accessor(datum);
            return {
                title: value?.title,
                attrs: value?.attrs,
                route,
                ext: value?.ext,
                hash: value?.hash,
                search: value?.search,
            };
        },
        valueSelector: (it) => accessor(it)?.title,
        valueComparator: (foo: D, bar: D) => compareString(
            accessor(foo)?.title,
            accessor(bar)?.title,
        ),
    };
    return item;
}

export function createExternalLinkColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => {
        title: string | undefined | null,
        link: string | undefined | null,
    } | undefined | null,
    options?: ColumnOptions,
    size: Size = 'large',
) {
    const item: TableColumn<D, K, ExternalLinkProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        columnWidth: getWidthFromSize(size),
        columnStretch: true,
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: ExternalLink,
        cellRendererParams: (_: K, datum: D): ExternalLinkProps => {
            const value = accessor(datum);
            return {
                title: value?.title,
                link: value?.link,
            };
        },
        valueSelector: (it) => accessor(it)?.title,
        valueComparator: (foo: D, bar: D) => compareString(
            accessor(foo)?.title,
            accessor(bar)?.title,
        ),
    };
    return item;
}

export function createTextColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => string | undefined | null,
    options?: ColumnOptions,
    size: Size = 'medium',
) {
    const item: TableColumn<D, K, TextProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        columnWidth: getWidthFromSize(size),
        columnStretch: true,
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: Text,
        cellRendererParams: (_: K, datum: D): TextProps => ({
            value: accessor(datum),
        }),
        valueSelector: accessor,
        valueComparator: (foo: D, bar: D) => compareString(accessor(foo), accessor(bar)),
    };
    return item;
}

export function createStatusColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => {
        status: ReviewStatus | undefined | null,
        title: string | undefined | null,
        attrs?: Attrs,
        ext: string | undefined,
        hash?: string;
        search?: string;
    } | undefined | null,
    route: RouteData,
    options?: ColumnOptions,
    size: Size = 'large',
) {
    const item: TableColumn<D, K, StatusLinkProps, TableHeaderCellProps> = {
        id,
        title,
        headerCellRenderer: TableHeaderCell,
        columnWidth: getWidthFromSize(size),
        columnStretch: true,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: StatusLink,
        cellRendererParams: (_: K, datum: D): StatusLinkProps => {
            const value = accessor(datum);
            return {
                title: value?.title,
                attrs: value?.attrs,
                route,
                status: value?.status,
                ext: value?.ext,
                hash: value?.hash,
                search: value?.search,
            };
        },
    };
    return item;
}

export function createActionColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => {
        id: string,
        deleteTitle?: string,
        onEdit: ((id?: string | undefined) => void) | undefined,
        onDelete: ((id: string) => void) | undefined,
    },
    options?: ColumnOptions,
    size: Size = 'medium',
) {
    const item: TableColumn<D, K, ActionProps, TableHeaderCellProps> = {
        id,
        title: title || 'Actions',
        // FIXME: get this from expected number of icons
        columnWidth: getWidthFromSize(size),
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
            titleClassName: styles.actionTitle,
            titleContainerClassName: styles.actionTitleContainer,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: ActionCell,
        cellRendererParams: (_: K, datum: D): ActionProps => {
            const value = accessor(datum);
            return {
                id: value.id,
                deleteTitle: value.deleteTitle,
                onEdit: value.onEdit,
                onDelete: value.onDelete,
            };
        },
        headerContainerClassName: styles.actionCell,
        cellContainerClassName: styles.actionCellHeader,
        cellRendererClassName: styles.actionCellItem,
        headerCellRendererClassName: styles.headerCellItem,
    };
    return item;
}

export function createCustomActionColumn<D, K, J>(
    cellRenderer: TableColumn<D, K, J, TableHeaderCellProps>['cellRenderer'],
    cellRendererParams: TableColumn<D, K, J, TableHeaderCellProps>['cellRendererParams'],
    id: string,
    title: string | undefined,
    options?: ColumnOptions,
    size: Size = 'medium',
) {
    const item: TableColumn<D, K, J, TableHeaderCellProps> = {
        id,
        title: title ?? 'Actions',
        columnWidth: getWidthFromSize(size),
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
            titleClassName: styles.actionTitle,
            titleContainerClassName: styles.actionTitleContainer,
        },
        columnClassName: options?.columnClassName,
        cellRenderer,
        cellRendererParams,
        headerContainerClassName: styles.actionCell,
        cellContainerClassName: styles.actionCellHeader,
        cellRendererClassName: styles.actionCellItem,
        headerCellRendererClassName: styles.headerCellItem,
    };
    return item;
}

export function createNumberColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => number | undefined | null,
    options?: ColumnOptions,
    size: Size = 'medium',
) {
    const item: TableColumn<D, K, NumeralProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => number | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        columnWidth: getWidthFromSize(size),
        headerCellRenderer: TableHeaderCell,
        headerCellRendererClassName: styles.numberCellHeader,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
            titleClassName: styles.title,
            titleContainerClassName: styles.titleContainer,
        },
        columnClassName: options?.columnClassName,
        cellRendererClassName: styles.numberCell,
        cellRenderer: Numeral,
        cellRendererParams: (_: K, datum: D): NumeralProps => ({
            value: accessor(datum),
            placeholder: 'N/a',
        }),
        valueSelector: accessor,
        valueComparator: (foo: D, bar: D) => compareNumber(accessor(foo), accessor(bar)),
    };
    return item;
}

export function createDateColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => string | undefined | null,
    options?: ColumnOptions,
    size: Size = 'medium',
) {
    const item: TableColumn<D, K, DateTimeProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        columnWidth: getWidthFromSize(size),
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: DateTime,
        cellRendererParams: (_: K, datum: D): DateTimeProps => ({
            value: accessor(datum),
            format: 'date',
        }),
        valueSelector: accessor,
        valueComparator: (foo: D, bar: D) => compareDate(accessor(foo), accessor(bar)),
    };
    return item;
}

export function createDateTimeColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => string | undefined | null,
    options?: ColumnOptions,
    size: Size = 'medium-large',
) {
    const item: TableColumn<D, K, DateTimeProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        columnWidth: getWidthFromSize(size),
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        columnClassName: options?.columnClassName,
        cellRenderer: DateTime,
        cellRendererParams: (_: K, datum: D): DateTimeProps => ({
            value: accessor(datum),
            format: 'datetime',
        }),
        valueSelector: accessor,
        valueComparator: (foo: D, bar: D) => compareDate(accessor(foo), accessor(bar)),
    };
    return item;
}
