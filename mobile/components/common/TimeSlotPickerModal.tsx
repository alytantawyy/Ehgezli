import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { format } from 'date-fns';
import { modalStyles } from '../../styles/ModalStyles';

interface TimeSlot {
  id: number;
  time: string;
  isFull?: boolean;
}

interface TimeSlotPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (slotId: number, slotTime: string) => void;
  timeSlots: TimeSlot[];
  selectedTimeSlotId: number | null;
  loading?: boolean;
}

export default function TimeSlotPickerModal({
  visible,
  onClose,
  onSelect,
  timeSlots,
  selectedTimeSlotId,
  loading = false
}: TimeSlotPickerModalProps) {
  
  // Helper function to format time with AM/PM
  const formatTimeWithAMPM = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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
          <Text style={modalStyles.modalTitle}>Select Available Time</Text>
          
          {loading ? (
            <View style={modalStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#B22222" />
              <Text style={modalStyles.loadingText}>Loading available times...</Text>
            </View>
          ) : timeSlots.length === 0 ? (
            <View style={modalStyles.noDataContainer}>
              <Text style={modalStyles.noDataText}>No available time slots for this date</Text>
            </View>
          ) : (
            <FlatList
              data={timeSlots}
              keyExtractor={(item) => item.id.toString()}
              style={modalStyles.optionsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    modalStyles.optionItem, 
                    selectedTimeSlotId === item.id && modalStyles.selectedOption,
                    item.isFull && modalStyles.disabledOption
                  ]}
                  onPress={() => {
                    if (!item.isFull) {
                      onSelect(item.id, item.time);
                      onClose();
                    }
                  }}
                  disabled={item.isFull}
                >
                  <Text 
                    style={[
                      modalStyles.optionText, 
                      selectedTimeSlotId === item.id && modalStyles.selectedOptionText,
                      item.isFull && modalStyles.disabledOptionText
                    ]}
                  >
                    {formatTimeWithAMPM(item.time)}
                    {item.isFull && ' (Full)'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
          
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

