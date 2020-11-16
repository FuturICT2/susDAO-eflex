import React, { useState, useEffect, useContext } from 'react';
import './App.css';

import 'antd/dist/antd.css';
import { Layout,Menu,Spin,Alert} from 'antd';
import {
  LogoutOutlined,
  LoginOutlined
} from '@ant-design/icons';

import { Offers } from './features/offers/Offers';
import { Counter } from './features/counter/Counter';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';

const { Header, Content, Sider } = Layout;
const Web3Context = React.createContext(Web3.givenProvider);

function App() {
  // console.log(Web3.givenProvider);
  const [metamask, setMetamask] = useState<string>('');
  const [chainId, setChainId] = useState<string>('');
  const [netId, setnetId] = useState<string>('');
  const [success,setSuccess] = useState(false);
  const [erMsg, setErMsg] = useState<string>('Please connect');
  useEffect(() => {
    const init = async () => {
      try{
          const provider:any = await detectEthereumProvider();
          if (!provider) {
            setSuccess(false);
            setErMsg('Cannot detect ethereum provider');
          }else if (!window.ethereum){
            setSuccess(false);
            setErMsg('Cannot detect ethereum provider');
          } else if (provider !== window.ethereum) {
            setSuccess(false);
            setErMsg('Do you have multiple wallets installed?');
            console.error('Do you have multiple wallets installed?');
          } else{
            setChainId(provider.chainId);
            provider.request({ method: 'eth_requestAccounts' }).then(
              (accounts: string[]) => {
                setMetamask(accounts[0]);
                setSuccess(true);
              }
            )
            provider.request({ method: 'net_version' }).then(
              (nId: string) => {
                setnetId(nId);
              }
            );
          // event
            provider.on('accountsChanged', (accounts: string[]) =>{
              setMetamask(accounts[0]);
              if (accounts.length>0){
                  setSuccess(true);
                  setErMsg('');
                }else{
                  setSuccess(false);
                  setErMsg('Please connect');
                }
            })
            provider.on('chainChanged', (cId: string) =>{
              setChainId(cId)
              window.location.reload()
            })
            provider.on('disconnect', () => {
              setMetamask('')
              setChainId('')
            })
          }
      }catch(error){
        console.log(error)
      }
    }
    init()
  }, []);
console.log('hihi')
  if (!success){
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
        <nav> Welcome: {metamask}, you are on the chain {chainId}</nav>
          <Web3Context.Provider value={new Web3(Web3.givenProvider || 'ws://localhost:7545')}>
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
