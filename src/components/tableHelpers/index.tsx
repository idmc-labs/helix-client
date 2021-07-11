import { compareString, compareNumber } from '@togglecorp/fujs';
import {
    TableHeaderCell,
    TableHeaderCellProps,
    TableColumn,
    TableSortDirection,
    TableFilterType,
    Numeral,
    NumeralProps,
} from '@togglecorp/toggle-ui';

import { RouteData, Attrs } from '#hooks/useRouteMatching';
import Link, { LinkProps } from './Link';
import ExternalLink, { ExternalLinkProps } from './ExternalLink';
import Status, { StatusProps } from './Status';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import Text, { TextProps } from './Text';
import styles from './styles.css';

export function createLinkColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => {
        title: string | undefined | null,
        attrs?: Attrs,
    } | undefined | null,
    route: RouteData,
    options?: {
        cellAsHeader?: boolean,
        sortable?: boolean,
        defaultSortDirection?: TableSortDirection,
        filterType?: TableFilterType,
        orderable?: boolean;
        hideable?: boolean;
    },
) {
    const item: TableColumn<D, K, LinkProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        cellAsHeader: options?.cellAsHeader,
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        cellRenderer: Link,
        cellRendererParams: (_: K, datum: D): LinkProps => {
            const value = accessor(datum);
            return {
                title: value?.title,
                attrs: value?.attrs,
                route,
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
    options?: {
        cellAsHeader?: boolean,
        sortable?: boolean,
        defaultSortDirection?: TableSortDirection,
        filterType?: TableFilterType,
        orderable?: boolean;
        hideable?: boolean;
    },
) {
    const item: TableColumn<D, K, ExternalLinkProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        cellAsHeader: options?.cellAsHeader,
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
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
    options?: {
        cellAsHeader?: boolean,
        sortable?: boolean,
        defaultSortDirection?: TableSortDirection,
        filterType?: TableFilterType,
        orderable?: boolean;
        hideable?: boolean;
    },
) {
    const item: TableColumn<D, K, TextProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => string | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        cellAsHeader: options?.cellAsHeader,
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        cellRenderer: Text,
        cellRendererParams: (_: K, datum: D): TextProps => ({
            value: accessor(datum),
        }),
        valueSelector: accessor,
        valueComparator: (foo: D, bar: D) => compareString(accessor(foo), accessor(bar)),
    };
    return item;
}

export function createNumberColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => number | undefined | null,
    options?: {
        cellAsHeader?: boolean,
        sortable?: boolean,
        defaultSortDirection?: TableSortDirection,
        filterType?: TableFilterType,
        orderable?: boolean;
        hideable?: boolean;
    },
) {
    const item: TableColumn<D, K, NumeralProps, TableHeaderCellProps> & {
        valueSelector: (item: D) => number | undefined | null,
        valueComparator: (foo: D, bar: D) => number,
    } = {
        id,
        title,
        cellAsHeader: options?.cellAsHeader,
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        cellRenderer: Numeral,
        cellRendererParams: (_: K, datum: D): NumeralProps => ({
            value: accessor(datum),
            placeholder: 'N/a',
        }),
        cellRendererClassName: styles.numberCell,
        valueSelector: accessor,
        valueComparator: (foo: D, bar: D) => compareNumber(accessor(foo), accessor(bar)),
    };
    return item;
}

export function createStatusColumn<D, K>(
    id: string,
    title: string,
    accessor: (item: D) => {
        isReviewed: boolean | undefined | null,
        isSignedOff: boolean | undefined | null,
        isUnderReview: boolean | undefined | null,
    } | undefined | null,
    options?: {
        cellAsHeader?: boolean,
        sortable?: boolean,
        defaultSortDirection?: TableSortDirection,
        filterType?: TableFilterType,
        orderable?: boolean;
        hideable?: boolean;
    },
) {
    const item: TableColumn<D, K, StatusProps, TableHeaderCellProps> = {
        id,
        title,
        cellAsHeader: options?.cellAsHeader,
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        cellRenderer: Status,
        cellRendererParams: (_: K, datum: D): StatusProps => {
            const value = accessor(datum);
            return {
                isReviewed: value?.isReviewed,
                isSignedOff: value?.isSignedOff,
                isUnderReview: value?.isUnderReview,
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
        onEdit: ((id?: string | undefined) => void) | undefined,
        onDelete: ((id: string) => void) | undefined,
    },
    options?: {
        cellAsHeader?: boolean,
        sortable?: boolean,
        defaultSortDirection?: TableSortDirection,
        filterType?: TableFilterType,
        orderable?: boolean;
        hideable?: boolean;
    },
) {
    const item: TableColumn<D, K, ActionProps, TableHeaderCellProps> = {
        id,
        title,
        cellAsHeader: options?.cellAsHeader,
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            sortable: options?.sortable,
            filterType: options?.filterType,
            orderable: options?.orderable,
            hideable: options?.hideable,
        },
        cellRenderer: ActionCell,
        cellRendererParams: (_: K, datum: D): ActionProps => {
            const value = accessor(datum);
            return {
                id: value.id,
                onEdit: value.onEdit,
                onDelete: value.onDelete,
            };
        },
    };
    return item;
}
