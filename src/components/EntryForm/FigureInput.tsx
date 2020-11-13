import React from 'react';
import {
    NumberInput,
    DateInput,
    TextInput,
    TextArea,
    Switch,
    SelectInput,
    Button,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { v4 as uuidv4 } from 'uuid';

import { PartialForm } from '#types';
import NonFieldError from '#components/NonFieldError';
import Section from '#components/Section';
import Header from '#components/Header';
import {
    useFormObject,
    useFormArray,
} from '#utils/form';
import type { Error } from '#utils/schema';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
import { FigureOptionsForEntryFormQuery } from '#generated/types';

import AgeInput from './AgeInput';
import StrataInput from './StrataInput';

import { FigureFormProps, AgeFormProps, StrataFormProps } from './types';
import styles from './styles.css';

const FIGURE_OPTIONS = gql`
    query FigureOptionsForEntryForm {
        quantifierList: __type(name: "QUANTIFIER") {
            name
            enumValues {
                name
                description
            }
        }
        unitList: __type(name: "UNIT") {
            name
            enumValues {
                name
                description
            }
        }
        termList: __type(name: "TERM") {
            name
            enumValues {
                name
                description
            }
        }
        roleList: __type(name: "ROLE") {
            name
            enumValues {
                name
                description
            }
        }
        typeList: __type(name: "TYPE") {
            name
            enumValues {
                name
                description
            }
        }
    }
`;

interface FigureInputProps {
    index: number;
    value: PartialForm<FigureFormProps>;
    error: Error<FigureFormProps> | undefined;
    onChange: (value: PartialForm<FigureFormProps>, index: number) => void;
    onRemove: (index: number) => void;
    disabled?: boolean;
}

function FigureInput(props: FigureInputProps) {
    const {
        value,
        onChange,
        onRemove,
        error,
        index,
        disabled: disabledFromProps,
    } = props;

    // FIXME: change enum to string as a hack
    const {
        data,
        loading: figureOptionsLoading,
    } = useQuery<FigureOptionsForEntryFormQuery>(FIGURE_OPTIONS);

    const disabled = disabledFromProps || figureOptionsLoading;

    const onValueChange = useFormObject(index, value, onChange);

    const handleAgeAdd = React.useCallback(() => {
        const uuid = uuidv4();
        const newAge: PartialForm<AgeFormProps> = { uuid };
        onValueChange(
            [...(value.ageJson ?? []), newAge],
            'ageJson' as const,
        );
    }, [onValueChange, value]);

    const {
        onValueChange: onAgeChange,
        onValueRemove: onAgeRemove,
    } = useFormArray('ageJson', value.ageJson ?? [], onValueChange);

    const handleStrataAdd = React.useCallback(() => {
        const uuid = uuidv4();
        const newStrata: PartialForm<StrataFormProps> = { uuid };
        onValueChange(
            [...(value.strataJson ?? []), newStrata],
            'strataJson' as const,
        );
    }, [onValueChange, value]);

    const {
        onValueChange: onStrataChange,
        onValueRemove: onStrataRemove,
    } = useFormArray('strataJson', value.strataJson ?? [], onValueChange);

    return (
        <Section
            heading={`Figure #${index + 1}`}
            subSection
            actions={(
                <>
                    <Button
                        name={undefined}
                        disabled
                    >
                        Clone
                    </Button>
                    <Button
                        name={index}
                        onClick={onRemove}
                        disabled={disabled}
                    >
                        Remove
                    </Button>
                </>
            )}
        >
            {error?.$internal && (
                <NonFieldError>
                    {error?.$internal}
                </NonFieldError>
            )}
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="District(s) *"
                    name="district"
                    value={value.district}
                    onChange={onValueChange}
                    error={error?.fields?.district}
                    disabled={disabled}
                />
                <TextInput
                    label="Town / Village *"
                    name="town"
                    value={value.town}
                    onChange={onValueChange}
                    error={error?.fields?.town}
                    disabled={disabled}
                />
                <NumberInput
                    label="Household Size"
                    name="householdSize"
                    value={value.householdSize}
                    onChange={onValueChange}
                    error={error?.fields?.householdSize}
                    disabled={disabled}
                />
            </div>
            <div className={styles.threeColumnRow}>
                <SelectInput
                    options={data?.quantifierList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Quantifier *"
                    name="quantifier"
                    value={value.quantifier}
                    onChange={onValueChange}
                    error={error?.fields?.quantifier}
                    disabled={disabled}
                />
                <NumberInput
                    label="Reported Figure *"
                    name="reported"
                    value={value.reported}
                    onChange={onValueChange}
                    error={error?.fields?.reported}
                    disabled={disabled}
                />
                <SelectInput
                    options={data?.unitList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Unit *"
                    name="unit"
                    value={value.unit}
                    onChange={onValueChange}
                    error={error?.fields?.unit}
                    disabled={disabled}
                />
            </div>
            <div className={styles.threeColumnRow}>
                <SelectInput
                    options={data?.termList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Term *"
                    name="term"
                    value={value.term}
                    onChange={onValueChange}
                    error={error?.fields?.term}
                    disabled={disabled}
                />
                <SelectInput
                    options={data?.typeList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Figure Type *"
                    name="type"
                    value={value.type}
                    onChange={onValueChange}
                    error={error?.fields?.type}
                    disabled={disabled}
                />
                <SelectInput
                    options={data?.roleList?.enumValues}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Role *"
                    name="role"
                    value={value.role}
                    onChange={onValueChange}
                    error={error?.fields?.role}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <Switch
                    label="Disaggregated Data"
                    name="isDisaggregated"
                    // FIXME: typings of toggle-ui
                    value={value.isDisaggregated}
                    onChange={onValueChange}
                    // error={error?.fields?.isDisaggregated}
                    disabled={disabled}
                />
            </div>
            { value.isDisaggregated && (
                <>
                    <div className={styles.twoColumnRow}>
                        <NumberInput
                            label="Urban displacement"
                            name="displacementUrban"
                            value={value.displacementUrban}
                            onChange={onValueChange}
                            error={error?.fields?.isDisaggregated}
                            disabled={disabled}
                        />
                        <NumberInput
                            label="Rural displacement"
                            name="displacementRural"
                            value={value.displacementRural}
                            onChange={onValueChange}
                            error={error?.fields?.displacementRural}
                            disabled={disabled}
                        />
                    </div>
                    <div className={styles.twoColumnRow}>
                        <NumberInput
                            label="In Camp"
                            name="locationCamp"
                            value={value.locationCamp}
                            onChange={onValueChange}
                            error={error?.fields?.locationCamp}
                            disabled={disabled}
                        />
                        <NumberInput
                            label="Not in Camp"
                            name="locationNonCamp"
                            value={value.locationNonCamp}
                            onChange={onValueChange}
                            error={error?.fields?.locationNonCamp}
                            disabled={disabled}
                        />
                    </div>
                    <div className={styles.twoColumnRow}>
                        <NumberInput
                            label="No. of Male"
                            name="sexMale"
                            value={value.sexMale}
                            onChange={onValueChange}
                            error={error?.fields?.sexMale}
                            disabled={disabled}
                        />
                        <NumberInput
                            label="No. of Female"
                            name="sexFemale"
                            value={value.sexFemale}
                            onChange={onValueChange}
                            error={error?.fields?.sexFemale}
                            disabled={disabled}
                        />
                    </div>
                    <div className={styles.threeColumnRow}>
                        <NumberInput
                            label="Conflict"
                            name="conflict"
                            value={value.conflict}
                            onChange={onValueChange}
                            error={error?.fields?.conflict}
                            disabled={disabled}
                        />
                        <NumberInput
                            label="Political Conflict"
                            name="conflictPolitical"
                            value={value.conflictPolitical}
                            onChange={onValueChange}
                            error={error?.fields?.conflictPolitical}
                            disabled={disabled}
                        />
                        <NumberInput
                            label="Criminal Conflict"
                            name="conflictCriminal"
                            value={value.conflictCriminal}
                            onChange={onValueChange}
                            error={error?.fields?.conflictCriminal}
                            disabled={disabled}
                        />
                    </div>
                    <div className={styles.threeColumnRow}>
                        <NumberInput
                            label="Communal Conflict"
                            name="conflictCommunal"
                            value={value.conflictCommunal}
                            onChange={onValueChange}
                            error={error?.fields?.conflictCommunal}
                            disabled={disabled}
                        />
                        <NumberInput
                            label="Other Conflict"
                            name="conflictOther"
                            value={value.conflictOther}
                            onChange={onValueChange}
                            error={error?.fields?.conflictOther}
                            disabled={disabled}
                        />
                    </div>
                    <div className={styles.block}>
                        <Header
                            size="extraSmall"
                            heading="Age"
                            actions={(
                                <Button
                                    name={undefined}
                                    className={styles.addButton}
                                    onClick={handleAgeAdd}
                                    disabled={disabled}
                                >
                                    Add Age
                                </Button>
                            )}
                        />
                        {error?.fields?.ageJson?.$internal && (
                            <p>
                                {error?.fields?.ageJson?.$internal}
                            </p>
                        )}
                        {value?.ageJson?.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by age yet
                            </div>
                        ) : value?.ageJson?.map((age, i) => (
                            <AgeInput
                                key={age.uuid}
                                index={i}
                                value={age}
                                onChange={onAgeChange}
                                onRemove={onAgeRemove}
                                error={error?.fields?.ageJson?.members?.[age.uuid]}
                                disabled={disabled}
                            />
                        ))}
                    </div>
                    <div className={styles.block}>
                        <Header
                            size="extraSmall"
                            heading="Strata"
                            actions={(
                                <Button
                                    name={undefined}
                                    className={styles.addButton}
                                    onClick={handleStrataAdd}
                                    disabled={disabled}
                                >
                                    Add Strata
                                </Button>
                            )}
                        />
                        {error?.fields?.strataJson?.$internal && (
                            <p>
                                {error?.fields?.strataJson?.$internal}
                            </p>
                        )}
                        {value?.strataJson?.length === 0 ? (
                            <div className={styles.emptyMessage}>
                                No disaggregation by strata yet
                            </div>
                        ) : value?.strataJson?.map((strata, i) => (
                            <StrataInput
                                key={strata.uuid}
                                index={i}
                                value={strata}
                                onChange={onStrataChange}
                                onRemove={onStrataRemove}
                                error={error?.fields?.strataJson?.members?.[strata.uuid]}
                                disabled={disabled}
                            />
                        ))}
                    </div>
                </>
            )}
            <div className={styles.twoColumnRow}>
                <DateInput
                    label="Start date *"
                    name="startDate"
                    value={value.startDate}
                    onChange={onValueChange}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <Switch
                    label="Include in IDU"
                    name="includeIdu"
                    // FIXME: typings of Checkbox
                    value={value.includeIdu}
                    onChange={onValueChange}
                    disabled={disabled}
                />
            </div>
            { value.includeIdu && (
                <div className={styles.row}>
                    <TextArea
                        label="Excerpt for IDU"
                        name="excerptIdu"
                        value={value.excerptIdu}
                        onChange={onValueChange}
                        disabled={disabled}
                    />
                </div>
            )}
        </Section>
    );
}

export default FigureInput;
