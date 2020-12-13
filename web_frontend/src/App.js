import './App.css';

/* import { Web3Context, Web3Connection } from "./features/Web3State/web3State"; */
import { useReducer, useState } from 'react';

// Ant Design imports
import 'antd/dist/antd.css';
import { Layout, Menu } from 'antd';
import {
  BulbOutlined,
  BorderOuterOutlined,
  StockOutlined,
} from '@ant-design/icons';


// Local imports
import { AppHeader } from './features/AppHeader/appHeader';
import { Web3Context, reducer, initialState, Web3Manager  } from './features/web3State/web3State';
import { MarketView } from './features/MarketView/marketView';
import { BuyView } from './features/BuyView/buyView';
import { OfferView } from './features/OfferView/offerView';

const { Header, Content, Sider } = Layout;

function App() {

  let [web3state, web3dispatcher] = useReducer(reducer, initialState);
  let betterDispatcher = (type, payload) => {web3dispatcher({type:type, payload:payload})};

  let views = {
    offer: <OfferView />,
    market: <MarketView />,
    buy: <BuyView />

  }
  let [currentView, setView] = useState("market");
  return (<Layout style={{ minHeight: '100vh' }}>
    <Sider collapsible>
      <img src="logo.png" className="logo" alt="eflex-logo" />
      <Menu theme="dark" defaultSelectedKeys={["3"]} mode="inline">
        <Menu.Item key="1" icon={<BorderOuterOutlined />} onClick={()=>setView("buy")}>
          Buy
        </Menu.Item>
        <Menu.Item key="2" icon={<BulbOutlined />} onClick={() => setView("offer")}>
          Offer
        </Menu.Item>
        <Menu.Item key="3" icon={<StockOutlined />} onClick={() => setView("market")}>
          View Market
        </Menu.Item>
      </Menu>
    </Sider>
    <Layout className="site-layout">
      <Header className="site-layout-background" style={{ padding: 0 }} />
      <Content style={{ margin: "0 16px" }}>
        <div className="site-layout-background" style={{ padding: 24, minHeight: 360 }}>
          <Web3Context.Provider value={[web3state, betterDispatcher]}>
            <Web3Manager />
            <AppHeader />
            {
              views[currentView]
            }
          </Web3Context.Provider>
        </div>
      </Content>
    </Layout>
  </Layout>);
}

export default App;

export { Web3Context };
