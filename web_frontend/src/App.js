import logo from './logo.svg';
import './App.css';

/* import { Web3Context, Web3Connection } from "./features/Web3State/web3State"; */
import { useReducer, createContext } from 'react';

// Ant Design imports
import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import {
  LogoutOutlined,
  LoginOutlined
} from '@ant-design/icons';


// Local imports
import { AppHeader } from './features/AppHeader/appHeader';

const { Header, Content, Sider } = Layout;

let Web3Context = createContext(null);

function App() {

  // let [web3, reducer] = useReducer(initialState);
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
          <Web3Context.Provider value={[{}, ((action)=>{console.log("Action: ", action)})]}>
            <AppHeader />
            <h1>Hello</h1>
          </Web3Context.Provider>
        </div>
      </Content>
    </Layout>
  </Layout>);
}

export default App;

export { Web3Context };
