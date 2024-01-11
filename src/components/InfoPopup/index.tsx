import React from 'react';
import { _cs } from '@togglecorp/fujs';
import { IoInformationOutline } from 'react-icons/io5';
import { PopupButton } from '@togglecorp/toggle-ui';

import styles from './styles.module.css';

interface Props {
    icon?: React.ReactNode;
    withoutIcon?: boolean;
    infoLabel?: React.ReactNode;
    popupClassName?: string;
    className?: string;
    children?: React.ReactNode;
}

function InfoPopup(props: Props) {
    const {
        className,
        icon = <IoInformationOutline />,
        infoLabel,
        children,
        withoutIcon,
        popupClassName,
    } = props;

    return (
        <PopupButton
            label={(
                <div className={styles.label}>
                    {infoLabel}
                    {!withoutIcon && icon && (
                        <div className={styles.icon}>
                            {icon}
                        </div>
                    )}
                </div>
            )}
            popupClassName={_cs(styles.dropdownContainer, popupClassName)}
            className={_cs(styles.infoPopup, className)}
            arrowHidden
            transparent
            persistent={false}
            name={undefined}
        >
            {children}
        </PopupButton>
    );
}

export default InfoPopup;
