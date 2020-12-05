import React, { useContext, useMemo, useReducer } from 'react';

import 'antd/dist/antd.css';
import {
    Typography,
    InputNumber,
    Input, Form, Button, Row, Col, Empty, Card
} from 'antd';


import {
    SearchOutlined
} from '@ant-design/icons'

import { Web3Context } from '../web3State/web3State';
import {FlexOfferCard} from '../MarketView/flexOffer';

import { BuyViewContext, reducer, initialState } from './buyViewState';

const { Title, Text } = Typography;


function LookupFlexOffer() {
    const [offer,setOffer] = useContext(BuyViewContext);
return <Input.Search prefix="#" placeholder="FlexOfferId" onSearch={(val, ev) => {setOffer("update", {selectedOfferId: val})}} />
}


function FlexOfferInfo(){
    const [offer,setOffer] = useContext(BuyViewContext);
    let [web3state, web3dispatch] = useContext(Web3Context);
    let currentOffer = useMemo(() => {
        let selectedOffer = web3state.allFlexOffers[offer.selectedOfferId];
        if(selectedOffer){
            return {...selectedOffer, id: offer.selectedOfferId};
        } else {
            return undefined;
        }
    }, [offer.selectedOfferId]);

    let currentBids = useMemo(() => {
        return web3state.allFlexOfferBids[currentOffer?.id] ?? [];
    }, [offer.selectedOfferId, web3state.currentBlockNumber]);

    if(currentOffer){
        return <FlexOfferCard offer={currentOffer} bids={currentBids} />
    } else {
        return <Card><Empty description="No FlexOffer Selected" image={Empty.PRESENTED_IMAGE_SIMPLE}/></Card>
    }
}

let BuyInterface = () =>{
    const [offer,setOffer] = useContext(BuyViewContext);
    let [web3state, dispatch] = useContext(Web3Context);

    let lastBidAmount = useMemo(() => {
        let bids = web3state.allFlexOfferBids[offer.selectedOfferId] ?? [];
        let lastBid = bids.slice(-1).pop();
        return lastBid?.amount ?? 0;
    }, [web3state.allFlexOfferBids[offer.selectedOfferId] ?? []])

    let [bidForm] = Form.useForm();
    let [controlForm] = Form.useForm();
    
    let onBidFinish = _ =>{
        let call = web3state.contract.methods.BidForFlexOffer(offer.selectedOfferId);
        console.log(web3state.user)
        call.send({
            value: offer.bidAmount,
            from: web3state.user.address
        });
    }

    let onMachineTurnOn = _ => {
        console.log("Turned on machine. ")

        let call = web3state.contract.methods.ActivateFlexOffer(offer.selectedOfferId);
        call.send({from: web3state.user.address});
    }

    return <><Form form={bidForm} onFinish={onBidFinish}>
                <Title level={5}>Bid for Offer:</Title>
                <Form.Item >
                        <InputNumber onChange={(val, __) => setOffer("update", {bidAmount: val})}/> Wei
                </Form.Item>
                <Form.Item >
                    <Button type="primary" htmlType="submit">Place</Button>
                </Form.Item>
            </Form>
            <Form form={controlForm} onFinish={onMachineTurnOn}>
                <Title level={5}>Turn on machine:</Title>
                <Form.Item >
                    <Button type="primary">Turn On</Button>
                </Form.Item>
            </Form></>
}

function BuyView() {
    let [web3state, dispatch] = useContext(Web3Context);
    const [offer,offerdispatch] = useReducer(reducer,initialState);
    const setOffer = (type, payload) => {offerdispatch({type:type, payload:payload})};

    let input_row = <Row gutter={16}><Col span={4}>
            <LookupFlexOffer />    
        </Col></Row>

    return <BuyViewContext.Provider value={[offer, setOffer]}>
        <Row gutter={16}>
            <Col span={4}>
                <LookupFlexOffer />    
            </Col>
        </Row>

        <Row gutter={16} style={{marginTop: 30}}>
            <Col span={8}>
                <FlexOfferInfo />
            </Col>
            <Col span={12}>
                <BuyInterface />
            </Col>
        </Row>
        
    </BuyViewContext.Provider>
}


export { BuyView };