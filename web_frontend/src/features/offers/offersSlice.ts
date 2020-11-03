import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store'

interface Offer {
    key: string,
    offerId: string,
    bidderAddress: string,
    amount: number
}

interface OffersState {
    tableData: Array<Offer>
}


const initialState: OffersState = {
    tableData:  [
        {
            key: '1',
            offerId: 'kshdlkjsdhlkajsdhkljh',
            bidderAddress: '0x637fe6dc8ab',
            amount: 20
        },
        {
            key: '2',
            offerId: '0xff2e675c7eda',
            bidderAddress: '0x637fe6dc8ab',
            amount: 20
        },
        {
            key: '3',
            offerId: '0xff2e675c7eda',
            bidderAddress: '0x637fe6dc8ab',
            amount: 20
        },
        {
            key: '4',
            offerId: '0xff2e675c7eda',
            bidderAddress: '0x637fe6dc8ab',
            amount: 20
        },
    ]
}


export const offersSlice = createSlice({
    name: 'offers',
    initialState,
    reducers: {
        addEntry: (state, action: PayloadAction<Offer>) => {
            state.tableData.push(action.payload);
        },

        removeEntry: (state, action: PayloadAction<string>) => {
            const offerIndex = state.tableData.findIndex((offer: Offer) => offer.key === action.payload);
            if(offerIndex >= 0){
                state.tableData.splice(offerIndex, 1);
            }
        },

        updateEntry: (state, action: PayloadAction<Offer>) => {
            const offerIndex = state.tableData.findIndex((offer: Offer) => offer.key === action.payload.key);
            if(offerIndex >= 0){
                state.tableData.splice(offerIndex, 1, action.payload);
            }
        }
    }
});



export const selectDataSource = (state: RootState) => state.offers.tableData;
export const { addEntry, removeEntry, updateEntry } = offersSlice.actions;


export default offersSlice.reducer;