import React from 'react';
import {
	View,
	ActivityIndicator,
	StyleSheet,
	Text
} from 'react-native';

import Card from '../card/Card';
import ShuttleOverview from './ShuttleOverview';
import LocationRequiredContent from '../common/LocationRequiredContent';
import { doPRM, getMaxCardWidth } from '../../util/general';

const ShuttleCard = ({ stopData, permission, gotoShuttleStop, stopID }) => {
	let content;
	// no permission to get location
	if (permission !== 'authorized') {
		content = (<LocationRequiredContent />);
	} else if (stopID === -1 && (!stopData || !stopData[stopID].arrivals || stopData[stopID].arrivals.length === 0)) {
		content =  (
			<View style={[styles.shuttle_card_row_center, styles.shuttle_card_loader]}>
				<ActivityIndicator size="large" />
			</View>
		);
	} else if (stopID !== -1 && (!stopData || !stopData[stopID].arrivals || stopData[stopID].arrivals.length === 0)) {
		content = (
			<View style={[styles.shuttle_card_row_center, styles.shuttle_card_loader]}>
				<Text style={styles.fs18}>No Shuttles en Route</Text>
				<Text style={[styles.pt10, styles.fs12, styles.dgrey]}>We were unable to locate any nearby shuttles, please try again later.</Text>
			</View>
		);
	}
	else {
		content =  (
			<ShuttleOverview
				onPress={() => gotoShuttleStop(stopID)}
				stopData={stopData}
				stopID={stopID}
			/>);
	}

	return (
		<Card id="shuttle" title="Shuttle" cardRefresh={this.refresh} isRefreshing={false}>
			{content}
		</Card>
	);

	/*
	// both stops failed to load
	if (this.state.closestStop1LoadFailed && this.state.closestStop2LoadFailed) {
		return (
			<View style={styles.shuttlecard_loading_fail}>
				<Text style={styles.fs18}>No Shuttles en Route</Text>
				<Text style={[styles.pt10, styles.fs12, styles.dgrey]}>We were unable to locate any nearby shuttles, please try again later.</Text>
			</View>
		);
	}*/
};

export default ShuttleCard;

// There's gotta be a better way to do this...find a way to get rid of magic numbers
const nextArrivals = ((2 * doPRM(36)) + 32) + doPRM(20); // Two rows + text
const cardHeader = 26; // font + padding
const cardBody = doPRM(83) + (2 * doPRM(20)) + doPRM(26) + 20; // top + margin + font + padding

const styles = StyleSheet.create({
	shuttle_card_row_center: { alignItems: 'center', justifyContent: 'center', width: getMaxCardWidth(), overflow: 'hidden' },
	shuttle_card_loader: { height: nextArrivals + cardHeader + cardBody },
	shuttlecard_loading_fail: { marginHorizontal: doPRM(16), marginTop: doPRM(40), marginBottom: doPRM(60) },
	fs18: { fontSize: doPRM(18) },
	pt10: { paddingTop: 10 },
	fs12: { fontSize: doPRM(12) },
	dgrey: { color: '#333' },
});
