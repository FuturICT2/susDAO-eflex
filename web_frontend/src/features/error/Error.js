import 'antd/dist/antd.css';
import { notification, Modal } from 'antd';



let showError = (title, msg) => {
    notification['error']({
        message: title,
        description: msg
    })
}

let showAndThrowRpcError = (error) => {
    showError("RPC Errror:" + error.code, error.message);
    throw error;
}

let showAndThrowFlexOfferError = (error) => {
    let msgs = [
        "Flex Offer is no longer biddable",
        "Current bid is higher than your bid"
    ]

    for(let msg of msgs){
        if(error.message.includes(msg)){
            showError("Contract error:", msg);
            throw error;
        }
    }
}

let fail = (title, msg) => {
    Modal.error({
        title: title,
        content: msg
    })
}


export { showError, fail, showAndThrowRpcError, showAndThrowFlexOfferError };