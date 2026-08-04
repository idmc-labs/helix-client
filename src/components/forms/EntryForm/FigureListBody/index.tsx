import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { _cs } from '@togglecorp/fujs';
import { Button } from '@togglecorp/toggle-ui';
import { IoChevronUpOutline } from 'react-icons/io5';

import QuickActionButton from '#components/QuickActionButton';

import styles from './styles.module.css';

export interface FigureListBodyItem {
    key: string;
    node: React.ReactNode;
}

const keySelector = (_: number, item: FigureListBodyItem) => item.key;
const nodeSelector = (_: number, item: FigureListBodyItem) => item.node;

interface Props {
    className?: string;
    items: FigureListBodyItem[];
    hasMore: boolean;
    isLoadingMore: boolean;
    onLoadMore: () => void;
    scrollToKey?: string;
}

function FigureListBody(props: Props) {
    const {
        className,
        items,
        hasMore,
        isLoadingMore,
        onLoadMore,
        scrollToKey,
    } = props;

    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [atTop, setAtTop] = useState(true);

    const handledScrollToKeyRef = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!scrollToKey || handledScrollToKeyRef.current === scrollToKey) {
            return;
        }
        if (!virtuosoRef.current) {
            return;
        }
        const index = items.findIndex((item) => item.key === scrollToKey);
        if (index === -1) {
            return;
        }
        handledScrollToKeyRef.current = scrollToKey;
        virtuosoRef.current.scrollIntoView({
            index,
            align: 'start',
            behavior: 'smooth',
        });
    }, [scrollToKey, items]);

    const handleScrollToTop = useCallback(() => {
        virtuosoRef.current?.scrollIntoView({
            index: 0,
            align: 'start',
            behavior: 'smooth',
        });
    }, []);

    if (items.length <= 0) {
        return null;
    }

    return (
        <div className={_cs(styles.body, className)}>
            <Virtuoso
                ref={virtuosoRef}
                className={styles.virtuoso}
                data={items}
                computeItemKey={keySelector}
                itemContent={nodeSelector}
                atTopStateChange={setAtTop}
                components={{
                    Footer: () => (hasMore ? (
                        <div className={styles.loadMoreContainer}>
                            <Button
                                name={undefined}
                                onClick={onLoadMore}
                                disabled={isLoadingMore}
                            >
                                {isLoadingMore ? 'Loading...' : 'Load more'}
                            </Button>
                        </div>
                    ) : null),
                }}
            />
            {!atTop && (
                <QuickActionButton
                    name={undefined}
                    className={styles.scrollToTop}
                    title="Scroll to top"
                    onClick={handleScrollToTop}
                    variant="accent"
                >
                    <IoChevronUpOutline />
                </QuickActionButton>
            )}
        </div>
    );
}

export default FigureListBody;
