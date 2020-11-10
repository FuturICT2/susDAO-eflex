import React, { useState, useEffect, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import 'antd/dist/antd.css';
import { Table, DatePicker, Space ,Button,Input, Col, Row, Select } from 'antd';
import moment from 'moment';
// import moment from "moment";

import {
        selectDataSource
    ,   removeEntry } from './offersSlice';

import { Web3Context } from '../../App';
// load smart contract
import Flex_Offer from '../../artifacts/Flex_Offer.json';

function Offers() {
    const dataSource = useSelector(selectDataSource);
    const dispatch = useDispatch();
    const web3 = useContext(Web3Context);

    // useEffect( ()=> {
    //   const account =  await web3.eth.getAccounts();
    //   const networkID = await web3.eth.net.getId();
    //   const flexOffer = new web3.eth.Contract(Flex_Offer.abi,contractData.address);
    //   console.log(account,networkID,flexOffer);
    // })

    const [account,setAccount] = useState(null);
    // web3.eth.getAccounts().then((acc:any)=>console.log(acc));
    // const {networkId, networkName, providerName } = web3;
    // console.log(networkId, networkName, providerName);
    // console.log(web3.eth.getAccounts());
    const contractData = Flex_Offer.networks[5777];
    const flexOffer = new web3.eth.Contract(Flex_Offer.abi,contractData.address);
    console.log(flexOffer,web3.eth.defaultAccount);

    const sendoffer =()=>{
    const start = 1605006000000;
    const end = 1605027600000;
    const power = 10;
    const duration = 9000000;
    flexOffer.methods.mint_flex_offer_to(power,duration,start,end).send({from:'0xbDC8b0B5A00b6a82438fcFFBB879d65DAbDCA64e'});
    }
    flexOffer.events.flex_offer_minted({fromBlock: 0}, function(error:string, event:any){ console.log(event); });

    const [noBlocks, setNoBlocks] = useState(0);
    const [eventSub, setEventSub]  = useState(
        web3.eth.subscribe("newBlockHeaders", (_: any, data: any) => {setNoBlocks(noBlocks+1); console.log(data)})
    );
    function disabledDate(current:any) {
  // Can not select days before today and today
    return current < moment().startOf('day');
    }
    function range(start:number, end:number) {
      const result = [];
      for (let i = start; i < end; i++) {
        result.push(i);
      }
      return result;
    }
    // function diableTime(){
    //   let now = moment();
    //   let now1h = moment(now).add(1, 'hours');
    //   return {
    //     disabledHours: () => range(0,now1h.hour())
    //     };
    // }
    const { RangePicker } = DatePicker;
    const { Option } = Select;

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
            // render: (key: string) => <a onClick={() => dispatch(removeEntry(key))}>Delete</a>
            render: (key: string) => <a onClick={() => { if(window.confirm('Do you want to abort this offer?')) dispatch(removeEntry(key))  } }>Delete</a>
        }
    ]

    return (<div>
      <Space direction="vertical" size={18}>
      <nav>Block number {noBlocks} </nav>
      <h3>Make a new offer</h3>
      <Space direction="horizontal" size={10}>
      <Input.Group compact>
      <Input style={{ width: '50%' }} allowClear placeholder="Power"/>
      <Select defaultValue="W">
        <Option value="W">W</Option>
        <Option value="kW">kW</Option>
      </Select>
      </Input.Group>

      <Input.Group compact>
      <Input style={{ width: '55%' }} allowClear placeholder="hours" addonBefore = 'Duration: ' addonAfter = 'h'/>
      <Input style={{ width: '40%' }} allowClear placeholder="minutes" addonAfter = 'm'/>
      </Input.Group>
      <RangePicker
        disabledDate={disabledDate}
        showTime={{ format: 'HH:mm' }}
        format="YYYY-MM-DD HH:mm"
      />
      <Button type="primary" onClick = {sendoffer}>Create an offer</Button>
      </Space>

      <Table columns={columns} dataSource={dataSource}  title={() => 'Your current offers'}/>
      </Space>
      </div>);
}

export { Offers };
