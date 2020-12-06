import React, { useContext, useState , useReducer, useEffect, useRef} from 'react';
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
    Statistic,
    Tag,
} from 'antd';

import {
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
  InfoOutlined,
} from '@ant-design/icons';

import { Web3Context } from '../web3State/web3State';
import {WashMachine} from './washingMachine';

const { Title } = Typography;
const { Countdown } = Statistic;
const { RangePicker } = DatePicker;
const { Option } = Select;

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

const statusList = ['wait for bidding','in bidding','to be activated',
                    'manually activated','running','accomplished'];
const renStatus = statusList.map((x)=>{return {text:x , value:x } } );
const timeFormat = "YYYY-MM-DD HH:mm";

function OfferView() {
    let [web3state, dispatch] = useContext(Web3Context);
    const contract = web3state.contract;
    // funcitons for creating flexoffers
    const [offer,offerdispatch] = useReducer(reducer,initialOffer);
    const setOffer = (type, payload) => {offerdispatch({type:type, payload:payload})};
    // flex offers of the user
    const [currentOffers, updateCurrentOffers] = useState();
    // update listen's state variable
    const myOfferRef = useRef(currentOffers);
    const updateOffers = (data) => {
      myOfferRef.current = data;
      updateCurrentOffers(data);
    };

    // either connected or not
    let loggedin = (web3state.user?.address && contract);
    let gotOffers = Array.isArray(currentOffers);

    // time buffer
    const tfinminutes = 1;
    const tfend = 0;
    // read flexoffers from the block chain
    const getNewOffer = async (flex_token_id)=>{
      let offerinfo = await contract.methods.flex_offers_mapping(flex_token_id).call();
      let status = statusList[0];
      if (!offerinfo[5]){
        status = statusList[1];
      }
      if(moment.unix(offerinfo[4]).subtract(tfend*60+offerinfo[2], "seconds") <moment()){
        status = statusList[2];
      }
      let bidaddress = 'NA';
      try{
        let result = await contract.methods.ownerOf(flex_token_id).call();
        if (!offerinfo[5]){bidaddress = result;}
      }catch(error){
        status = statusList[5];
      }
      let hours = Math.floor(offerinfo[2] / 3600);
      let minutes = Math.floor(offerinfo[2] % 3600 / 60);
      let offerData = {
        offerId: flex_token_id,
        power: offerinfo[1]/1000+' kW',
        durationInSecond: offerinfo[2],
        duration: hours+' h '+minutes+' m',
        start_time: moment.unix(offerinfo[3]).format(timeFormat),
        end_time: moment.unix(offerinfo[4]).format(timeFormat),
        status: status,
        bidprice: offerinfo[5],
        bidaddress: bidaddress,
        activateTime: '',
      };
      return offerData;
    }

    const init = async () => {
      if(loggedin){
        const account = web3state.user.address;
        const nflex = await contract.methods.GetMyTotMintedFlexOffers(account).call();
        let offerDataAll = [];
        for (let i = 0; i < nflex; i++) {
          let flex_token_id = await contract.methods.GetMyFlexOffer(account,i).call();
          let offerData = await getNewOffer(flex_token_id);
          offerDataAll.unshift(offerData);
        }
        updateOffers(offerDataAll);
      }else{
        updateOffers([]);
      }
    }
// console.log(currentOffers);
    // listen to events
    const listenEvent =()=>{
      // new flexoffers
      contract.events.flexOfferMinted(function(error, result){
        if (!error){
          let flex_token_id = result.returnValues[0];
          console.log(web3state.user?.address);
          contract.methods.flex_offers_mapping(flex_token_id).call().then( (offerinfo)=>{
            if (web3state.user.address.toUpperCase()===offerinfo[0].toUpperCase()){
              let newOffers = myOfferRef.current.slice();
              getNewOffer(flex_token_id).then((offerData)=>{
                newOffers.unshift(offerData);
                updateOffers(newOffers);
                contract.methods.GetMyTotMintedFlexOffers(web3state.user.address).call().then(
                  (newNfo)=>{ dispatch('updateUser', {totalFlexOffers:newNfo}) } )
              });
            }
          })
        }else{
          console.log(error);
        }
      });

    // new bidding success
      contract.events.flexOfferBidSuccess(function(error, result){
        if (!error){
          let flex_token_id = result.returnValues[0];
          let index = myOfferRef.current.findIndex(offer => offer.offerId ===flex_token_id);
          if(index){
            let newOffers = myOfferRef.current.slice();
            getNewOffer(web3state.user.address,index).then((offer)=>{
              newOffers[index] = offer;
              updateOffers(newOffers);
            })
          }
        }else{
          console.log(error);
        }
      });

    //  activate offers
      contract.events.flexOfferActivation(
        function(error, result){
          const offerId = result.returnValues[0];
          contract.methods.flex_offers_mapping(offerId).call().then((offerInfo)=>{
            if(offerInfo[0].toUpperCase()===web3state.user.address.toUpperCase()){
              let newOffers=myOfferRef.current.slice();
              let index = newOffers.findIndex(offer => offer.offerId ===offerId);
              dispatch('updateUser', {machineOn:true});
              newOffers[index].status = statusList[4];
              newOffers[index].activateTime = moment().format(timeFormat);
              updateOffers(newOffers);
              setTimeout( ()=>{
                dispatch('updateUser', {machineOn:false});
                newOffers[index].status = statusList[5];
                newOffers[index].activateTime = '';
                updateOffers(newOffers);
              }, offerInfo[2]*200);
            }
          });
        });
    }
console.log(currentOffers);
    // initialization
    useEffect( () => {
      init();
    }, [web3state.user?.address, web3state.contract]);

    // add event listener
    useEffect( ()=>{
      if(loggedin&&gotOffers){
          listenEvent();
        }
    },[web3state.user?.address, web3state.contract, gotOffers]);

    // Can not select days before today
    const disabledDate =(current)=>{
    return current < moment().startOf('day');
    }

    // when change date
    const onChangeDate =(value, dateString)=>{
      if (value){
        let mom1 = value[0];
        let mom2 = value[1];
        let now = moment();
        let nowbuffer = moment(now).add(tfinminutes, 'minutes');
        if(mom2<nowbuffer){
          window.alert('The end time should be set to more than ' + tfinminutes + ' minutes later from now')
        }else if (mom1<nowbuffer&&mom2>nowbuffer){
          window.alert('The starting time should be set to more than ' + tfinminutes + ' minutes later from now')
          setOffer('setDuration',[nowbuffer.unix(),mom2.unix()]);
        }else{
          setOffer('setDuration',[mom1.unix(),mom2.unix()]);
        }
      }else{
        setOffer('setDuration',[0,0]);
      }
    }

    // Create flexoffer
    const createOffer = ()=>{
      let pass = false;
      if (!offer.power){
        window.alert('Please provide the power of your machine')
      }else if(!offer.runh && !offer.runm){
        window.alert('Please provide the operation time of the machine')
      }else if(!offer.start_time && !offer.end_time){
        window.alert('Please provide the duration of the flex offer')
      }else {
        let now = moment();
        let nowbuffer = moment(now).add(tfinminutes, 'minutes').unix();
        if(offer.end_time<nowbuffer || offer.start_time<nowbuffer){
          window.alert('The duration of the flex offer should be set to more than ' + tfinminutes + ' minutes later from now')
        }else{
          const duration = 3600*offer.runh+60*offer.runm;
          if (duration> offer.end_time - offer.start_time -tfinminutes*60){
            window.alert('The operating time should be at least ' + tfinminutes + ' minutes larger than the flexoffer duration')
          }else{
            let powerinW=offer.power;
            if(offer.unit ==='kW'){
              powerinW = powerinW*1000;
            }
            contract.methods.mint_flex_offer_to(powerinW,duration,offer.start_time,offer.end_time).send({from:web3state.user.address});
            setOffer('reset',[]);
          }
        }
      }
    }

    // when time ends, allow for manual activation
    const renderEndtime = (record)=>{
      if(record.status===statusList[0]||record.status===statusList[1]){
        const dur = record.durationInSecond;
        const ddl = moment(record.end_time,timeFormat).subtract(tfend*60+dur, "seconds").valueOf();
        const now = moment();
        let newOffers=currentOffers.slice();
        let index = newOffers.findIndex(offer => offer.offerId ===record.offerId);
        if(ddl > now){
          return <Countdown valueStyle={{ fontSize: '15px'}} value={ddl} onFinish = {()=>{
            if(window.confirm("Your flexOffer ID:" + record.offerId + " can be manually activated, do you want to activate it now?")){
              contract.methods.EndTimeActivate(record.offerId).send({from:web3state.user?.address}).then(
                ()=>{
                  newOffers[index].status = statusList[3];
                  updateOffers(newOffers);}
              ).catch(()=>{
                newOffers[index].status = statusList[2];
                updateOffers(newOffers);}
              )
            }else{
              newOffers[index].status = statusList[2];
              updateOffers(newOffers);
            }
          }}
          />
        }else{
          return <a onClick = {()=>{
            contract.methods.EndTimeActivate(record.offerId).send({from:web3state.user?.address}).then(
              ()=>{
                newOffers[index].status = statusList[3];
                updateOffers(newOffers);}
              )
            }}> Activate </a>
        }
      }else if (record.status===statusList[2]){
        return <a onClick = {()=>{
          contract.methods.EndTimeActivate(record.offerId).send({from:web3state.user?.address}).then(
            ()=>{
              let newOffers=currentOffers.slice();
              let index = newOffers.findIndex(offer => offer.offerId ===record.offerId);
              newOffers[index].status = statusList[3];
              updateOffers(newOffers);}
            )
          }}> Activate </a>
      }else{
        return <p> </p>
      }
    };

    // setup table
    const columns = [
      {
        title: 'Offer-ID',
        dataIndex: 'offerId',
        key: 'offerId',
        sorter: (a, b) =>a.offerId - b.offerId,
        ellipsis: true,
        width: '9%'
      },
      {
        title: 'Power',
        dataIndex: 'power',
        key: 'power',
        width: '10%',
        sorter: (a, b) =>a.power.replace(' kW','') - b.power.replace(' kW',''),
      },
      {
        title: 'Duration',
        dataIndex: 'duration',
        key: 'duration',
        sorter: (a, b) => moment(a.duration, "hh:mm").valueOf() - moment(b.duration, "hh:mm"),
      },
      {
        title: 'Start Time',
        dataIndex: 'start_time',
        key: 'start_time',
        width: '15%',
        sorter: (a, b) => moment(a.start_time, "YYYY-MM-DD hh:mm").valueOf() - moment(b.start_time, "YYYY-MM-DD hh:mm"),
      },
      {
        title: 'End Time',
        dataIndex: 'end_time',
        key: 'end_time',
        width: '15%',
        sorter: (a, b) => moment(a.end_time, "YYYY-MM-DD hh:mm").valueOf() - moment(b.end_time, "YYYY-MM-DD hh:mm"),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: '15%',
        sorter: (a, b) => a.status.length - b.status.length,
        render:  (_, record) => {
              let status = record.status;
              let renderColor = 'volcano';
              let renderIcon = <ClockCircleOutlined />;
              switch (status){
                case statusList[0]:
                  renderColor = 'cyan';
                  break;
                case statusList[1]:
                  renderColor = 'blue';
                  break;
                case statusList[2]:
                  renderColor = 'red';
                  renderIcon = <ExclamationCircleOutlined />;
                  break;
                case statusList[3]:
                  renderColor = 'yellow';
                  break;
                case statusList[4]:
                  renderColor = 'magenta';
                  renderIcon = <SyncOutlined spin />;
                  break;
                case statusList[5]:
                  renderColor = 'success';
                  renderIcon = <CheckCircleOutlined />;
                  break;
                }
              return (
                <>
                <Tag style={{ fontSize: '10px'}} color={renderColor} icon={renderIcon}>
                {status.toUpperCase()}
                </Tag>
                {status===statusList[4] &&
                  <Tag style={{ fontSize: '10px'}} color={'purple'}>
                  FROM {record.activateTime}
                  </Tag> }
                </>
              );
            },

        filters: renStatus,
        filterMultiple: false,
        onFilter: (value, record) => record.status.indexOf(value) === 0,
      },
      {
        title: 'Price',
        dataIndex: 'bidprice',
        key: 'bidprice',
        sorter: (a, b) =>a.bidprice - b.bidprice,
      },
      {
        title: 'Bider',
        dataIndex: 'bidaddress',
        key: 'bidaddress',
        ellipsis: true,
        width: '10%',
      },
      {
        title: 'Action',
        key: 'action',
        render: function(_, record) {
          return renderEndtime(record);
        }
      }
    ];

    // return react components
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
      <Table columns={columns} dataSource={currentOffers}/>
    </div>
}


export { OfferView };
