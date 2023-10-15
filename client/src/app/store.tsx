import { krmxSlice } from '@krmx/client';
import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
 
type Point = {
  x: number;
  y: number;
};

type VoromultiClaimMessage = {
  type: 'voromulti/claim';
  payload: {
    username: string;
    siteIndex: number;
  };
};

type VoromultiUnclaimMessage = {
  type: 'voromulti/unclaim';
  payload: {
    username: string;
  };
};

type VoromultiClaimsMessage = {
  type: 'voromulti/claims';
  payload: { [username: string]: number };
};

type VoromultiSitesMessage = {
  type: 'voromulti/sites';
  payload: {
    locations: Point[];
    edges: string[];
  };
};

export const voromultiSlice = createSlice({
  name: 'voromulti',
  initialState: {
    claims: {} as { [username:string]: number },
    sites: {
      locations: [] as Point[],
      edges: [] as string[],
    },
  },
  reducers: {
    reset: () => {
      return { claims: {}, sites: { locations: [], edges: [] } };
    },
    claims: (state, action: PayloadAction<VoromultiClaimsMessage['payload']>) => {
      state.claims = action.payload;
    },
    claim: (state, action: PayloadAction<VoromultiClaimMessage['payload']>) => {
      state.claims[action.payload.username] = action.payload.siteIndex;
    },
    unclaim: (state, action: PayloadAction<VoromultiUnclaimMessage['payload']>) => {
      delete state.claims[action.payload.username]
    },
    sites: (state, action: PayloadAction<VoromultiSitesMessage['payload']>) => {
      state.sites = action.payload;
    },
  },
});

export const store = configureStore({
  reducer: {
    krmx: krmxSlice.reducer,
    voromulti: voromultiSlice.reducer,
  },
});

export type AppState = ReturnType<typeof store.getState>;
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
