import {
    PageHeader, Row, Statistic
} from 'antd';
import 'antd/dist/antd.css';
import React, { useContext, useMemo } from 'react';
import { Web3Context } from '../web3State/web3State';

function MarketHeader(){
    let [web3state, dispatch] = useContext(Web3Context);
    let stats = useMemo(() => {
        let totalFlexTokens = web3state.totalPoints;
        let totalFlexOffers = web3state.totalOffers;
        let totalGWeiOnContract = web3state.totalEth;
        let gweiPerToken = totalFlexTokens > 0 ? Math.floor(totalGWeiOnContract / totalFlexTokens) : 0;
        
        let MarketStat = (props) => <Statistic {...props} loading={!(web3state.isLoaded)} style={{margin: '0 32px'}} />
        return <Row>
            <MarketStat title="Offers" value={totalFlexOffers} />
            <MarketStat title="Points" value={totalFlexTokens} />
            <MarketStat title="Pool" value={totalGWeiOnContract} suffix="Wei" />
            <MarketStat title="Point Price" value={gweiPerToken} suffix="Wei" />
        </Row>
    }, [web3state.totalPoints, web3state.totalOffers, web3state.totalEth]);

    return stats;
    //return <PageHeader onBack={null} title="Stats">{stats}</PageHeader>
   
}


export { MarketHeader };
