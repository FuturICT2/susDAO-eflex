import logo from './logo.svg';
import './App.css';

/* import { Web3Context, Web3Connection } from "./features/Web3State/web3State"; */
import { useReducer } from 'react';

// Ant Design imports
import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import {
  LogoutOutlined,
  LoginOutlined
} from '@ant-design/icons';

import {Web3Context, GetWeb3State, initialState, reducer} from './features/web3State';
import {Navbar} from './features/NavBar';

const { Header, Content, Sider } = Layout;

function App() {

  return (<Layout style={{ minHeight: '100vh' }}>
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
          <Web3Context.Provider value={useReducer(reducer,initialState)}>
            <GetWeb3State />
            <Navbar />
          </Web3Context.Provider>
        </div>
      </Content>
    </Layout>
  </Layout>);
}

export default App;
