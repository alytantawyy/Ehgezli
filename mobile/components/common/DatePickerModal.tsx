import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { format, addDays } from 'date-fns';
import { modalStyles } from '../../styles/ModalStyles';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date;
  minDate?: Date;
  maxDays?: number;
}

export default function DatePickerModal({
  visible,
  onClose,
  onSelect,
  selectedDate,
  minDate = new Date(),
  maxDays = 7,
}: DatePickerModalProps) {
  // Generate dates for the next week
  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < maxDays; i++) {
      const date = addDays(minDate, i);
      dates.push({
        label: format(date, 'EEE, MMM d'),  // e.g., "Mon, May 25"
        value: format(date, 'yyyy-MM-dd'),
        date: date,
      });
    }
    return dates;
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
          <Text style={modalStyles.modalTitle}>Select Date</Text>
          
          <FlatList
            data={generateDates()}
            keyExtractor={(item) => item.value}
            style={modalStyles.optionsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  modalStyles.optionItem, 
                  format(selectedDate, 'yyyy-MM-dd') === item.value && modalStyles.selectedOption
                ]}
                onPress={() => {
                  onSelect(item.date);
                  onClose();
                }}
              >
                <Text 
                  style={[
                    modalStyles.optionText, 
                    format(selectedDate, 'yyyy-MM-dd') === item.value && modalStyles.selectedOptionText
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
