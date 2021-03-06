import React from 'react';
import {
	View,
	Dimensions,
	ScrollView,
	Text,
	StyleSheet,
	TouchableOpacity,
	Platform,
	StatusBar,
	BackAndroid
} from 'react-native';
import { connect } from 'react-redux';
import ElevatedView from 'react-native-elevated-view';
import Icon from 'react-native-vector-icons/FontAwesome';
import MapView from 'react-native-maps';

import SearchBar from './SearchBar';
import SearchMap from './SearchMap';
import SearchResults from './SearchResults';
import SearchHistoryCard from './SearchHistoryCard';
import SearchSuggest from './SearchSuggest';
import SearchShuttleMenu from './SearchShuttleMenu';
import ShuttleLocationContainer from '../../containers/shuttleLocationContainer';

import { toggleRoute } from '../../actions/shuttle';
import { fetchSearch } from '../../actions/map';

import css from '../../styles/css';
import logger from '../../util/logger';
import { getPRM, gotoNavigationApp } from '../../util/general';

const deviceHeight = Dimensions.get('window').height;
const deviceWidth = Dimensions.get('window').width;
const statusBarHeight = Platform.select({
	ios: 0,
	android: StatusBar.currentHeight,
});

class NearbyMapView extends React.Component {

	constructor(props) {
		super(props);

		this.state = {
			searchInput: null,
			selectedResult: 0,
			typing: false,
			allowScroll: false,
			iconStatus: 'search',
			showBar: false,
			showShuttle: true,
			showNav: false,
			showMenu: false,
			toggled: false,
			vehicles: {},
		};
	}

	componentWillMount() {
		Object.keys(this.props.shuttle_routes).forEach((key, index) => {
			this.setState({ ['route' + key] : false });
		});
	}

	componentDidMount() {
		logger.ga('View mounted: Full Map View');

		BackAndroid.addEventListener('hardwareBackPress', this.pressIcon);
	}

	componentWillReceiveProps(nextProps) {
		// Loop thru every vehicle
		Object.keys(nextProps.vehicles).forEach((key, index) => {
			if (this.state.vehicles[key]) {
				nextProps.vehicles[key].forEach((nextVehicle) => {
					this.state.vehicles[key].forEach((currVehicle) => {
						if (nextVehicle.id === currVehicle.id &&
							(nextVehicle.lat !== currVehicle.lat || nextVehicle.lon !== currVehicle.lon)) {
							// Animate vehicle movement
							currVehicle.animated.timing({
								latitude: nextVehicle.lat,
								longitude: nextVehicle.lon,
								duration: 500
							}).start();
						}
					});
				});
			} else {
				// Make Animated values
				nextProps.vehicles[key].forEach((nextVehicle) => {
					nextVehicle.animated = new MapView.AnimatedRegion({
						latitude: nextVehicle.lat,
						longitude: nextVehicle.lon,
					});
				});

				const newVehicles = this.state.vehicles;
				newVehicles[key] = nextProps.vehicles[key];

				this.setState({
					vehicles: newVehicles
				});
			}
		});

		if (this.state.iconStatus === 'load' && nextProps.search_results) {
			this.setState({
				iconStatus: 'search'
			});
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		// Don't re-render if location hasn't changed
		if (((this.props.location.coords.latitude !== nextProps.location.coords.latitude) ||
			(this.props.location.coords.longitude !== nextProps.location.coords.longitude)) ||
			this.state !== nextState ||
			this.props.search_results !== nextProps.search_results) {
			/*
			(this.state.selectedResult !== nextState.selectedResult) ||
			(this.state.iconStatus !== nextState.iconStatus) ||
			(this.state.showBar !== nextState.showBar) ||
			(this.state.showMenu !== nextState.showMenu) ||
			(this.state.route1 !== nextState.route1)) {*/

			return true;
		} else {
			return false;
		}
	}

	componentWillUnmount() {
		BackAndroid.removeEventListener('hardwareBackPress', this.pressIcon);
		clearTimeout(this.timer);
	}

	pressIcon = () => {
		if (this.state.iconStatus === 'back') {
			this.setState({
				iconStatus: 'search',
				showBar: (this.props.search_results !== null),
				showShuttle: true,
				showNav: true,
			});
			this.scrollRef.scrollTo({ x: 0, y: 0, animated: true });
			// this.barRef.clear();
			this.barRef.blur();
			return true;
		} else {
			return false;
		}
	}

	gotoResults = () => {
		this.setState({
			iconStatus: 'back',
			showBar: false,
			showShuttle: false,
			showNav: false
		});
		this.scrollRef.scrollTo({ x: 0, y: deviceHeight - 64 - statusBarHeight, animated: true });
	}

	focusSearch = () => {
		this.scrollRef.scrollTo({ x: 0, y: 2 * (deviceHeight - 64 - statusBarHeight), animated: true });
		this.setState({
			iconStatus: 'back',
			showBar: false,
			showShuttle: false,
			showNav: false,
		});
	}

	gotoShuttleSettings = () => {
		this.setState({
			iconStatus: 'back',
			showBar: false,
			showShuttle: false,
			showNav: false,
		});
		this.scrollRef.scrollTo({ x: 0, y: 3 * (deviceHeight - 64 - statusBarHeight), animated: true });
	}

	updateSearch = (text) => {
		this.props.fetchSearch(text);
		this.scrollRef.scrollTo({ x: 0, y: 0, animated: true });
		this.barRef.blur();

		this.setState({
			searchInput: text,
			showBar: true,
			iconStatus: 'load',
			showShuttle: true,
			showNav: true,
			selectedResult: 0
		});

		this.timer = setTimeout(this.searchTimeout, 5000);
	}

	searchTimeout = () => {
		if (!this.props.search_results) {
			this.setState({
				searchInput: 'No Results Found',
				iconStatus: 'search'
			});
		}
	}

	updateSearchSuggest = (text) => {
		this.props.fetchSearch(text, this.props.location);
		this.scrollRef.scrollTo({ x: 0, y: 0, animated: true });
		this.barRef.blur();

		this.setState({
			searchInput: text,
			showBar: true,
			iconStatus: 'load',
			showShuttle: true,
			showNav: true,
			selectedResult: 0
		});
	}

	updateSelectedResult = (index) => {
		const newSelect = index;
		this.setState({
			iconStatus: 'search',
			selectedResult: newSelect,
			showBar: true,
			showShuttle: true,
			showNav: true,
		});
		this.scrollRef.scrollTo({ x: 0, y: 0, animated: true });
	}

	toggleRoute = (value, route) => {
		this.props.toggle(route);

		const vehicles = this.state.vehicles;
		delete vehicles[route];

		this.setState({
			toggled: !this.state.toggled,
			vehicles });
	}

	render() {
		if (this.props.location.coords) {
			return (
				<View style={css.main_container}>
					{
						(this.props.search_results && this.state.showNav) ? (
							<ElevatedView
								style={{ zIndex: 2, justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: (2 * (6 + Math.round(44 * getPRM()))) + 12, right: 6, width: 50, height: 50, borderRadius: 50 / 2, backgroundColor: '#2196F3' }}
								elevation={2} // zIndex style and elevation has to match
							>
								<TouchableOpacity
									onPress={() => gotoNavigationApp(this.props.search_results[this.state.selectedResult].mkrLat, this.props.search_results[this.state.selectedResult].mkrLong)}
								>
									<Icon name={'location-arrow'} size={20} color={'white'} />
								</TouchableOpacity>
							</ElevatedView>
						) : (<ElevatedView />) // Android bug - breaks view if this is null...on RN39...check if this bug still exists in RN40 or if this can be changed to null
					}
					{
						(this.state.showShuttle) ? (
							<ElevatedView
								style={{ zIndex: 2, justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 6 + Math.round(44 * getPRM()), right: 6, width: 50, height: 50, borderRadius: 50 / 2, backgroundColor: '#346994' }}
								elevation={2} // zIndex style and elevation has to match
							>
								<TouchableOpacity
									onPress={this.gotoShuttleSettings}
								>
									<Icon name={'bus'} size={20} color={'white'} />
								</TouchableOpacity>
							</ElevatedView>
						) : (<ElevatedView />) // Android bug
					}
					<SearchBar
						update={this.updateSearch}
						onFocus={this.focusSearch}
						pressIcon={this.pressIcon}
						iconStatus={this.state.iconStatus}
						searchInput={this.state.searchInput}
						reff={
							(ref) => { this.barRef = ref; }
						}
					/>
					<ScrollView
						ref={
							(ref) => {
								this.scrollRef = ref;
							}
						}
						showsVerticalScrollIndicator={false}
						scrollEnabled={this.state.allowScroll}
					>
						<View
							style={styles.section}
						>
							<SearchMap
								location={this.props.location}
								selectedResult={
									(this.props.search_results) ? (
										this.props.search_results[this.state.selectedResult]
									) : null
								}
								shuttle={this.props.shuttle_stops}
								vehicles={this.state.vehicles}
							/>
						</View>
						<View
							style={styles.section}
						>
							<SearchResults
								results={this.props.search_results}
								onSelect={(index) => this.updateSelectedResult(index)}
							/>
						</View>
						<View
							style={styles.section}
						>
							<SearchSuggest
								onPress={this.updateSearchSuggest}
							/>
							{(this.props.search_history.length !== 0) ? (
								<SearchHistoryCard
									pressHistory={this.updateSearch}
									data={this.props.search_history}
								/>
								) : (null)}
						</View>
						<View
							style={styles.section}
						>
							<SearchShuttleMenu
								shuttle_routes={this.props.shuttle_routes}
								onToggle={this.toggleRoute}
								toggles={this.props.toggles}
							/>
						</View>
					</ScrollView>
					{(this.state.showBar && this.props.search_results) ? (
						<ElevatedView
							style={styles.bottomBarContainer}
							elevation={5}
						>
							<TouchableOpacity
								style={styles.bottomBarContent}
								onPress={
									this.gotoResults
								}
							>
								<Text
									style={styles.bottomBarText}
								>
									See More Results
								</Text>
							</TouchableOpacity>
						</ElevatedView>
						) : (null)
					}
					<ShuttleLocationContainer />
				</View>
			);
		} else {
			return null;
		}
	}
}

const mapStateToProps = (state, props) => (
	{
		location: state.location.position,
		locationPermission: state.location.permission,
		toggles: state.shuttle.toggles,
		shuttle_routes: state.shuttle.routes,
		shuttle_stops: state.shuttle.stops,
		vehicles: state.shuttle.vehicles,
		search_history: state.map.history,
		search_results: state.map.results
	}
);

const mapDispatchToProps = (dispatch, ownProps) => (
	{
		fetchSearch: (term, location) => {
			dispatch(fetchSearch(term, location));
		},
		toggle: (route) => {
			dispatch(toggleRoute(route));
		}
	}
);

module.exports = connect(mapStateToProps, mapDispatchToProps)(NearbyMapView);

const navMargin = Platform.select({
	ios: 64,
	android: 0
});

const styles = StyleSheet.create({
	main_container: { width: deviceWidth, height: deviceHeight - 64 - statusBarHeight, backgroundColor: '#EAEAEA', marginTop: navMargin },
	bottomBarContainer: { zIndex: 5, alignItems: 'center', justifyContent: 'center', position: 'absolute', bottom: 0, width: deviceWidth, height: Math.round(44 * getPRM()), borderWidth: 0, backgroundColor: 'white', },
	bottomBarContent: { flex: 1, justifyContent: 'center', alignSelf: 'stretch' },
	bottomBarText: { textAlign: 'center', },

	section: { height: deviceHeight - 64 - statusBarHeight },
});

