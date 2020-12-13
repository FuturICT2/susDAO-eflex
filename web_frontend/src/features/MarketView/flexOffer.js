import {
    Card,
    Col,
    Popover, Row, Statistic, Tag,
    Timeline, Typography
} from 'antd';
import 'antd/dist/antd.css';
import moment from 'moment';
import React, { useContext, useMemo } from 'react';
import { Web3Context } from '../web3State/web3State';
import { MarketContext } from './marketState';




const {Text } = Typography;
const { Countdown } = Statistic;


let BidList = ({data, flexOfferId = null})=>{
    let [marketState, marketDispatch] = useContext(MarketContext);
    let bids = data ?? [];
    bids = bids.map((bid) => {
        return {
            ...bid,
            author_short: bid.author.slice(0,4) + ".." + bid.author.slice(-2),
            key: bid.author + "__" + String(bid.amount) + flexOfferId
        }
    });
    bids.sort((lbid, rbid) => +(rbid.amount)- +(lbid.amount));
    bids = bids.slice(0, marketState.bidsPerOfferShown);
    return <>
        <p>Bids</p>{
        bids.map((bid, i)=>{
            let tag = <Tag color = {i==0?'green' : 'red'} style={{marginBottom: 10}}>{bid.amount}</Tag>
            return <Popover id={bid.key} content={<><Text strong>Source:</Text><Text>{bid.author}</Text></>} >{tag}</Popover>
        })
    }</>
}

let PhaseList = ({offer}) => {
    let [web3state, web3dispatch] = useContext(Web3Context);


    let [status, deadline] = useMemo(() => {
        let currentTime = moment.unix(web3state.lastUpdateTimestamp);
        let offerStartTime = moment.unix(+offer.start_time);
        let offerEndTime =  moment.unix(+offer.end_time);
        let sellingDeadline = offerStartTime - 10000; // 10 Seconds
        if(currentTime < sellingDeadline){
            return [0, sellingDeadline];
        }else if (currentTime < offerStartTime){
            return [1, offerStartTime];
        } else if (currentTime < offerEndTime){
            return [2, offerEndTime];
        } else {
            return [3, 0];
        }
    }, [web3state.lastUpdateTimestamp]);
    return <Timeline>{
        [0, 1, 2, 3].map(i => {
            let color = status < i ? "blue" : (status == i ? "green" : "black");
            let clock = status == i && i != 3 ? <Countdown value={deadline} /> : ""
            let label = ["Selling", "Pause", "Active", "Expired"][i];
            return <Timeline.Item color={color} key={offer.id + "_" + label}>{label}{clock}</Timeline.Item>
        })}
    </Timeline>
}

let FlexOfferCard = ({offer, bids}) => {
    let [web3state, web3dispatch] = useContext(Web3Context);
    let [owner, owner_short] = [offer.og_owner, offer.og_owner.slice(0, 4) + "..." +offer.og_owner.slice(-3)]
    let title = <Row gutter={16}>
                    <Col span={8}><Text strong>OfferID: </Text>#{offer.id}</Col>
                    <Col span={8} ><Popover content={owner}><Text strong>Author:</Text> {owner_short}</Popover></Col>
                </Row>
    return <Card title={title} >
                <Row gutter={16}>
                    <Col span={12}>
                        <PhaseList offer={offer}/>
                    </Col>
                    <Col span={12}>
                        <BidList data={bids} flexOfferId={offer.id}/>
                    </Col>
                </Row>
            </Card>
}

export { FlexOfferCard };
