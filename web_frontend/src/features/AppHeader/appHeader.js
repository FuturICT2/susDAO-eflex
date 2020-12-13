import React, { useContext, useState } from 'react';

import 'antd/dist/antd.css';
import { 
    PageHeader,
    Typography,
    Tag,
    Button,
    List,
    Modal } from 'antd';

import { Web3Context } from '../web3State/web3State';

import Blockies from 'react-blockies';
import Keys from '../../artifacts/keys.json';

let { Text, Paragraph } = Typography;

function AppHeader() {
    let [web3state, dispatch] = useContext(Web3Context);
    
    // Keys Modal
    let [isKeysModalVisible, setKeysModalVisible] = useState(false);
    let showKeysModal = () => setKeysModalVisible(true);
    let closeKeysModal = () => setKeysModalVisible(false);

    let keysData = Object.entries(Keys.private_keys);
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
    let userAddress = web3state.user?.address ?? "logged-out";
    let userFlexPoints = web3state.user?.flexPoints ?? 0;
    let userFlexOffers = web3state.user?.totalFlexOffers ?? 0;
    let userIsConnected  = web3state.connected;
    let connectedNetwork = web3state.networkName ?? "not connected";

    let onlineTag = <Tag color={userIsConnected ? "blue" : "red"}>Network: { connectedNetwork }</Tag>
    let titleText = _shortenTitle(userAddress);

    let Header = () => <PageHeader 
        backIcon={ false }
        avatar={ {src: <Blockies seed={userAddress} /> } }
        title={ titleText }
        subTitle={`${userFlexPoints} Flexpoints, ${userFlexOffers} FlexOffers`}
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