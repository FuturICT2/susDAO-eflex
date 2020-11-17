import React, { useState, useEffect, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import 'antd/dist/antd.css';
import { Table, DatePicker, Space ,Button,Input, Select } from 'antd';
import moment from 'moment';
// import moment from "moment";

import {
        selectDataSource
    ,   removeEntry } from './offersSlice';

import { Web3Context } from '../../App';
// load smart contract

function Offers() {
  const dataSource = useSelector(selectDataSource);
  const dispatch = useDispatch();
  const {
    account,
    contract
  } = useContext(Web3Context);
  console.log('in offers');
  useEffect(() => {
    const init = async () => {
      try {
        await contract.methods.balanceOf(account).call().then((res) => console.log(res));
        let flex_token_id = await contract.methods.tokenOfOwnerByIndex(account, 0).call();
        console.log(flex_token_id);
        contract.methods.flex_offers_mapping(flex_token_id).call().then((res) => console.log(res));
        await contract.events.flex_offer_minted({
          fromBlock: 0
        }, function(error, event) {
          console.log(event);
        });

      } catch (error) {
        console.log(error);
      }
    }
    init();
  }, [account, contract]);

  //   useEffect(() => {
  //   async function listenMMAccount() {
  //     window.ethereum.on("accountsChanged", async function() {
  //       const accounts = await web3.eth.getAccounts();
  //       setAccount(accounts);
  //       console.log(accounts);
  //     });
  //   }
  //   listenMMAccount();
  // }, []);
    const sendoffer =()=>{
//      if(typeof contract !=='undefined'){
        const start = 1605006000000;
        const end = 1605027600000;
        const power = 10;
        const duration = 9000000;
        console.log(account,contract);
        contract.methods.mint_flex_offer_to(power,duration,start,end).send({from:account});
//      }
    }

    function disabledDate(current) {
  // Can not select days before today and today
    return current < moment().startOf('day');
    }
    function range(start, end) {
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
            render: (amount) => `$ ${amount}`,
        },
        {
            title: 'Actions',
            dataIndex: 'key',
            key: 'edit',
            // render: (key: string) => <a onClick={() => dispatch(removeEntry(key))}>Delete</a>
            render: (key) => <a onClick={() => { if(window.confirm('Do you want to abort this offer?')) dispatch(removeEntry(key))  } }>Delete</a>
        }
    ]

    if (account ){
    return (<div>
      <Space direction="vertical" size={18}>
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
    }else{
      return (<div>Loading...</div>);
    }
}

export { Offers };
