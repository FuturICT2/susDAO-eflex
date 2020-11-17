import React, { useContext } from 'react';

import 'antd/dist/antd.css';
import { 
    PageHeader,
    Tag,
    Button } from 'antd';

import { Web3Context } from '../../App';

import Blockies from 'react-blockies';




function AppHeader() {
    let [web3state, dispatch] = useContext(Web3Context);

    let userAddress = web3state.user?.address || "0xkasjdlkajlkj";
    let userFlexPoints = web3state.user?.flexPoints || 299;
    let userFlexOffers = web3state.user?.totalFlexOffers || 31;
    let userIsConnected  = Boolean(web3state.user?.address);
    let connectedNetwork = web3state.network || "offline";

    let onlineTag = <Tag color={userIsConnected ? "green" : "red"}>{ connectedNetwork }</Tag>
    let titleText = _shortenTitle(userAddress);

    let logInOutAction = userIsConnected ? "logout" : "login";
    let logInOutButton = <Button onClick={() => dispatch(logInOutAction)}>{userIsConnected ? "Log Out" : "Log In"} </Button>
    

    return <PageHeader 
        backIcon={ false }
        avatar={ {src: <Blockies seed={userAddress} /> } }
        title={ titleText }
        subTitle={`${userFlexPoints} Flexpoints, ${userFlexOffers} FlexOffers`}
        tags={onlineTag}
        extra={[
            logInOutButton
        ]}
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