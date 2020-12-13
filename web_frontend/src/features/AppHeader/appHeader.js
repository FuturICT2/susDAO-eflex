import React, { useContext, useEffect, useState } from 'react';

import 'antd/dist/antd.css';
import {
    PageHeader,
    Typography,
    Tag,
    Button,
    List,
    Modal } from 'antd';

import { Web3Context } from '../web3State/web3State';
import Web3 from 'web3';

import Blockies from 'react-blockies';
import Keys from '../../artifacts/keys.json';

let { Text, Paragraph } = Typography;

function AppHeader() {
    let [web3state, dispatch] = useContext(Web3Context);

    // Keys Modal
    let [isKeysModalVisible, setKeysModalVisible] = useState(false);
    let showKeysModal = () => setKeysModalVisible(true);
    let closeKeysModal = () => setKeysModalVisible(false);

    let keysData = Object.entries(Keys.private_keys ?? {});
    let notes = {1: "(used by Autobidder)", 2: "(used by Autoofferer)"}
    let renderKey = ([pub, priv], i) => {
        let title =<>
                <Text strong>{pub} </Text>
                <Text mark>{notes[i]}</Text>
                </>

        let text = <Paragraph copyable>{priv}</Paragraph>
        return  <List.Item>
                    <List.Item.Meta
                        title={title}
                        description={text}/>
                </List.Item>

    };;

    let keysModal =< Modal
        visible={isKeysModalVisible}
        onOk={closeKeysModal}
        onCancel={closeKeysModal}
        width={1000}
        maskClosable={true}
        mask={true}
        footer={null}>
    <List dataSource={keysData} renderItem={renderKey} bordered/>
    </Modal>

    // Page Header
    let [rate,setRate] = useState(0);
    let userAddress = web3state.user?.address ?? "logged-out";
    let userFlexPoints = web3state.user?.flexPoints ?? 0;
    let userFlexOffers = web3state.user?.totalFlexOffers ?? 0;
    let userIsConnected  = web3state.connected;
    let connectedNetwork = web3state.networkName ?? "not connected";

    let onlineTag = <Tag color={userIsConnected ? "blue" : "red"}>Network: { connectedNetwork }</Tag>
    let titleText = _shortenTitle(userAddress);

    let logInOutAction = userIsConnected ? "logout" : "login";
    let logInOutButton = <Button key="0" onClick={() => dispatch(logInOutAction)}>{userIsConnected ? "Log Out" : "Log In"} </Button>

    const updateRate = async()=>{
      let totSupply = await web3state.fpcontract.methods.totalSupply().call();
      let totWei = await web3state.web3.eth.getBalance(web3state.contract._address);
      if (totSupply>0){setRate(Math.floor(totWei/totSupply))};
    }

    useEffect(async ()=>{
      if(web3state.contract && web3state.fpcontract){
        updateRate();
        if (web3state.user?.address){
          let account = web3state.user.address;
          let nfp = await web3state.fpcontract.methods.balanceOf(account).call();
          let nfo = await web3state.contract.methods.GetMyTotMintedFlexOffers(account).call();
          dispatch('updateUser',{flexPoints: nfp, totalFlexOffers:nfo});
        }else{
          dispatch('updateUser',{flexPoints: 0, totalFlexOffers:0});
        }
        // add event to update user flexpoints
        web3state.contract.events.flexOfferActivation(function(error, result){
          if (!error){
            let flex_token_id = result.returnValues[0];
            updateRate();
            if(web3state.user?.address){
              web3state.fpcontract.methods.balanceOf(web3state.user.address).call().then(
                (newNfp)=>{dispatch('updateUser', {flexPoints:newNfp});}
              )
            }
          }
        });
        // bidding success function
        web3state.contract.events.flexOfferBidSuccess(function(error, result){
          if (!error){updateRate();}
        });
      }else{
        dispatch('updateUser',{flexPoints: 0, totalFlexOffers:0});
      }
    },[web3state.user?.address,web3state.contract,web3state.fpcontract]);

    let Header = () => <PageHeader
        backIcon={ false }
        avatar={ {src: <Blockies seed={userAddress} /> } }
        title={ titleText }
        subTitle={`${userFlexPoints} Flexpoints, ${userFlexOffers} FlexOffers, 1 flexpoint = ${rate} wei`}
        tags={onlineTag}
        extra={<Button type="dashed" onClick={showKeysModal}>Show Keys</Button>}>

    </PageHeader>



    return <><Header />{keysModal}</>

}

/* Shortens title to at most MAX_TITLE_LENGTH */
function _shortenTitle(title){
    const MAX_TITLE_LENGTH = 30
    if(title.length > MAX_TITLE_LENGTH){
        let title_half = MAX_TITLE_LENGTH / 2;
        return `${title.slice(0, title_half-3)}...${title.slice(-title_half)}`
    } else {
        return title;
    }
}




export { AppHeader };
