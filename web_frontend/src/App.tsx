import React from 'react';
import './App.css';

import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import {
  LogoutOutlined,
  LoginOutlined
} from '@ant-design/icons';

import { Offers } from './features/offers/Offers';
import { Counter } from './features/counter/Counter';
import Web3 from 'web3';

const { Header, Content, Sider } = Layout;

const Web3Context = React.createContext(Web3.givenProvider);


function App() {
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
          <Web3Context.Provider value={new Web3(Web3.givenProvider || 'ws://localhost:7545')}>
            <Offers />
            <Counter />
          </Web3Context.Provider>
        </div>
      </Content>
    </Layout>
  </Layout>
}

export default App;

export { Web3Context }
