import React from 'react';

interface TabProps {
    children: React.ReactNode;
}

const tabContext = React.createContext({
    activeTab: undefined,
    setActiveTab: () => { console.warn('setActiveTab called before it was initialized'); },
});

function TabSwitch(props) {
    const {
        activeTab,
        setActiveTab,
    } = React.useContext(tabContext);

    return (
    );
}

function Tab(props: TabProps) {
    const [activeTab, setActiveTab] = React.useState(undefined);
    const { children } = props;

    const contextValue = React.useMemo(() => ({
        activeTab,
        setActiveTab,
    }), [activeTab, setActiveTab]);

    return (
        <tabContext.Provider value={contextValue}>
            { children }
        </tabContext.Provider>
    );
}

export default Tab;
