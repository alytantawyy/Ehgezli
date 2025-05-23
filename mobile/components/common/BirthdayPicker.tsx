import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface BirthdayPickerProps {
  birthday: Date | null;
  setBirthday?: (date: Date) => void;
  onClose?: () => void;
}

export default function BirthdayPicker({
  birthday,
  setBirthday,
  onClose,
}: BirthdayPickerProps) {
  // Initialize with default date if no birthday provided
  const today = new Date();
  const defaultYear = today.getFullYear() - 18;
  const initialDate = birthday || new Date(defaultYear, 0, 1);
  
  // State for the displayed date
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  // Modal visibility states
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  
  // Temporary state for the picker values
  const [tempYear, setTempYear] = useState(selectedDate.getFullYear().toString());
  const [tempMonth, setTempMonth] = useState(selectedDate.getMonth().toString());
  const [tempDay, setTempDay] = useState(selectedDate.getDate().toString());

  // Generate arrays for picker values
  const years = [];
  for (let i = 0; i < 100; i++) {
    const year = (today.getFullYear() - i).toString();
    years.push(year);
  }
  
  const months = [
    { label: 'January', value: '0' },
    { label: 'February', value: '1' },
    { label: 'March', value: '2' },
    { label: 'April', value: '3' },
    { label: 'May', value: '4' },
    { label: 'June', value: '5' },
    { label: 'July', value: '6' },
    { label: 'August', value: '7' },
    { label: 'September', value: '8' },
    { label: 'October', value: '9' },
    { label: 'November', value: '10' },
    { label: 'December', value: '11' },
  ];

  // Calculate days in the selected month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Generate days array
  const generateDays = () => {
    const daysInMonth = getDaysInMonth(parseInt(tempYear), parseInt(tempMonth));
    const daysArray = [];
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i.toString());
    }
    return daysArray;
  };

  // Update parent when selectedDate changes
  useEffect(() => {
    if (setBirthday) {
      setBirthday(selectedDate);
    }
    
    // Close the picker if onClose is provided
    if (onClose) {
      onClose();
    }
  }, [selectedDate, setBirthday, onClose]);

  // Update local state when birthday prop changes
  useEffect(() => {
    if (birthday) {
      setSelectedDate(birthday);
      setTempYear(birthday.getFullYear().toString());
      setTempMonth(birthday.getMonth().toString());
      setTempDay(birthday.getDate().toString());
    }
  }, [birthday]);

  // Format date for display
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const monthName = months[date.getMonth()].label.substring(0, 3);
    const year = date.getFullYear();
    return `${day} ${monthName} ${year}`;
  };

  // Open year picker
  const openYearPicker = () => {
    setTempYear(selectedDate.getFullYear().toString());
    setYearModalVisible(true);
  };

  // Open month picker
  const openMonthPicker = () => {
    setTempMonth(selectedDate.getMonth().toString());
    setMonthModalVisible(true);
  };

  // Open day picker
  const openDayPicker = () => {
    setTempDay(selectedDate.getDate().toString());
    setDayModalVisible(true);
  };

  // Confirm year selection
  const confirmYear = () => {
    const yearNum = parseInt(tempYear);
    const monthNum = parseInt(tempMonth);
    const maxDays = getDaysInMonth(yearNum, monthNum);
    const dayNum = Math.min(parseInt(tempDay), maxDays);
    
    const newDate = new Date(selectedDate);
    newDate.setFullYear(yearNum);
    newDate.setDate(dayNum);
    
    setSelectedDate(newDate);
    setYearModalVisible(false);
  };

  // Confirm month selection
  const confirmMonth = () => {
    const yearNum = parseInt(tempYear);
    const monthNum = parseInt(tempMonth);
    const maxDays = getDaysInMonth(yearNum, monthNum);
    const dayNum = Math.min(parseInt(tempDay), maxDays);
    
    const newDate = new Date(selectedDate);
    newDate.setMonth(monthNum);
    newDate.setDate(dayNum);
    
    setSelectedDate(newDate);
    setMonthModalVisible(false);
  };

  // Confirm day selection
  const confirmDay = () => {
    const dayNum = parseInt(tempDay);
    
    const newDate = new Date(selectedDate);
    newDate.setDate(dayNum);
    
    setSelectedDate(newDate);
    setDayModalVisible(false);
  };

  // Cancel selection
  const cancelSelection = (type: 'year' | 'month' | 'day') => {
    if (type === 'year') {
      setTempYear(selectedDate.getFullYear().toString());
      setYearModalVisible(false);
    } else if (type === 'month') {
      setTempMonth(selectedDate.getMonth().toString());
      setMonthModalVisible(false);
    } else {
      setTempDay(selectedDate.getDate().toString());
      setDayModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerButtonsRow}>
        <TouchableOpacity 
          style={[styles.pickerButton, { marginRight: 5 }]} 
          onPress={openDayPicker}
          activeOpacity={0.7}
        >
          <Text style={styles.pickerButtonText}>Day</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.pickerButton, { marginHorizontal: 5 }]} 
          onPress={openMonthPicker}
          activeOpacity={0.7}
        >
          <Text style={styles.pickerButtonText}>Month</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.pickerButton, { marginLeft: 5 }]} 
          onPress={openYearPicker}
          activeOpacity={0.7}
        >
          <Text style={styles.pickerButtonText}>Year</Text>
        </TouchableOpacity>
      </View>

      {/* Year Picker Modal */}
      <Modal
        visible={yearModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.modalTitle}>Select Year</Text>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempYear}
                onValueChange={(value) => setTempYear(value)}
                style={styles.picker}
                itemStyle={styles.pickerItemStyle}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={year} value={year} />
                ))}
              </Picker>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => cancelSelection('year')}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={confirmYear}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Month Picker Modal */}
      <Modal
        visible={monthModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.modalTitle}>Select Month</Text>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempMonth}
                onValueChange={(value) => setTempMonth(value)}
                style={styles.picker}
                itemStyle={styles.pickerItemStyle}
              >
                {months.map((month) => (
                  <Picker.Item key={month.value} label={month.label} value={month.value} />
                ))}
              </Picker>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => cancelSelection('month')}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={confirmMonth}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Day Picker Modal */}
      <Modal
        visible={dayModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.modalTitle}>Select Day</Text>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempDay}
                onValueChange={(value) => setTempDay(value)}
                style={styles.picker}
                itemStyle={styles.pickerItemStyle}
              >
                {generateDays().map((day) => (
                  <Picker.Item 
                    key={day} 
                    label={day.padStart(2, '0')} 
                    value={day} 
                  />
                ))}
              </Picker>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => cancelSelection('day')}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={confirmDay}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  pickerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: '#B01C2E',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pickerButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  pickerContainer: {
    height: 200,
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
  },
  picker: {
    height: 200,
  },
  pickerItemStyle: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#B01C2E',
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  confirmButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#fff',
  },
});
