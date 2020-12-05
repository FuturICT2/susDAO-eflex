import React, { useContext, useMemo, useReducer } from 'react';

import 'antd/dist/antd.css';
import {
    Typography,
    Card,
    List,
    Tag,
    Statistic,
    Row,
    Col,
    Table,
    Timeline,
    Popover,
    PageHeader
} from 'antd';

import {
    ArrowUpOutlined,
    CheckCircleOutlined,
    CheckCircleFilled,
    CloseCircleOutlined,
} from '@ant-design/icons'

import { Web3Context } from '../web3State/web3State';
import { MarketHeader } from './marketHeader';
import { RecentOffers } from './recentOffers';
import { MarketContext, initialState, reducer } from './marketState';

const { Title, Text } = Typography;
const { Countdown } = Statistic;

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