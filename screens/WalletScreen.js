import React from 'react';
import { Text, View, StyleSheet, RefreshControl, ScrollView, Clipboard } from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Ionicons } from '@expo/vector-icons';
import _ from 'lodash';
import { bindActionCreators } from 'redux';
import QRCode from 'react-native-qrcode';
import { walletAction } from '../actions/walletAction';
import { screensList } from '../navigation/screensList';
import AppStyle from '../commons/AppStyle';
import GenesisButton from '../components/GenesisButton';
import NewWalletInnerScreen from '../modules/WalletImport/innerScreens/NewWalletInnerScreen';
import { getEtherBalance, getNumber, getTokenBalance } from '../utils/ethereumUtils';
import { lockScreen } from '../modules/Unlock/lockScreenUtils';
import { getPrivateKeyAsync } from '../utils/secureStoreUtils';
import HeaderButton from '../components/HeaderButton';
import { alertNormal } from '../utils/alertUtils';

class WalletScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    headerTitle: screensList.Wallet.title,
    headerRight: (
      <HeaderButton
        onPress={() => navigation.navigate(screensList.Transactions.label)}
        title={screensList.Transactions.title}
      />
    ),
    headerBackTitle: '',
  });

  constructor(props) {
    super(props);
    this.state = {
      refreshing: false,
    };
  }

  static propTypes = {
    navigation: PropTypes.object,
    walletAddress: PropTypes.string.isRequired,
    updateNes: PropTypes.func.isRequired,
    updateEth: PropTypes.func.isRequired,
    isLoaded: PropTypes.bool.isRequired,
    nes: PropTypes.number,
    eth: PropTypes.number,
  };

  updateBalance() {
    const { walletAddress, updateNes, updateEth } = this.props;
    return getTokenBalance(walletAddress)
      .then(nesBalance => updateNes(nesBalance))
      .then(() => getEtherBalance(walletAddress))
      .then(ethBalance => updateEth(ethBalance))
      .catch(e => console.log('err', e));
  }

  componentDidMount() {
    const { nes, walletAddress } = this.props;
    if (!_.isNull(nes) || _.isNull(walletAddress)) return;
    this.updateBalance();
  }

  onRefresh = () => {
    this.setState({ refreshing: true });
    this.updateBalance().then(() => {
      this.setState({ refreshing: false });
    });
  };

  renderBalance = balance => (_.isNull(balance) ? '0' : balance.toString());

  render() {
    const { walletAddress, nes, eth, navigation, isLoaded } = this.props;
    if (!isLoaded) return null;
    if (_.isEmpty(walletAddress)) return <NewWalletInnerScreen />;
    return (
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />
        }>
        <View style={styles.displayContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="logo-yen" size={32} color={AppStyle.walletBackgroundColor} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.balanceText}>Balance</Text>
            {/*<Text style={styles.amountText}>NES: {this.renderBalance(nes)}</Text>*/}
            <Text style={styles.amountText}>DOT: {this.renderBalance(eth)}</Text>
          </View>
        </View>
        <View style={styles.actionsContainer}>
          <Text style={styles.walletAddress}>{walletAddress}</Text>
          <View style={styles.qrCode}>
            <QRCode value={walletAddress} size={200} bgColor="white" fgColor="black" />
          </View>
          <GenesisButton
            action={() => Clipboard.setString(walletAddress)}
            style={styles.copyButton}
            text={t.COPY_ADDRESS_TEXT}
          />
          <GenesisButton
            action={() =>
              lockScreen(navigation)
                .then(() => new Promise(getPrivateKeyAsync))
                .then(privateKey => {
                  Clipboard.setString(privateKey);
                  alertNormal(t.PRIVATE_KEY_COPIED, () =>
                    navigation.navigate(screensList.Wallet.label)
                  );
                })
            }
            style={styles.copyButton}
            text={t.SHOW_PRIVATE}
          />
          {/*<GenesisButton*/}
          {/*action={()=> {}}*/}
          {/*text={'Receive'}*/}
          {/*style={{ marginTop: 50 }}*/}
          {/*/>*/}
          {/*<GenesisButton action={()=>{}} text={'Send'} disabled />*/}
        </View>
      </ScrollView>
    );
  }
}

const t = {
  COPY_ADDRESS_TEXT: 'Copy Wallet Address',
  SHOW_PRIVATE: 'Copy Private Key',
  PRIVATE_KEY_COPIED: 'Private Key has been copied',
};

const mapStateToProps = state => ({
  walletAddress: state.appState.walletAddress,
  nes: state.wallet.nes,
  eth: state.wallet.eth,
  isLoaded: state.appState.isLoaded,
});

const mapDispatchToProps = _.curry(bindActionCreators)({
  updateNes: walletAction.updateNes,
  updateEth: walletAction.updateEth,
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppStyle.backgroundColor,
  },
  displayContainer: {
    flex: 3,
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppStyle.walletBackgroundColor,
  },
  iconContainer: {
    height: 50,
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    backgroundColor: 'white',
  },
  textContainer: {
    margin: 10,
    alignItems: 'center',
  },
  balanceText: {
    fontSize: AppStyle.fontMiddle,
    color: 'white',
    fontWeight: 'bold',
  },
  amountText: {
    fontSize: AppStyle.fontSmall,
    paddingTop: 10,
    color: 'white',
  },
  actionsContainer: {
    flex: 7,
    alignItems: 'stretch',
    justifyContent: 'space-around',
  },
  walletAddress: {
    alignSelf: 'center',
    fontSize: AppStyle.fontSmall,
    color: AppStyle.lightGrey,
    paddingVertical: 50,
  },
  qrCode: {
    alignSelf: 'center',
  },
  copyButton: {
    backgroundColor: AppStyle.lightGrey,
  },
});
