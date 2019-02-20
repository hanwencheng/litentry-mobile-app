import { createStore, combineReducers, applyMiddleware } from 'redux';
import { walletReducer } from './wallet';
import { walletImportReducer } from '../modules/WalletImport/reducers/walletImportReducer';
import { screenReducer } from './screen';
import { popupReducer } from './popup';
import { loaderReducer } from './loader';
import { unlockReducer } from '../modules/Unlock/reducer/unlockReducer';
import { lockReducer } from '../modules/Chat/reducers/lockReducer';
import { topicsReducer } from '../modules/Chat/reducers/topicsReducer';
import { voteReducer } from '../modules/Vote/reducer/voteReducer';
import { userRegisterReducer } from '../modules/User/reducer/userRegisterReducer';

const logger = store => next => action => {
  console.group(action.type);
  // console.info('dispatching', action);
  let result = next(action);
  // console.log('next state', store.getState());
  console.groupEnd();
  return result;
};

const enableBatching = reducer => {
  return function batchingReducer(state, action) {
    switch (action.type) {
      case 'BATCH_ACTIONS':
        return action.actions.reduce(batchingReducer, state);
      default:
        return reducer(state, action);
    }
  };
};

const reducers = combineReducers({
  wallet: walletReducer,
  walletImport: walletImportReducer,
  screen: screenReducer,
  popup: popupReducer,
  appState: loaderReducer,
  unlock: unlockReducer,
  lock: lockReducer,
  topics: topicsReducer,
  vote: voteReducer,
  userRegister: userRegisterReducer,
});

export const store = createStore(enableBatching(reducers), applyMiddleware(logger));
