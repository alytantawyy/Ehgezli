import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { format, parse, setHours, setMinutes } from 'date-fns';
import { modalStyles } from '../../styles/ModalStyles';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (time: Date) => void;
  selectedTime: Date;
  selectedDate: Date;
  startHour?: number;
  endHour?: number;
  interval?: number;
}

export default function TimePickerModal({
  visible,
  onClose,
  onSelect,
  selectedTime,
  selectedDate,
  startHour = 0,
  endHour = 24,
  interval = 30,
}: TimePickerModalProps) {
  // Generate time slots for all 24 hours
  const generateTimeSlots = () => {
    const slots = [];
    const baseDate = new Date();
    baseDate.setSeconds(0);
    baseDate.setMilliseconds(0);
    
    // Check if selected date is today to filter past times
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        // Skip past times if we're selecting for today
        if (isToday && (hour < currentHour || (hour === currentHour && minute <= currentMinute))) {
          continue; // Skip this time as it's in the past
        }
        
        const time = new Date(baseDate);
        time.setHours(hour);
        time.setMinutes(minute);
        
        slots.push({
          label: format(time, 'h:mm a'),  // e.g., "1:30 PM"
          value: format(time, 'HH:mm'),    // e.g., "13:30"
          time: time,
        });
      }
    }
    
    // If no slots are available (all times today have passed),
    // add a message or handle appropriately
    if (slots.length === 0 && isToday) {
      console.warn('No future time slots available for today');
    }
    
    return slots;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.modalContainer}>
        <View style={modalStyles.pickerModalContent}>
          <Text style={modalStyles.modalTitle}>Select Time</Text>
          
          <FlatList
            data={generateTimeSlots()}
            keyExtractor={(item) => item.value}
            style={modalStyles.optionsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  modalStyles.optionItem, 
                  format(selectedTime, 'HH:mm') === item.value && modalStyles.selectedOption
                ]}
                onPress={() => {
                  onSelect(item.time);
                  onClose();
                }}
              >
                <Text 
                  style={[
                    modalStyles.optionText, 
                    format(selectedTime, 'HH:mm') === item.value && modalStyles.selectedOptionText
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
          
          <View style={modalStyles.modalButtons}>
            <TouchableOpacity 
              style={modalStyles.cancelButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={modalStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
