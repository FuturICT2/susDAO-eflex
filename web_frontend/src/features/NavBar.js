import {useContext } from 'react';
import {Web3Context} from './web3State';

function Navbar(){
  console.log('hihi');
  const [web3State,dispatch] = useContext(Web3Context);
  return(
  <nav> Welcome: {web3State.account}, you are on the chain {web3State.chainId}</nav>
  )
}

export {Navbar};
