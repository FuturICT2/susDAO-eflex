import React, { useContext } from 'react';

import 'antd/dist/antd.css';
import { 
    PageHeader,
    Tag,
    Button } from 'antd';

import { Web3Context } from '../web3State/web3State';

import Blockies from 'react-blockies';



function AppHeader() {
    let [web3state, dispatch] = useContext(Web3Context);

    let userAddress = web3state.user?.address || "logged-out";
    let userFlexPoints = web3state.user?.flexPoints || 0;
    let userFlexOffers = web3state.user?.totalFlexOffers || 0;
    let userIsConnected  = web3state.connected;
    let connectedNetwork = web3state.networkName ;

    let onlineTag = <Tag color={userIsConnected ? "blue" : "red"}>Network: { connectedNetwork }</Tag>
    let titleText = _shortenTitle(userAddress);

    let logInOutAction = userIsConnected ? "logout" : "login";
    let logInOutButton = <Button key="0" onClick={() => dispatch(logInOutAction)}>{userIsConnected ? "Log Out" : "Log In"} </Button>
    

    return <PageHeader 
        backIcon={ false }
        avatar={ {src: <Blockies seed={userAddress} /> } }
        title={ titleText }
        subTitle={`${userFlexPoints} Flexpoints, ${userFlexOffers} FlexOffers`}
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