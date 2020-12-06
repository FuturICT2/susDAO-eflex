import React, { useContext, useEffect, useState } from 'react';

import 'antd/dist/antd.css';
import {
    PageHeader,
    Tag,
    Button } from 'antd';

import { Web3Context } from '../web3State/web3State';
import Web3 from 'web3';

import Blockies from 'react-blockies';



function AppHeader() {
    let [web3state, dispatch] = useContext(Web3Context);
    let [rate,setRate] = useState(0);

    let userAddress = web3state.user?.address || "logged-out";
    let userFlexPoints = web3state.user?.flexPoints || 0;
    let userFlexOffers = web3state.user?.totalFlexOffers || 0;
    let userIsConnected  = web3state.connected;
    let connectedNetwork = web3state.networkName ;

    let onlineTag = <Tag color={userIsConnected ? "blue" : "red"}>Network: { connectedNetwork }</Tag>
    let titleText = _shortenTitle(userAddress);

    let logInOutAction = userIsConnected ? "logout" : "login";
    let logInOutButton = <Button key="0" onClick={() => dispatch(logInOutAction)}>{userIsConnected ? "Log Out" : "Log In"} </Button>

    const updateRate = async()=>{
      let totSupply = await web3state.fpcontract.methods.totalSupply().call();
      let totWei = await web3state.web3.eth.getBalance(web3state.contract._address);
      if (totSupply>0){setRate(totWei/totSupply)};
    }

    useEffect(async ()=>{
      if(web3state.contract && web3state.fpcontract){
        updateRate();
        if (web3state.user?.address){
          let account = web3state.user.address;
          let nfp = await web3state.fpcontract.methods.balanceOf(account).call();
          let nfo = await web3state.contract.methods.GetMyTotMintedFlexOffers(account).call();
          dispatch('updateUser',{userFlexPoints: nfp, totalFlexOffers:nfo});
        }else{
          dispatch('updateUser',{userFlexPoints: 0, totalFlexOffers:0});
        }
        // add event to update user flexpoints
        web3state.contract.events.flexOfferActivation(function(error, result){
          if (!error){
            let flex_token_id = result.returnValues[0];
            updateRate();
            if(web3state.user?.address){
              web3state.contract.methods.GetMyTotMintedFlexOffers(web3state.user.address).call().then(
                (newNfp)=>{dispatch('updateUser', {userFlexPoints:newNfp});}
              )
            }
          }
        });
        // bidding success function
        web3state.contract.events.flexOfferBidSuccess(function(error, result){
          if (!error){updateRate();}
        });
      }else{
        dispatch('updateUser',{userFlexPoints: 0, totalFlexOffers:0});
      }
    },[web3state.user?.address,web3state.contract,web3state.fpcontract]);

    return <PageHeader
        backIcon={ false }
        avatar={ {src: <Blockies seed={userAddress} /> } }
        title={ titleText }
        subTitle={`${userFlexPoints} Flexpoints, ${userFlexOffers} FlexOffers, 1 flexpoint = ${rate} wei`}
        tags={onlineTag}
    ></PageHeader>

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
