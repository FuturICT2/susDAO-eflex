import {
    List, Card
} from 'antd';
import 'antd/dist/antd.css';
import React, { useContext, useMemo } from 'react';
import { Web3Context } from '../web3State/web3State';
import { FlexOfferCard } from './flexOffer';
import { MarketContext } from './marketState';


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

    let grid = {
        gutter: 32,
        xs: 1,
        sm: 1,
        md: 1,
        lg: 2,
        xl: 2,
        xxl: 3
    }
    let loadingList = <List
        grid={grid}
        dataSource={[1, 2, 3]}
        renderItem={(i) => <List.Item key={i} ><Card loading={true} ></Card></List.Item>} />
    
    let loadedList = <List 
        grid={grid}
        dataSource={flexOffersPerpared}
        renderItem={(offer) => <OfferItem offer={offer} bids={web3state.allFlexOfferBids[offer.id]}/>}
    />
    return web3state.isLoaded ? loadedList : loadingList;
}


export { RecentOffers };
