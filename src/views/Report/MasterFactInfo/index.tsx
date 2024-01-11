import React from 'react';
import Container from '#components/Container';
import {
    Figure_Category_Types as FigureCategoryTypes,
} from '#generated/types';

interface Entity {
    id: string;
    name: string;
}
interface Country {
    id: string;
    idmcShortName: string;
}

interface MasterFactInfoProps {
    className?: string;
    totalFigures: number | null | undefined;
    roles: string[] | null | undefined;
    countries: Country[] | null | undefined;
    categories: FigureCategoryTypes[] | null | undefined;
    tags: Entity[] | null | undefined;
}

function MasterFactInfo(props: MasterFactInfoProps) {
    const {
        className,
        totalFigures,
        roles,
        countries,
        categories,
        tags,
    } = props;

    return (
        <Container
            className={className}
            heading="Masterfact"
            footerContent="This report was migrated from masterfacts."
        >
            <div>
                {`Figure: ${totalFigures}`}
            </div>
            <div>
                {`Role: ${roles?.join(', ')}`}
            </div>
            <div>
                {`Country: ${countries?.map((item) => item.idmcShortName).join(', ')}`}
            </div>
            <div>
                {`Type: ${categories?.join(', ')}`}
            </div>
            <div>
                {`Tags: ${tags?.map((item) => item.name).join(', ')}`}
            </div>
        </Container>
    );
}

export default MasterFactInfo;
