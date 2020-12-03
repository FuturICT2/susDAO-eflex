import React, { useContext, useMemo } from 'react';

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
    Popover
} from 'antd';

import {
    ArrowUpOutlined,
    CheckCircleOutlined,
    CheckCircleFilled,
    CloseCircleOutlined,
} from '@ant-design/icons'

import { Web3Context } from '../web3State/web3State';


const { Title, Text } = Typography;
const { Countdown } = Statistic;

let OfferData = ({data}) => {
    let data_display = Object.keys(data).map((key, i) => {
        return <p><Text code>{key}</Text> : {data[key]}</p>
    });

    const deadline = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 30;

    return <>
                <Countdown title="Time until Start" value={deadline} />
                <Statistic
                    title="Bidding price"
                    value={11.28}
                    precision={2}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<ArrowUpOutlined />}
                    suffix="Ξ"
                />
                </>
}


let BidList = ({data})=>{
    let bids = data ?? [];
    bids = bids.map((bid) => {
        return {
            ...bid,
            author_short: bid.author.slice(0, 4) + ".." + bid.author.slice(-2),
            key: bid.author + "__" + String(bid.amount)
        }
    });
 
    return <Timeline mode={"left"}>
        {
            bids.reverse().slice(0, 5).map((bid, i) =>{
                let is_best = i == 0;
                let color = is_best ? 'green' : 'blue';
                let icon = is_best ? <CheckCircleFilled /> : <CloseCircleOutlined />;
                let author_label = <Popover content={<div><p>{bid.author}</p></div>} >{bid.author_short}</Popover>
                let item = <Timeline.Item label={bid.amount} color={color} dot={icon} key={bid.key}>{author_label}</Timeline.Item>
                return item;
            })
        }
    </Timeline>
}

let FlexOffer = ({offer, bids}) => {
    let title = <Row gutter={16}>
                    <Col span={12}>{offer.id}</Col>
                    <Col span={12} >Status: <Tag color="green">Sold</Tag></Col>
                </Row>
    return <Card title={title}>
                <Row gutter={16}>
                    <Col span={12}>
                        <OfferData data={offer} />
                    </Col>
                    <Col span={12}>
                        <BidList data={bids} />
                    </Col>
                </Row>
                
                
            </Card>
}

function Statistics(){
    let [web3state, dispatch] = useContext(Web3Context);


    let totalFlexTokens = useMemo(() => 299309);
    let totalFlexOffers = useMemo(() => 234);
    let totalEthOnContract = useMemo(() => 200);
    let ethPerToken = useMemo(() => totalEthOnContract / totalFlexTokens, [totalEthOnContract, totalFlexTokens]);

    return <Row gutter={16}>
        <Col span={8}>
            <Statistic title="Total FlexOffers" value={totalFlexOffers} />
        </Col>
        <Col span={8}>
            <Statistic title="Total FlexToken" value={totalFlexTokens} />
        </Col>
        <Col span={8}>
            <Statistic title="Eth per FlexToken" value={ethPerToken} />
        </Col>
        <Col span={8}>
            <Statistic title="Total Eth on Contract" value={totalEthOnContract} />
        </Col>
    </Row>
}

function MarketView(){
    let [web3state, dispatch] = useContext(Web3Context);

    let allFlexOffers = useMemo(() => {
        let data = [];
        let offer_entries =  Object.entries(web3state.allFlexOffers).reverse().slice(0, 40);
        for(var [key, value] of offer_entries){
            data.push({
                id: key,
                ...value
            });
        }


        let renderOffer = (offer) =>{
            let bids = web3state.allFlexOfferBids[offer.id];
            return <List.Item><FlexOffer offer={offer} bids={bids} /></List.Item>;
        };

        return <List 
            grid={{
                gutter: 32,
                column: 3
            }}
            dataSource={data}
            renderItem={renderOffer}
        />
    }, [web3state.allFlexOffers, web3state.allFlexOfferBids]);

    return <>
    <Title level={1}>Market</Title>
    <Statistics />
    {
        allFlexOffers    
    }
    
    
    </>
}


export { MarketView };