import React, { useState, useEffect, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import 'antd/dist/antd.css';
import { Table } from 'antd';

import { 
        selectDataSource
    ,   removeEntry } from './offersSlice';

import { Web3Context } from '../../App';

function Offers() {
    const dataSource = useSelector(selectDataSource);
    const dispatch = useDispatch();

    const web3 = useContext(Web3Context);

    const [noBlocks, setNoBlocks] = useState(0);

    const [eventSub, setEventSub]  = useState(
        web3.eth.subscribe("newBlockHeaders", (_: any, data: any) => {setNoBlocks(noBlocks+1); console.log(data)})
    );
    const columns = [
        {
            title: 'Offer-ID',
            dataIndex: 'offerId',
            key: 'offerId'
        },
        {
            title: 'Bidder Address',
            dataIndex: 'bidderAddress',
            key: 'bidderAddress',
        },
        {
            title: 'Foobar',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: Number) => `$ ${amount}`,
        },
        {
            title: 'Actions',
            dataIndex: 'key',
            key: 'edit',
            render: (key: string) => <a onClick={() => dispatch(removeEntry(key))}>Delete</a>
        }
    ]
    
    return (<><p>{noBlocks}</p><Table columns={columns} dataSource={dataSource} /></>);
}



export { Offers };