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
import Flex_Offer from '../../artifacts/Flex_Offer.json';

function Offers() {
    const dataSource = useSelector(selectDataSource);
    const dispatch = useDispatch();
    const web3 = useContext(Web3Context);
    const [noBlocks, setNoBlocks] = useState(0);
    const [eventSub, setEventSub]  = useState(
        web3.eth.subscribe("newBlockHeaders", (_: any, data: any) => {setNoBlocks(noBlocks+1); console.log(data)})
    );

    const [account, setAccount] = useState([]);
    const [contract, setContract] = useState([]);

    // function getFlex<K extends keyof typeof Flex_Offer.networks>(position: K) {
    // return Flex_Offer.networks[position]
    // }
    useEffect( ()=> {
      const init =async()=>{
        try{
            const account = await web3.eth.getAccounts();
            setAccount(account);
            const networkId = await web3.eth.net.getId();
            const contractData = Flex_Offer.networks[5777];
            const flexOffer = new web3.eth.Contract(Flex_Offer.abi,contractData.address);
            console.log(account);
            setContract(flexOffer);
            console.log(flexOffer);
            await flexOffer.methods.balanceOf(account[0]).call().then((res:number)=>console.log(res));
            const flex_token_id = await flexOffer.methods.tokenOfOwnerByIndex(account[0],0).call();
            console.log(flex_token_id);
            flexOffer.methods.flex_offers_mapping(flex_token_id).call().then((res:any)=>console.log(res));
            await flexOffer.events.flex_offer_minted({fromBlock: 0}, function(error:string, event:any){ console.log(event); });
        }catch(error){
          console.log(error);
        }
      }
      init();
    },[web3]);

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
      if(Object.keys(contract).length>0){
        const start = 1605006000000;
        const end = 1605027600000;
        const power = 10;
        const duration = 9000000;
        // console.log(contract);
        await contract.methods.mint_flex_offer_to(power,duration,start,end).send({from:account});
      }
    }

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

    if (typeof account !== 'undefined' && typeof contract !== 'undefined'){
    return (<div>
      <Space direction="vertical" size={18}>
      <nav>Welcome: {account}, you are on the block number {noBlocks} </nav>
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
