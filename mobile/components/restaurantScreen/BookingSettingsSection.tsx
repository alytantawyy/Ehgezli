import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { format, parse } from 'date-fns';
import { BookingSettings } from '@/types/branch';
import TimePickerModal from '@/components/common/TimePickerModal';

interface BookingSettingsSectionProps {
  bookingSettings: BookingSettings | null;
  isEditingBookingSettings: boolean;
  setIsEditingBookingSettings: (isEditing: boolean) => void;
  editedSettings: BookingSettings | null;
  setEditedSettings: (settings: BookingSettings | null) => void;
  updateBranchBookingSettings: (branchId: number, settings: BookingSettings) => Promise<void>;
  branchId: number;
}

const BookingSettingsSection: React.FC<BookingSettingsSectionProps> = ({
  bookingSettings,
  isEditingBookingSettings,
  setIsEditingBookingSettings,
  editedSettings,
  setEditedSettings,
  updateBranchBookingSettings,
  branchId,
}) => {
  // State for time picker modals
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Function to handle editing booking settings
  const handleEditBookingSettings = () => {
    if (bookingSettings) {
      setEditedSettings(bookingSettings);
      setIsEditingBookingSettings(true);
    } else {
      // Initialize with default values if no settings exist
      setEditedSettings({
        id: 0,
        branchId: branchId,
        openTime: '09:00',
        closeTime: '17:00',
        interval: 30,
        maxSeatsPerSlot: 20,
        maxTablesPerSlot: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsEditingBookingSettings(true);
    }
  };

  // Function to save edited booking settings
  const handleSaveBookingSettings = () => {
    if (editedSettings) {
      // Parse the time strings and combine with today's date
      const today = new Date();
      
      // Create ISO strings for times
      const [startHour, startMinute] = editedSettings.openTime?.split(':').map(Number);
      const startTimeObj = new Date(today);
      startTimeObj.setHours(startHour, startMinute, 0, 0);
      const isoStartTime = startTimeObj.toISOString();
      
      const [endHour, endMinute] = editedSettings.closeTime?.split(':').map(Number);
      const endTimeObj = new Date(today);
      endTimeObj.setHours(endHour, endMinute, 0, 0);
      const isoEndTime = endTimeObj.toISOString();
      
      // Prepare the settings data with correct formats
      const settingsData = {
        ...editedSettings,
        startTime: isoStartTime,
        endTime: isoEndTime,
        interval: Number(editedSettings.interval),
        maxSeatsPerSlot: Number(editedSettings.maxSeatsPerSlot),
        maxTablesPerSlot: Number(editedSettings.maxTablesPerSlot),
      };
      
      // Debug: Log the formatted settings data
      console.log('Saving booking settings with formatted data:', settingsData);
      
      updateBranchBookingSettings(branchId, settingsData)
        .then(() => {
          Alert.alert('Success', 'Booking settings updated successfully');
          setIsEditingBookingSettings(false);
        })
        .catch((err) => {
          Alert.alert('Error', `Failed to update booking settings: ${err.message}`);
          console.error('Error updating booking settings:', err);
        });
    }
  };

  // Helper function to format time to AM/PM
  const formatTimeToAMPM = (timeString: string) => {
    if (!timeString) return '';
    
    let hours, minutes;
    
    // Check if the timeString is in ISO format or simple HH:mm format
    if (timeString.includes('T')) {
      // It's an ISO date string
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      hours = date.getHours();
      minutes = date.getMinutes();
    } else {
      // It's a simple HH:mm format
      [hours, minutes] = timeString.split(':').map(Number);
    }
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutesStr} ${ampm}`;
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Booking Settings</Text>
        <TouchableOpacity onPress={handleEditBookingSettings}>
          <Text style={styles.editText}>{bookingSettings ? 'Edit' : 'Add'}</Text>
        </TouchableOpacity>
      </View>
      
      {isEditingBookingSettings && editedSettings ? (
        <View style={styles.settingsEditContainer}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Opening Time:</Text>
            <TouchableOpacity 
              style={styles.dateTimeInput} 
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTimeToAMPM(editedSettings.openTime)}</Text>
            </TouchableOpacity>
            {showStartTimePicker && (
              <TimePickerModal
                visible={showStartTimePicker}
                onClose={() => setShowStartTimePicker(false)}
                onSelect={(time) => {
                  setEditedSettings({ ...editedSettings, openTime: format(time, 'HH:mm') });
                }}
                selectedTime={new Date()}
                selectedDate={new Date()}
                startHour={8}
                endHour={23}
                interval={30}
              />
            )}
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Closing Time:</Text>
            <TouchableOpacity 
              style={styles.dateTimeInput} 
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTimeToAMPM(editedSettings.closeTime)}</Text>
            </TouchableOpacity>
            {showEndTimePicker && (
              <TimePickerModal
                visible={showEndTimePicker}
                onClose={() => setShowEndTimePicker(false)}
                onSelect={(time) => {
                  setEditedSettings({ ...editedSettings, closeTime: format(time, 'HH:mm') });
                }}
                selectedTime={new Date()}
                selectedDate={new Date()}
                startHour={8}
                endHour={23}
                interval={30}
              />
            )}
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Booking Interval (minutes):</Text>
            <TextInput
              style={styles.textInput}
              value={String(editedSettings?.interval)}
              onChangeText={(text) => setEditedSettings({ ...editedSettings, interval: parseInt(text) || 0 })}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Max Seats per Slot:</Text>
            <TextInput
              style={styles.textInput}
              value={String(editedSettings.maxSeatsPerSlot)}
              onChangeText={(text) => setEditedSettings({ ...editedSettings, maxSeatsPerSlot: parseInt(text) || 0 })}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Max Tables per Slot:</Text>
            <TextInput
              style={styles.textInput}
              value={String(editedSettings.maxTablesPerSlot)}
              onChangeText={(text) => setEditedSettings({ ...editedSettings, maxTablesPerSlot: parseInt(text) || 0 })}
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => setIsEditingBookingSettings(false)}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveBookingSettings}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : bookingSettings ? (
        <View style={styles.settingsContainer}>
          <View style={styles.settingRow}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Operating Hours</Text>
              <Text style={styles.settingValue}>
                {formatTimeToAMPM(bookingSettings.openTime)} - {formatTimeToAMPM(bookingSettings.closeTime)}
              </Text>
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Booking Interval</Text>
              <Text style={styles.settingValue}>{bookingSettings.interval} minutes</Text>
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Max Seats per Slot</Text>
              <Text style={styles.settingValue}>{bookingSettings.maxSeatsPerSlot}</Text>
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Max Tables per Slot</Text>
              <Text style={styles.settingValue}>{bookingSettings.maxTablesPerSlot}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No booking settings configured</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleEditBookingSettings}
          >
            <Text style={styles.addButtonText}>Configure Booking Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editText: {
    fontSize: 14,
    color: '#B22222',
    fontWeight: '600',
  },
  settingsContainer: {
    marginTop: 10,
  },
  settingsEditContainer: {
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  settingItem: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  settingValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  formRow: {
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateTimeInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#B22222',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#333',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#B22222',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BookingSettingsSection;
