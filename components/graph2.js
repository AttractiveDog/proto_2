import React, { useRef, useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { LineChart } from 'react-native-wagmi-charts';
import { XAxis, YAxis } from 'react-native-svg-charts';

const Graph2 = ({ glycoData }) => {
  const [visibleData, setVisibleData] = useState([]);
  const scrollViewRef = useRef();
  const [chunkSize, setChunkSize] = useState(10); // Initial chunk size

  useEffect(() => {
    if (glycoData && glycoData.length > 0) {
      const visible = glycoData.slice(-chunkSize);
      setVisibleData(visible);
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }
  }, [glycoData, chunkSize]);

  

  if (!glycoData || glycoData.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const yValues = [90,95,100,105,110.115,120,125,130,135,140,145,150]
  const xValues = glycoData.map(dataPoint => dataPoint.timestamp);
  
  const formatHourMinute = (value, index) => {
    const date = new Date(value);
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    return `${hour}:${minute}`;
  };

  return (
    <View style={{ flex: 1}}>
      <View style={{ flexDirection: 'row' }}>
        <YAxis
          data={yValues}
          contentInset={{ top: 20, bottom: 20 }}
          svg={{ fill: 'black', fontSize: 10, fontWeight: 'bold' }}
          numberOfTicks={10}
        />
        <ScrollView
          ref={scrollViewRef}
          horizontal={true}
          contentContainerStyle={{ flexGrow: 1 }}
          
          scrollEventThrottle={16}
        >
          <LineChart.Provider data={glycoData}>
            <LineChart>
              <LineChart.Path />
              
            </LineChart>
          </LineChart.Provider>
        </ScrollView>
      </View>
    </View>
  );
};

export default Graph2;
