const React = require('react');
const { View, Text } = require('react-native');

class MapView extends React.Component {
  animateToRegion() {}
  render() {
    return React.createElement(
      View,
      { 
        style: [
          { flex: 1, backgroundColor: '#E5EFF5', justifyContent: 'center', alignItems: 'center', position: 'relative' },
          this.props.style
        ]
      },
      React.createElement(
        Text, 
        { style: { color: '#0B1021', fontWeight: 'bold', fontSize: 16 } }, 
        "🗺️ [Web Preview] Interactive Map Mock"
      ),
      this.props.children
    );
  }
}

class Marker extends React.Component {
  render() {
    return React.createElement(
      View,
      { style: { position: 'absolute', transform: [{ translateX: -20 }, { translateY: -20 }] } },
      this.props.children
    );
  }
}

module.exports = MapView;
module.exports.Marker = Marker;
module.exports.PROVIDER_GOOGLE = 'google';
