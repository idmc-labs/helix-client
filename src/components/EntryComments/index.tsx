import React, { useMemo, useState } from 'react';
import { _cs } from '@togglecorp/fujs';
import { useQuery } from '@apollo/client';
import { Avatar, Pager } from '@togglecorp/toggle-ui';

import DateCell from '#components/tableHelpers/Date';
import {
    EntryCommentsQuery,
    EntryCommentsQueryVariables,
} from '#generated/types';

import { ENTRY_COMMENTS } from './queries';
import styles from './styles.css';

interface EntryCommentsProps {
    className?: string;
    entryId: string;
}

export default function EntryComments(props: EntryCommentsProps) {
    const {
        className,
        entryId,
    } = props;

    const [page, setPage] = useState(1);

    const [pageSize, setPageSize] = useState(50);

    const variables = useMemo(
        () => ({
            pageSize,
            ordering: '-createdAt',
            page,
            id: entryId,
        }),
        [entryId, page],
    );
    const {
        data: commentsData,
        // FIXME: handle loading
        // FIXME: handle error
    } = useQuery<EntryCommentsQuery, EntryCommentsQueryVariables>(ENTRY_COMMENTS, {
        variables,
    });
    const data = commentsData?.entry?.reviewComments?.results;

    return (
        <div
            className={_cs(styles.commentList, className)}
        >
            {data?.map((c) => (
                <div
                    key={c.id}
                    className={styles.comment}
                >
                    <div
                        className={styles.avatar}
                    >
                        <Avatar
                            alt={c.createdBy?.fullName ?? 'Anon'}
                        />
                    </div>
                    <div className={styles.box}>
                        <div className={styles.name}>
                            {c.createdBy?.fullName ?? 'Anon'}
                        </div>
                        <div>
                            { c.body }
                        </div>
                        <DateCell
                            className={styles.date}
                            value={c.createdAt}
                            format="datetime"
                        />
                    </div>
                </div>
            ))}
            <Pager
                activePage={page}
                itemsCount={commentsData?.entry?.reviewComments?.totalCount ?? 0}
                maxItemsPerPage={pageSize}
                onActivePageChange={setPage}
                onItemsPerPageChange={setPageSize}
            />
        </div>
    );
}
