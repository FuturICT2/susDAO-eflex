import React, { useContext, useMemo } from 'react';

import 'antd/dist/antd.css';
import {
    Typography,
    Card,
    List,
    Tag,
    Statistic,
    Row,
    Col
} from 'antd';

import {
    ArrowUpOutlined
} from '@ant-design/icons'

import { Web3Context } from '../web3State/web3State';


const { Title, Text } = Typography;
const { Countdown } = Statistic;



let renderOfferData = offer => {
    let data = Object.keys(offer).map((key, i) => {
        return <p><Text code>{key}</Text> : {offer[key]}</p>
    });

    const deadline = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 30;

    return <Row gutter={16}>
        <Col span={12}>
            <Countdown title="Time until Start" value={deadline} />
        </Col>
        <Col span={12}>
            <Statistic
                title="Bidding price"
                value={11.28}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
                prefix={<ArrowUpOutlined />}
                suffix="Ξ"
            />
        </Col>
    </Row>
}

function MarketView(){
    let [web3state, dispatch] = useContext(Web3Context);

    let allFlexOffers = useMemo(() => {
        let data = [];
        for(var [key, value] of Object.entries(web3state.allFlexOffers)){
            data.push({
                id: key,
                ...value
            });
        }
        let renderOffer = (offer) =>{
            let title = <Row gutter={16}>
                <Col span={8}>{`...${String(offer.id).slice(-5)}`}</Col>
                <Col span={8} ><Tag color="green">Sold</Tag></Col>
            </Row>
            return <List.Item>
                <Card title={title}>{renderOfferData(offer)}</Card>
            </List.Item>
        };

        return <List 
            grid={{
                gutter: 32,
                column: 4
            }}
            dataSource={data}
            renderItem={renderOffer}
        />
    }, [web3state.allFlexOffers]);

    return <>
    <Title level={1}>Market</Title>
    {
        allFlexOffers    
    }
    
    
    </>
}


export { MarketView };