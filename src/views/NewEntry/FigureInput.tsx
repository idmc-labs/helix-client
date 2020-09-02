import React from 'react';
import {
    TextInput,
    Checkbox,
    MultiSelectInput,
    SelectInput,
} from '@togglecorp/toggle-ui';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import styles from './styles.css';

export interface FigureFormProps {
    id: number;
    districts: string[];
    town: string;
    quantifier: string;
    reportedFigure: string;
    unit: string;
    term: string;
    figureType: string;
    role: string;
    disaggregatedData: boolean;
    totalFigure: string;
    startDate: string;
    endDate: string;
    includeInIdu: boolean;
    excerptForIdu: string;
}

interface FigureInputProps {
    index: number;
    value: FigureFormProps;
    error: Error<FigureFormProps> | undefined;
    onChange: (value: FigureFormProps, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
}

function FigureInput(props: FigureInputProps) {
    const {
        value,
        onChange,
        onRemove,
        error,
        index,
        className,
    } = props;

    const onValueChange = useFormObject<number, FigureFormProps>(index, value, onChange);

    return (
        <>
            <div className={styles.row}>
                <MultiSelectInput
                    options={[]}
                    label="Districts(s)"
                    className={styles.districtsInput}
                    name="districts"
                    value={value.districts}
                    onChange={onValueChange}
                />
                <TextInput
                    label="Town / Village"
                    className={styles.townInput}
                    name="town"
                    value={value.town}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Quantifier"
                    className={styles.crisisInput}
                    name="crisis"
                    value={value.crisis}
                    onChange={onValueChange}
                />
                <TextInput
                    label="Reported Figure"
                    className={styles.reportedFigureInput}
                    name="reportedFigure"
                    value={value.reportedFigure}
                    onChange={onValueChange}
                />
                <SelectInput
                    label="Unit"
                    className={styles.unitInput}
                    name="unit"
                    value={value.unit}
                    onChange={onValueChange}
                    options={[]}
                />
            </div>
            <div className={styles.row}>
                <SelectInput
                    options={[]}
                    label="Term"
                    className={styles.termInput}
                    name="term"
                    value={value.term}
                    onChange={onValueChange}
                />
                <SelectInput
                    options={[]}
                    label="Figure Type"
                    className={styles.figureTypeInput}
                    name="figureType"
                    value={value.figureType}
                    onChange={onValueChange}
                />
                <SelectInput
                    options={[]}
                    label="Role"
                    className={styles.roleInput}
                    name="role"
                    value={value.role}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <Checkbox
                    label="Disaggregated Data"
                    name="disaggregatedData"
                    value={value.disaggregatedData}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Total Figure"
                    className={styles.totalFigureInput}
                    name="totalFigure"
                    value={value.totalFigure}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Start date"
                    className={styles.startDateInput}
                    name="startDate"
                    value={value.startDate}
                    onChange={onValueChange}
                />
                <TextInput
                    label="End date"
                    className={styles.endDateInput}
                    name="endDate"
                    value={value.endDate}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <Checkbox
                    label="Include in IDU"
                    name="includeInIdu"
                    value={value.includeInIdu}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Excerpt for IDU"
                    className={styles.excerptForIduInput}
                    name="excerptForIdu"
                    value={value.excerptForIdu}
                    onChange={onValueChange}
                />
            </div>
        </>
    );
}

export default FigureInput;
