import React, { useContext } from 'react';

import 'antd/dist/antd.css';
import {
    Typography
} from 'antd';

import { Web3Context } from '../web3State/web3State';

const { Title } = Typography;


function BuyView() {
    let [web3state, dispatch] = useContext(Web3Context);
    return <Title level={1}>Buy</Title>
}


export { BuyView };