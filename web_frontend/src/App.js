import React,{createContext, useState, useEffect, useReducer } from 'react';
import './App.css';

import 'antd/dist/antd.css';
import { Layout,Menu,Spin,Alert} from 'antd';
import { LogoutOutlined,  LoginOutlined} from '@ant-design/icons';

import { Offers } from './features/offers/Offers';
import { Counter } from './features/counter/Counter';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import Flex_Offer from './artifacts/Flex_Offer.json';

const { Header, Content, Sider } = Layout;

const initialState = {
  account: '',
  chainId: '',
  netId: 0,
  contract: '',
};

const Web3Context = createContext(initialState);

function reducer(state, action) {
  switch (action.type) {
    case 'setAccount':
      return {...state, account: action.payload};
    case 'setChainId':
      return {...state, chainId: action.payload};
    case 'setNetId':
    return {...state, netId: action.payload};
    case 'setContract':
    return {...state, contract: action.payload};
    default:
      return state;
  }
}

function App() {
  const [web3State,dispatch] = useReducer(reducer,initialState);
  const [erMsg, setErMsg] = useState('Please connect');

  useEffect(() => {
    const init = async () => {
      try{
          const provider = await detectEthereumProvider();
          const web3 = new Web3(provider || 'ws://localhost:7545');
          if (!provider) {
            setErMsg('Cannot detect ethereum provider');
          }else if (!window.ethereum){
            setErMsg('Cannot detect ethereum provider');
          } else if (provider !== window.ethereum) {
            setErMsg('Do you have multiple wallets installed?');
          } else{
            dispatch({type: 'setChainId',payload: provider.chainId});
            provider.request({ method: 'eth_requestAccounts' }).then(
              (accounts: string[]) => {
                dispatch({type: 'setAccount',payload: accounts[0]});
              }
            )
            provider.request({ method: 'net_version' }).then(
              (nId: string) => {
                dispatch({type: 'setNetId', payload: +nId});
                let contractData = Flex_Offer.networks[+nId];
                let flexOffer = new web3.eth.Contract(Flex_Offer.abi,contractData.address);
                dispatch({type:'setContract',payload:flexOffer});
              }
            );
          // event
            provider.on('accountsChanged', (accounts: string[]) =>{
              dispatch({type: 'setAccount',payload: accounts[0]});
              if (accounts.length>0){
                  setErMsg('');
                }else{
                  setErMsg('Please connect');
                }
            })
            provider.on('chainChanged', (cId: string) =>{
              dispatch({type: 'setChainId',payload: cId});
              window.location.reload()
            })
            provider.on('disconnect', () => {
              dispatch({type: 'setAccount',payload: ''});
              dispatch({type: 'setChainId',payload: ''});
            })
          }
      }catch(error){
        console.log(error)
      }
    }
    init()
  }, []);

console.log(web3State);

  if (!web3State.account || !web3State.contract){
    return (
      <div style={{position:'fixed', top: '45%', left: '45%'}}>
      <Spin size='large' tip = {erMsg}>
      </Spin>
      </div>
    );
  }else{
  return <Layout style={{minHeight: '100vh' }}>
    <Sider collapsible>
      <img src="eflex.jpg" className="logo" alt="eflex-logo" />
      <Menu theme="dark" defaultSelectedKeys={["1"]} mode="inline">
        <Menu.Item key="1" icon={<LogoutOutlined />}>
          Bidding
        </Menu.Item>
        <Menu.Item key="2" icon={<LoginOutlined />}>
          Offering
        </Menu.Item>
      </Menu>
    </Sider>
    <Layout className="site-layout">
      <Header className="site-layout-background" style={{ padding: 0 }} />
      <Content style={{ margin: "0 16px" }}>
        <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
        <nav> Welcome: {web3State.account}, you are on the chain {web3State.chainId}</nav>
          <Web3Context.Provider value={web3State}>
            <Offers />
            <Counter />
          </Web3Context.Provider>
        </div>
      </Content>
    </Layout>
  </Layout>
}
}
export default App;

export { Web3Context }
