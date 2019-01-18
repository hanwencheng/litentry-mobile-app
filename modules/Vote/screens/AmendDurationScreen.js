import React from 'react';
import { Button, StyleSheet, View } from 'react-native';
import connect from 'react-redux/es/connect/connect';
import { bindActionCreators } from 'redux';
import _ from 'lodash';
import AppStyle from '../../../commons/AppStyle';
import { screensList } from '../../../navigation/screensList';
import AmendInput from '../components/AmendInput';
import { groupMetaRules } from '../../../config';

class AmendDurationScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    headerTitle: screensList.AmendDuration.title,
    headerRight: <Button onPress={() => navigation.goBack()} title="Done" color="white" />,
    headerTintColor: 'white',
    headerStyle: {
      backgroundColor: AppStyle.voteHeaderBackgroundColor,
    },
  });

  render() {
    return (
      <View style={styles.container}>
        <AmendInput
          propertyPath={groupMetaRules.REQUIRED_HOUR}
          unit={t.UNIT_TEXT}
          intro={t.INTRO_TEXT}
          description={t.DESCRIPTION_TEXT}
          isNumber
        />
      </View>
    );
  }
}

const t = {
  UNIT_TEXT: 'Hours',
  INTRO_TEXT: 'How long is the voting period ?',
  DESCRIPTION_TEXT:
    'A voting motion must receive enough votes during this period of time in order to pass.',
};

const mapStateToProps = state => ({});

const mapDispatchToProps = _.curry(bindActionCreators)({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AmendDurationScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
