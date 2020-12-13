import {
    PageHeader, Typography
} from 'antd';
import 'antd/dist/antd.css';
import React, { useReducer, useContext } from 'react';
import { Web3Context } from '../web3State/web3State';
import { MarketHeader } from './marketHeader';
import { initialState, MarketContext, reducer } from './marketState';
import { RecentOffers } from './recentOffers';

function MarketView(){
    let [web3state, web3stateDispatcher] = useContext(Web3Context);
    let [marketState, marketDispatcher] = useReducer(reducer, initialState);
    let betterDispatcher = (type, payload) => {marketDispatcher({type:type, payload:payload})};
    return web3state.connected ? <MarketContext.Provider value={[marketState, betterDispatcher]} >
        <MarketHeader />
        <br /><br />
        <RecentOffers />
    </MarketContext.Provider> : <></>;
}


export { MarketView };
