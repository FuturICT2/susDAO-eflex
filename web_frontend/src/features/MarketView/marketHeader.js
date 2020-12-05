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


const { Title, Text } = Typography;
const { Countdown } = Statistic;

function MarketHeader(){
    let [web3state, dispatch] = useContext(Web3Context);
    let stats = useMemo(() => {
        let totalFlexTokens = web3state.totalPoints;
        let totalFlexOffers = web3state.totalOffers;
        let totalGWeiOnContract = web3state.totalEth;
        let gweiPerToken = totalFlexTokens > 0 ? Math.floor(totalGWeiOnContract / totalFlexTokens) : 0;

        let statsty = {margin: '0 32px'}
        return <Row>
            <Statistic title="Offers" value={totalFlexOffers} style={statsty} />
            <Statistic title="Points" value={totalFlexTokens} style={statsty} />
            <Statistic title="Pool" value={totalGWeiOnContract} suffix="Wei" style={statsty} />
            <Statistic title="Point Price" value={gweiPerToken} suffix="Wei" style={statsty} />
        </Row>
    }, [web3state.totalPoints, web3state.totalOffers, web3state.totalEth]); // TODO: make more precise


    return <PageHeader onBack={null} title="Stats" subTitle="Hello">{stats}</PageHeader>
   
}


export { MarketHeader };