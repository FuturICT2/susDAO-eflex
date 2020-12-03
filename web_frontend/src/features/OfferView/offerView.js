import React, { useContext, useState , useReducer, useEffect} from 'react';
import moment from 'moment';
import 'antd/dist/antd.css';
import {
    Typography,
    Form,
    Input,
    Button,
    Radio,
    Select,
    DatePicker,
    InputNumber,
    Space,
    Tooltip,
    Modal,
    Table,
} from 'antd';

import { Web3Context } from '../web3State/web3State';
import {WashMachine} from './washingMachine';

const { Title } = Typography;

const initialOffer = {
  power: null,
  unit: 'W',
  runh: null,
  runm: null,
  start_time: 0,
  end_time: 0,
}

function reducer(state,action){
  let reducers = {
    setPower: (power)=>{
      return {...state, power: +power}
    },
    setUnit: (unit)=>{
      switch (unit){
        case 'W':
          return {...state, unit: 'W'};
        case 'kW':
          return {...state, unit: 'kW'};
      }
    },
    setHours: (hours)=>{
      return {...state,runh: +hours}
    },
    setMinutes: (minutes)=>{
      return {...state,runm: +minutes}
    },
    setDuration: (duration)=>{
      return {...state, start_time: duration[0], end_time:duration[1]}
    },
    reset: ()=>{
      return initialOffer
    }
  }
  let reducer = reducers[action.type] || (() => { console.error("unknown action type '" + String(action.type) + "'"); return state });
  return reducer(action.payload);
}


const columns = [
  {
    title: 'Offer-ID',
    dataIndex: 'offerId',
    key: 'offerId',
    ellipsis: true,
    // width: '20%'
  },
  {
    title: 'Power',
    dataIndex: 'power',
    key: 'power'
  },
  {
    title: 'Duration',
    dataIndex: 'duration',
    key: 'duration'
  },
  {
    title: 'Start Time',
    dataIndex: 'start_time',
    key: 'start_time'
  },
  {
    title: 'End Time',
    dataIndex: 'end_time',
    key: 'end_time'
  },
  {
    title: 'Current bidding price',
    dataIndex: 'bidprice',
    key: 'bidprice',
  }
]

function OfferView() {
    let [web3state, dispatch] = useContext(Web3Context);
    const contract = web3state.contract;

    // funcitons for creating flexoffers
    const [offer,offerdispatch] = useReducer(reducer,initialOffer);
    const setOffer = (type, payload) => {offerdispatch({type:type, payload:payload})};
    // flex offers of the user
    const [currentOffers,updateOffers] = useState([]);
    // either connected or not
    let loggedin = (web3state.user?.address && contract);

    // time buffer
    const tfinminutes = 1;
    const getNewOffer = (offerinfo)=>{
      let hours = Math.floor(offerinfo[2] / 3600);
      let minutes = Math.floor(offerinfo[2] % 3600 / 60);
      let offerData = {
        offerId: offerinfo['flexId'],
        power: offerinfo[1]/1000+' kW',
        duration: hours+' h '+minutes+' m',
        start_time: moment.unix(offerinfo[3]).format("YYYY-MM-DD hh:mm"),
        end_time: moment.unix(offerinfo[4]).format("YYYY-MM-DD hh:mm"),
        bidprice: offerinfo[5],
      };
      return offerData;
    }
    useEffect(() => {
      const init = async () => {
        if(loggedin){
          const account = web3state.user.address;
          // const nflex = await contract.methods.balanceOf(account).call();
          const nflex = await contract.methods.GetMyTotMintedFlexOffers(account).call();
          let offerDataAll = [];
          for (let i = 0; i < nflex; i++) {
            // let flex_token_id = await contract.methods.tokenOfOwnerByIndex(account, i).call();
            let flex_token_id = await contract.methods.GetMyFlexOffer(account,i).call();
            let offerinfo = await contract.methods.flex_offers_mapping(flex_token_id).call();
            // console.log(offerinfo);
            offerinfo['flexId'] = flex_token_id;
            let offerData = getNewOffer(offerinfo);
            offerDataAll.unshift(offerData);
          }
          updateOffers(offerDataAll);
        }else{
          updateOffers([]);
        }
      }
  init();
}, [web3state.user, web3state.contract]);

    function disabledDate(current) {
    // Can not select days before today
    return current < moment().startOf('day');
    }
    const onChangeDate =(value, dateString)=>{
      if (value){
        let mom1 = value[0];
        let mom2 = value[1];
        let now = moment();
        let now15m = moment(now).add(15, 'minutes');
        if(mom2<now15m){
          window.alert('The end time should be set to more than 15 minutes later from now')
        }else if (mom1<now15m&&mom2>now15m){
          window.alert('The starting time should be set to more than 15 minutes later from now')
          setOffer('setDuration',[now15m.unix(),mom2.unix()]);
        }else{
          setOffer('setDuration',[mom1.unix(),mom2.unix()]);
        }
      }else{
        setOffer('setDuration',[0,0]);
      }
    }

    const createOffer = ()=>{
        console.log("Address: ", contract.options.address)
      let pass = false;
      if (!offer.power){
        window.alert('Please provide the power of your machine')
      }else if(!offer.runh && !offer.runm){
        window.alert('Please provide the operation time of the machine')
      }else if(!offer.start_time && !offer.end_time){
        window.alert('Please provide the duration of the flex offer')
      }else {
        let now = moment();
        let now15m = moment(now).add(tfinminutes, 'minutes').unix();
        if(offer.end_time<now15m || offer.start_time<now15m){
          window.alert('The duration of the flex offer should be set to more than 15 minutes later from now')
        }else{
          const duration = 3600*offer.runh+60*offer.runm;
          if (duration> offer.end_time - offer.start_time -tfinminutes*60){
            window.alert('The operating time should be at least 15 minutes larger than the flexoffer duration')
          }else{
            let powerinW=offer.power;
            if(offer.unit ==='kW'){
              powerinW = powerinW*1000;
            }
            contract.methods.mint_flex_offer_to(powerinW,duration,offer.start_time,offer.end_time).send({from:web3state.user.address}).then(
              contract.events.flexOfferMinted(function(error, result){
                  if (!error){
					          let flex_token_id = result.returnValues[0];
                    contract.methods.flex_offers_mapping(flex_token_id).call().then( (offerinfo)=>{
                      if (web3state.user.address.toUpperCase()===offerinfo[0].toUpperCase()){
                        offerinfo['flexId'] = flex_token_id;
                        let offerData = getNewOffer(offerinfo);
                        updateOffers([offerData,...currentOffers]);
                      }
                    })
                  }else{
                    console.log(error);
                  }
                })
            );
            setOffer('reset',[]);
          }
        }
      }
    }

    const { RangePicker } = DatePicker;
    const { Option } = Select;
    return <div>
    <Title level={1}>Offer</Title>
    <WashMachine />
    <br/><br/>
    <Form
        labelCol={{
          span: 4,
        }}
        wrapperCol={{
          span: 14,
        }}
        layout="horizontal"
        initialValues={{
          size: 'large',
        }}
      >
        <Form.Item label="Power">
          <Input.Group compact>
            <InputNumber min="0" value = {offer.power} style={{ width: '40%' }} allowClear placeholder="Power"
            onChange = {(value)=>setOffer('setPower',value)}/>
            <Select value={offer.unit} onChange = {(value)=>setOffer('setUnit',value)}>
              <Option value="W">W</Option>
              <Option value="kW">kW</Option>
            </Select>
          </Input.Group>
        </Form.Item>

        <Form.Item label="Running time">
        <Input.Group compact>
          <Tooltip title="hours">
            <InputNumber min='0' style={{ width: '40%' }} allowClear placeholder="hours"
              value = {offer.runh} onChange = {(value)=>setOffer('setHours',value)}/>
          </Tooltip>
          <Tooltip title="minutes">
            <InputNumber min="0" style={{ width: '40%' }} allowClear placeholder="minutes"
              value = {offer.runm} onChange = {(value)=>setOffer('setMinutes',value)}/>
          </Tooltip>
        </Input.Group>
        </Form.Item>

        <Form.Item label="Flex duration">
          <RangePicker
            value = {(offer.start_time&&offer.end_time)? [moment.unix(offer.start_time),moment.unix(offer.end_time)] : []}
            disabledDate={disabledDate}
            showTime={{ format: 'HH:mm' }}
            onChange = {onChangeDate}
            format="YYYY-MM-DD HH:mm"
          />
        </Form.Item>

        <Form.Item {...{wrapperCol: { offset: 4, span: 14}}}>
          <Space size='large'>
          <Button type="primary" disabled = {!loggedin}
            onClick={createOffer}>Create a flex offer</Button>
          <Button onClick = {()=>setOffer('reset',[])}>Reset offer</Button>
          </Space>
        </Form.Item>
      </Form>
      <Table columns={columns} dataSource={currentOffers} />
    </div>
}


export { OfferView };
