import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Text,
  Keyboard,
} from 'react-native';
import PropTypes from 'prop-types';
import connect from 'react-redux/es/connect/connect';
import _ from 'lodash';
import { bindActionCreators } from 'redux';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import AppStyle from '../../../commons/AppStyle';
import { screensList } from '../../../navigation/screensList';
import TinodeAPI from '../TinodeAPI';
import MessageNode from '../components/MessageNode';
import Images from '../../../commons/Images';
import { topicsAction } from '../actions/topicsAction';
import ActionList from '../components/ActionList';
import { renderImageSource } from '../../../utils/imageUtils';

class TopicScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    headerTitle: navigation.state.params.title,
    headerRight: (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate(screensList.TopicInfo.label, {
            title: navigation.getParam('title', ''),
            allowEdit: true,
            isJoined: true,
          })
        }
        color="white"
        style={styles.dotContainer}>
        <Entypo
          name="dots-three-horizontal"
          size={AppStyle.fontMiddle}
          style={styles.dot}
          color="white"
        />
      </TouchableOpacity>
    ),
    headerBackTitle: ' ',
  });

  static propTypes = {
    navigation: PropTypes.object,
    topicsMap: PropTypes.object.isRequired,
    userId: PropTypes.string.isRequired,
    subscribedChatId: PropTypes.string,
    connected: PropTypes.bool.isRequired,
    userInfo: PropTypes.object.isRequired,
    updateUserInput: PropTypes.func.isRequired,
    avatar: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.state = {
      showAction: false,
      refreshing: false,
      keyboardHeight: 0,
    };
  }

  componentDidMount() {
    const { navigation, userId, subscribedChatId, connected } = this.props;
    const topicId = navigation.getParam('topicId', null);
    if (connected && subscribedChatId !== topicId) {
      if (subscribedChatId !== null) TinodeAPI.unsubscribe(subscribedChatId);
      TinodeAPI.subscribe(topicId, userId);
    }
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', e => {
      this.setState({ keyboardHeight: e.endCoordinates.height });
      this.flatList.scrollToEnd({ animated: true });
    });
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', e =>
      this.setState({ keyboardHeight: 0 })
    );
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  renderUserAvatarSource = () => {
    const { avatar } = this.props;
    return _.isEmpty(avatar) ? Images.blankProfile : { uri: avatar };
  };

  renderMessageNode(message, topic) {
    const { userId, userInfo } = this.props;
    let messageOwnerName;
    let messageOwnerAvatar;
    if (message.from === userId) {
      messageOwnerAvatar = this.renderUserAvatarSource();
      messageOwnerName = userInfo.name;
    } else {
      const messageOwner = _.find(topic.subs, { user: message.from });
      if (messageOwner && messageOwner.public) {
        messageOwnerAvatar = renderImageSource(messageOwner.public.photo);
        messageOwnerName = messageOwner.public.fn;
      } else {
        //EXPO compile the the image as a number in image tree
        messageOwnerAvatar = Images.blankProfile;
        messageOwnerName = message.from;
      }
    }
    return (
      <MessageNode
        message={message}
        imageSource={messageOwnerAvatar}
        senderName={messageOwnerName}
      />
    );
  }

  renderActionButton(topic) {
    const { userId, updateUserInput } = this.props;
    const topicId = topic.topic;
    return _.isEmpty(topic.userInput) ? (
      <TouchableOpacity onPress={() => this.setState({ showAction: !this.state.showAction })}>
        <Ionicons
          name="md-add-circle-outline"
          size={AppStyle.fontMiddleBig}
          color={'black'}
          style={styles.actionButton}
        />
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        onPress={() =>
          TinodeAPI.handleSendMessage(topicId, userId, topic.userInput).then(() =>
            updateUserInput(topicId, '')
          )
        }>
        <View style={styles.sendButton}>
          <Text style={styles.sendButtonText}>{t.SEND}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  onRefresh(topic) {
    this.setState({ refreshing: true });
    TinodeAPI.fetchMoreTopics(topic.topic || topic.name).finally(() =>
      this.setState({ refreshing: false })
    );
  }

  render() {
    const { topicsMap, navigation, updateUserInput } = this.props;
    const { refreshing } = this.state;
    const topicId = navigation.getParam('topicId', null);
    const topic = _.get(topicsMap, topicId);
    if (!topic) return null;
    const { messages } = topic;
    //Todo this height need to be recalculated for precise number with different text length
    const HEIGHT = 66;
    return (
      <View style={styles.container}>
        <KeyboardAwareFlatList
          onRefresh={() => this.onRefresh(topic)}
          refreshing={refreshing}
          // initialScrollIndex={messages.length - 5}
          // getItemLayout={(data, index) => (
          //   {length: HEIGHT, offset: HEIGHT * index, index}
          // )}
          onScrollToIndexFailed={console.log}
          ref={ref => (this.flatList = ref)}
          onContentSizeChange={() => this.flatList.scrollToEnd({ animated: true })}
          onLayout={() => this.flatList.scrollToEnd({ animated: true })}
          style={styles.scrollContainer}
          data={messages}
          keyExtractor={message => message.seq.toString()}
          renderItem={({ item }) => this.renderMessageNode(item, topic)}
        />
        <View style={[styles.actionBar, { bottom: this.state.keyboardHeight }]}>
          <View style={styles.chatContainer}>
            <TextInput
              onChangeText={userInput => {
                updateUserInput(topicId, userInput);
              }}
              value={topic.userInput}
              style={styles.input}
            />
            {this.renderActionButton(topic)}
          </View>
          <ActionList show={this.state.showAction} />
        </View>
      </View>
    );
  }
}

const t = {
  SEND: 'Send',
};

const mapStateToProps = state => ({
  topicsMap: state.topics.topicsMap,
  userId: state.chat.userId,
  subscribedChatId: state.chat.subscribedChatId,
  connected: state.chat.connected,
  userInfo: state.chat.userInfo,
  avatar: state.chat.userInfo.avatar,
});

const mapDispatchToProps = _.curry(bindActionCreators)({
  updateUserInput: topicsAction.updateUserInput,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TopicScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppStyle.mainBackgroundColor,
    position: 'relative',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  dotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    padding: 10,
  },
  actionBar: {
    borderTopWidth: 1,
    borderTopColor: AppStyle.chatActionBackgroundColor,
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
    backgroundColor: AppStyle.chatActionBackgroundColor,

    ...Platform.select({
      ios: {
        shadowColor: AppStyle.chatActionBackgroundColor,
        shadowOffset: {
          width: 0,
          height: -0.5,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.11,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    margin: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionButton: {
    padding: 20,
    paddingLeft: 0,
  },
  sendButton: {
    margin: 10,
    borderRadius: 5,
    backgroundColor: AppStyle.userCancelGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    padding: 10,
    color: 'white',
    fontSize: AppStyle.fontSmall,
    fontFamily: AppStyle.mainFont,
  },
});
