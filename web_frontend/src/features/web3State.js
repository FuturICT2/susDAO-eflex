import {createContext, useEffect, useContext } from 'react';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import Flex_Offer from '../contracts/Flex_Offer.json';

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

function GetWeb3State() {
  const [web3State,dispatch] = useContext(Web3Context);
  console.log(web3State);
  useEffect(() => {
    const init = async () => {
      try{
          const provider = await detectEthereumProvider();
          const web3 = new Web3(provider || 'ws://localhost:7545');
          if (!provider) {
            console.log('Error: Cannot detect ethereum provider');
          }else if (!window.ethereum){
            console.log('Error: Cannot detect ethereum provider');
          } else if (provider !== window.ethereum) {
            console.log('Error: Do you have multiple wallets installed?');
          } else{
            dispatch({type: 'setChainId',payload: provider.chainId});
            provider.request({ method: 'eth_requestAccounts' }).then(
              (accounts) => {
                dispatch({type: 'setAccount',payload: accounts[0]});
              }
            )
            provider.request({ method: 'net_version' }).then(
              (nId) => {
                dispatch({type: 'setNetId', payload: +nId});
                let contractData = Flex_Offer.networks[+nId];
                let flexOffer = new web3.eth.Contract(Flex_Offer.abi,contractData.address);
                dispatch({type:'setContract',payload:flexOffer});
              }
            );
          // event
            provider.on('accountsChanged', (accounts) =>{
              dispatch({type: 'setAccount',payload: accounts[0]});
            })
            provider.on('chainChanged', (cId) =>{
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

  return(<></>);
}

export {Web3Context, GetWeb3State, initialState, reducer};
