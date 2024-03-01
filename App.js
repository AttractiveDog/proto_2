import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Image,
  PermissionsAndroid,
} from 'react-native';
import { BleManager } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Graph2 from './components/graph2'; // Import the Graph component
import Graph from './components/Graph';
import { OnboardFlow } from 'react-native-onboard';


global.Buffer = global.Buffer || Buffer;

const bleManager = new BleManager();

// Android Bluetooth Permission
async function requestLocationPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location permission for bluetooth scanning',
        message:
          'Grant location permission to allow the app to scan for Bluetooth devices',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Location permission for bluetooth scanning granted');
    } else {
      console.log('Location permission for bluetooth scanning denied');
    }
  } catch (err) {
    console.warn(err);
  }
}

requestLocationPermission();

const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const glyco_DATA_CHAR_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

export default function App() {
  const [deviceID, setDeviceID] = useState(null);
  const [glycoCount, setGlycoCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Searching...');
  const [glycoData, setGlycoData] = useState([]);
  
  const deviceRef = useRef(null);

  const searchAndConnectToDevice = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error(error);
        setConnectionStatus('Error searching for devices');
        return;
      }
      if (device.name === 'ESP32') {
        bleManager.stopDeviceScan();
        setConnectionStatus('Connecting...');
        connectToDevice(device);
      }
    });
  };

  useEffect(() => {
    searchAndConnectToDevice();
  }, []);

  const connectToDevice = (device) => {
    return device
      .connect()
      .then((device) => {
        setDeviceID(device.id);
        setConnectionStatus('Connected');
        deviceRef.current = device;
        return device.discoverAllServicesAndCharacteristics();
      })
      .then((device) => {
        return device.services();
      })
      .then((services) => {
        let service = services.find((service) => service.uuid === SERVICE_UUID);
        return service.characteristics();
      })
      .then((characteristics) => {
        let glycoDataCharacteristic = characteristics.find(
          (char) => char.uuid === glyco_DATA_CHAR_UUID
        );

        glycoDataCharacteristic.monitor((error, char) => {
          if (error) {
            console.error(error);
            return;
          }

          const rawGlycoData = Buffer.from(char.value, 'base64');

          if (rawGlycoData.length >= 2) {
            const glycoCountValue = (rawGlycoData[1] << 8) | rawGlycoData[0];
            console.log('Received glyco count:', glycoCountValue);
            setGlycoCount(glycoCountValue)
            
            // Fetch existing data from AsyncStorage
            AsyncStorage.getItem('glycoData')
              .then(existingData => {
                const newData = JSON.parse(existingData) || []; // Parse existing data or initialize an empty array
                const newDataPoint = { timestamp: new Date().toISOString(), value: glycoCountValue }; // Create new data point with current timestamp
                newData.push(newDataPoint); // Add new data point to array
                return AsyncStorage.setItem('glycoData', JSON.stringify(newData)); // Store updated array back to AsyncStorage
              })
              .catch(error => console.error('Error storing glycoCount:', error));
            
            // Update Glycose data for graph
            const newDataPoint = { timestamp: new Date(), value: glycoCountValue };
            setGlycoData((prevData) => [...prevData, newDataPoint]);
            console.log(newDataPoint)
          } else {
            console.log('Error: Not enough data to form a 16-bit integer');
          }
        });
      })
      .catch((error) => {
        console.log(error);
        setConnectionStatus('Error in Connection');
      });
  };

  useEffect(() => {
    AsyncStorage.getItem('glycoCount')
      .then(value => {
        if (value !== null) {
          setGlycoCount(JSON.parse(value));
        }
      })
      .catch(error => console.error('Error retrieving glycoCount:', error));
  }, []);

  useEffect(() => {
    const subscription = bleManager.onDeviceDisconnected(
      deviceID,
      (error, device) => {
        if (error) {
          console.log('Disconnected with error:', error);
        }
        setConnectionStatus('Disconnected');
        console.log('Disconnected device');
        setGlycoCount(0); // Reset the Glycose count {glycoData.length > 0 ? <Graph glycoData={glycoData} /> : null}
        if (deviceRef.current) {
          setConnectionStatus('Reconnecting...');
          connectToDevice(deviceRef.current)
            .then(() => setConnectionStatus('Connected'))
            .catch((error) => {
              console.log('Reconnection failed: ', error);
              setConnectionStatus('Reconnection failed');
            });
        }
      }
    );
    return () => subscription.remove();
  }, [deviceID]);
  const img1 = Image.resolveAssetSource(require('./assets/3.png')).uri;
  return (
    <View style={styles.container}>
      <OnboardFlow pages={[
        {
          title: 'Welcome to Glydose',
          subtitle: 'Connect your CGM now and Track your health.',
          imageUri: img1
        },
        {
          title: 'Buy cool stuff',
          subtitle: 'Remember that ice cream you wanted to buy?',
          imageUri: 'https://illlustrations.co/static/15d8c30e1f77fd78c3b83b9fca9c3a92/day81-ice-cream.png'
        },
        {
          title: 'The right tools',
          subtitle: 'Our app can do anything. Literally anything. We are that good.',
          imageUri: 'https://illlustrations.co/static/a547d1bc532ad86a13dd8f47d754f0a1/day77-pocket-knief.png'
        }
      ]}
      type='bottom-sheet' // Change to either 'fullscreen', 'bottom-sheet', or 'inline'
       />
      <View style={styles.contentWrapper}>
        <View style={styles.topTitle}>
          <View style={styles.glycoTitleWrapper}>
            <Image source={require('./assets/5.png')} style={{height:75, width:75, borderRadius: 50, padding:10, elevation:10}}/>
            
          </View>
          
          <View style={styles.stepWrapper}>
  <Text style={{ fontWeight: 'bold', color: '#000', fontSize: 30}}>GLYDOSE</Text>
</View>

        </View>
        <View style={styles.graphBlock}>
        <View style={styles.graph}>
        {glycoData.length > 0 ? <Graph2 glycoData={glycoData} /> : null}
        </View>
        
        </View>
        
      </View>
      <Text style={styles.steps}>Glucose Level :{glycoCount}</Text>
      
      <View style={styles.bottomWrapper}>
        <Text style={styles.connectionStatus}>{connectionStatus}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
   // Light grey background
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
    width: '100%',
  },
  topTitle: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  
  glycoTitleWrapper: {
    position: 'absolute', // Position the wrapper absolutely
    top: 20, // Adjust top position as needed
    left: 20, // Adjust left position as needed
    
    backgroundColor: '#FFF', // Background color for the logo wrapper
    borderRadius: 50, // Border radius for the logo wrapper
    elevation: 5, // Add elevation
    shadowColor: '#000', // Shadow color
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25, // Shadow opacity
    shadowRadius: 3.84, // Shadow radius
  },
  
  
  
  stepWrapper: {
    position: 'absolute', // Position the wrapper absolutely
    top: 30, // Adjust top position as needed
    left: 100, // Adjust left position as needed
    flexDirection: 'row', // Arrange children in a row
    alignItems: 'center', // Align children vertically centered
    padding: 10,
    elevation: 5, // Add elevation
  },
  
  
  
  
  title: {
    fontSize: 24,
    color: '#fff', // White text color
    fontFamily: 'Arial', // Custom font family
  },
  bottomWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Orange background
    marginBottom: 10,
    height: '10%',
    borderRadius: 100,
    width: '90%',
    elevation: 10000, 
    left: 20// Add elevation
  },
  connectionStatus: {
    fontSize: 20,
    color: '#fff', // White text color
    fontWeight: 'bold',
    fontFamily: 'Arial', // Custom font family
  },
  steps: {
    left: '17%',
    fontSize: 30,
    color: '#000',
    bottom: 80 // Dark text color
  },
  graph: {
    height: 500,
    top: 30,
   
    padding: 40,
    flex: 1,
    elevation: 5, // Add elevation
    borderRadius: 50, // Add border radius
    backgroundColor: '#fff', // Add background color
    marginBottom: 200, // Add margin bottom
  },
  graphBlock: {
    top: 80,
    paddingLeft : 20,
    paddingRight: 20
  },
  
});

