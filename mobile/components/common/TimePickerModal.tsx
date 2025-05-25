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
  startHour?: number;
  endHour?: number;
  interval?: number;
}

export default function TimePickerModal({
  visible,
  onClose,
  onSelect,
  selectedTime,
  startHour = 12,
  endHour = 22,
  interval = 30,
}: TimePickerModalProps) {
  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    const baseDate = new Date();
    baseDate.setSeconds(0);
    baseDate.setMilliseconds(0);
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
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
