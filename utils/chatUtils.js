import _ from 'lodash';
import { store } from '../reducers/store';
import { lockAction } from '../modules/Chat/actions/lockAction';
import { loaderAction } from '../actions/loaderAction';
import { dataEntry } from '../reducers/loader';
import { screensList } from '../navigation/screensList';
import { makeImageUrl } from '../modules/Chat/lib/blob-helpers';

export const saveLoginData = (currentId, oldUserId, token) => {
  store.dispatch(lockAction.setId(currentId));
  if (currentId !== oldUserId) {
    store.dispatch(
      loaderAction.clearAppData({
        [dataEntry.userId.stateName]: currentId,
        [dataEntry.loginToken.stateName]: token,
      })
    );
  } else {
    store.dispatch(loaderAction.saveAppData({ [dataEntry.loginToken.stateName]: token }));
  }
};

export const handleCredentialsRequest = (navigation, params) => {
  store.dispatch(
    loaderAction.clearAppData({
      [dataEntry.userId.stateName]: params.user,
      // [dataEntry.profileName.stateName]: params.desc.public.fn,
      [dataEntry.loginToken.stateName]: params.token,
    })
  );
  navigation.navigate(screensList.VerifyCredential.label);
};

export const isGroupId = chatId => {
  return typeof chatId === 'string' && chatId.indexOf('grp') === 0;
};

export const generatePublicInfo = (profileName, imageData) => {
  let publicInfo = null;

  if (profileName || imageData) {
    publicInfo = {};
    if (profileName) {
      publicInfo.fn = profileName.trim();
    }
    if (!_.isEmpty(imageData)) {
      publicInfo.photo = imageData;
    }
  }
  return publicInfo;
};

export const reformatData = (result, value, key) => {
  if (key === 'photo') {
    const avatar = makeImageUrl(value);
    return _.set(result, 'avatar', avatar);
  }
  if (key === 'fn') {
    return _.set(result, 'name', value);
  }
  return _.set(result, key, value);
};

export const saveUserData = meTopics => {
  if (meTopics && meTopics.public) {
    const privateData = meTopics.private || {};
    const userInfo = _.reduce(meTopics.public, reformatData, privateData);
    store.dispatch(lockAction.setUserInfo(userInfo, meTopics.public));
    store.dispatch(
      loaderAction.saveAppData({
        [dataEntry.profileImage.stateName]: userInfo.avatar
          ? userInfo.avatar
          : dataEntry.profileImage.initValue,
        [dataEntry.profileName.stateName]: userInfo.name,
      })
    );
  }
};
