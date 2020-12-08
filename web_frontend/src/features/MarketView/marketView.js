import {
    PageHeader
} from 'antd';
import 'antd/dist/antd.css';
import React, { useReducer } from 'react';
import { MarketHeader } from './marketHeader';
import { initialState, MarketContext, reducer } from './marketState';
import { RecentOffers } from './recentOffers';

function MarketView(){
    let [marketState, marketDispatcher] = useReducer(reducer, initialState);
    let betterDispatcher = (type, payload) => {marketDispatcher({type:type, payload:payload})};
    return <MarketContext.Provider value={[marketState, betterDispatcher]} >
        <MarketHeader />
        <PageHeader title="Recent Offers" />
        <RecentOffers />
    </MarketContext.Provider>
}


export { MarketView };
