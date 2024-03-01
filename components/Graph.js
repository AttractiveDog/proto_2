import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {LineChart, XAxis, YAxis} from 'react-native-svg-charts';


const Graph = ({glycoData}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth * 2; // Set the width to be twice the screen width

  // Extracting x and y values from the glycoData array
  const yValues = glycoData.map(dataPoint => dataPoint.value);
  const xValues = glycoData.map(dataPoint => dataPoint.timestamp);

  // Determine the range of x-values to show
  const startIndex = Math.max(0, xValues.length - 10); // Start index for the sliding window
  const endIndex = xValues.length - 1; // End index is the latest data point

  // Slice the data arrays to show only the latest 6 values
  const latestYValues = yValues.slice(startIndex, endIndex + 1);
  const latestXValues = xValues.slice(startIndex, endIndex + 1);

  // Custom function to format the hour and minute
  const formatHourMinute = (value, index) => {
    const date = new Date(value);
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${hour}:${minute}`;
  };

  return (
    <View style={styles.chartWrapper}>
      <View style={{width: '100%', height: 300, flexDirection: 'row'}}>
        <YAxis
          data={latestYValues}
          contentInset={{top: 20, bottom: 20}}
          svg={{fill: 'white', fontSize: 10, fontWeight: 'bold'}} // Apply white color and bold font
          numberOfTicks={10}
          formatLabel={value => `${value}`} // Format y-axis labels
        />
        <View style={{flex: 1, marginLeft: 10}}>
          <LineChart
            style={[styles.chart, {width: chartWidth}]}
            data={latestYValues}
            svg={{stroke: 'rgb(134, 65, 244)'}}
            contentInset={{top: 20, bottom: 20}}
          />
          <XAxis
            style={{marginHorizontal: -10, height: 30}}
            data={latestXValues}
            formatLabel={formatHourMinute} // Use custom function to format labels
            contentInset={{left: 20, right: 20}}
            svg={{fontSize: 10, fill: 'white', fontWeight: 'bold'}} // Apply white color and bold font
          />
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  chartWrapper: {
    padding: 20,
    overflow: 'hidden',
  },
  chart: {
    flex: 1,
  },
});

export default Graph;
