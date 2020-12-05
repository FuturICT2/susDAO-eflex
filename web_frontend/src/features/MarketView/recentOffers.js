import React, { useContext, useMemo } from 'react';
import moment from 'moment';

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
import { MarketContext } from './marketState'

import { FlexOfferCard } from './flexOffer';

const { Title, Text } = Typography;
const { Countdown } = Statistic;


let OfferItem = ({offer, bids}) => {
    return <List.Item><FlexOfferCard offer={offer} bids={bids} /></List.Item>;
}
let RecentOffers = () =>{
    let [web3state, web3dispatch] = useContext(Web3Context);
    let [marketState, marketDispatch] = useContext(MarketContext);
    let flexOffersPerpared = useMemo(() =>{

        let data = [];
        let offer_entries =  Object.entries(web3state.allFlexOffers);
        offer_entries.sort(([lkey, lv], [rkey,rv]) => rkey - lkey);
        offer_entries = offer_entries.slice(0, marketState.offersShown);
        for(var [key, value] of offer_entries){
            data.push({
                id: key,
                ...value
            });
        }
        return data;
    }, [web3state.allFlexOffers, marketState.offersShown])
    return <List 
        grid={{
            gutter: 32,
            column: 3
        }}
        dataSource={flexOffersPerpared}
        renderItem={(offer) => <OfferItem offer={offer} bids={web3state.allFlexOfferBids[offer.id]}/>}
    />
}


export { RecentOffers };