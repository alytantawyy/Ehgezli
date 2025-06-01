import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, FlatList } from 'react-native';
import { format, parse } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { BookingOverride } from '@/types/branch';
import DatePickerModal from '@/components/common/DatePickerModal';
import TimePickerModal from '@/components/common/TimePickerModal';

interface BookingOverridesSectionProps {
  bookingOverrides: BookingOverride[];
  branchId: number;
  createNewBookingOverride: (branchId: number, override: BookingOverride) => Promise<void>;
  updateExistingBookingOverride: (overrideId: number, override: BookingOverride) => Promise<void>;
  deleteBookingOverride: (overrideId: number) => Promise<void>;
}

const BookingOverridesSection: React.FC<BookingOverridesSectionProps> = ({
  bookingOverrides,
  branchId,
  createNewBookingOverride,
  updateExistingBookingOverride,
  deleteBookingOverride,
}) => {
  // State for adding/editing overrides
  const [isAddingOverride, setIsAddingOverride] = useState(false);
  const [isEditingOverride, setIsEditingOverride] = useState(false);
  const [selectedOverride, setSelectedOverride] = useState<BookingOverride | null>(null);
  
  // State for new override
  const [newOverride, setNewOverride] = useState<Partial<BookingOverride>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '17:00',
    overrideType: 'MODIFIED',
    newMaxSeats: 0,
    newMaxTables: 0,
    note: ''
  });
  
  // State for edited override
  const [editedOverride, setEditedOverride] = useState<Partial<BookingOverride>>({});
  
  // State for date/time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

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

  // Function to handle adding a new booking override
  const handleAddBookingOverride = () => {
    const today = new Date();
    setIsAddingOverride(true);
    setNewOverride({
      date: format(today, 'yyyy-MM-dd'),
      startTime: '09:00',
      endTime: '17:00',
      overrideType: 'MODIFIED',
      newMaxSeats: 0,
      newMaxTables: 0,
      note: ''
    });
  };

  // Function to handle saving a new booking override
  const handleSaveNewBookingOverride = () => {
    // Parse the date string to a Date object
    const dateObj = parse(newOverride.date as string, 'yyyy-MM-dd', new Date());
    
    // Create ISO strings for date and times
    const isoDate = dateObj.toISOString();
    
    // Parse time strings and combine with the date
    const [startHour, startMinute] = (newOverride.startTime as string).split(':').map(Number);
    const startTimeObj = new Date(dateObj);
    startTimeObj.setHours(startHour, startMinute, 0, 0);
    const isoStartTime = startTimeObj.toISOString();
    
    const [endHour, endMinute] = (newOverride.endTime as string).split(':').map(Number);
    const endTimeObj = new Date(dateObj);
    endTimeObj.setHours(endHour, endMinute, 0, 0);
    const isoEndTime = endTimeObj.toISOString();
    
    // Prepare the override data with correct formats
    const overrideData = {
      ...newOverride,
      date: isoDate,
      startTime: isoStartTime,
      endTime: isoEndTime,
      newMaxSeats: Number(newOverride.newMaxSeats || 0),
      newMaxTables: Number(newOverride.newMaxTables || 0),
    } as BookingOverride;
    
    // Debug: Log the formatted override data
    console.log('Creating booking override with formatted data:', overrideData);
    
    createNewBookingOverride(branchId, overrideData)
      .then(() => {
        Alert.alert('Success', 'Booking override created successfully');
        setIsAddingOverride(false);
      })
      .catch((err) => {
        Alert.alert('Error', `Failed to create booking override: ${err.message}`);
        console.error('Error creating booking override:', err);
      });
  };

  // Function to handle editing a booking override
  const handleEditBookingOverride = (override: BookingOverride) => {
    setIsEditingOverride(true);
    setSelectedOverride(override);
    setEditedOverride({
      ...override
    });
  };

  // Function to handle updating a booking override
  const handleUpdateBookingOverride = () => {
    if (selectedOverride && editedOverride) {
      // Parse the date string to a Date object
      const dateObj = parse(editedOverride.date as string, 'yyyy-MM-dd', new Date());
      
      // Create ISO strings for date and times
      const isoDate = dateObj.toISOString();
      
      // Parse time strings and combine with the date
      const [startHour, startMinute] = (editedOverride.startTime as string).split(':').map(Number);
      const startTimeObj = new Date(dateObj);
      startTimeObj.setHours(startHour, startMinute, 0, 0);
      const isoStartTime = startTimeObj.toISOString();
      
      const [endHour, endMinute] = (editedOverride.endTime as string).split(':').map(Number);
      const endTimeObj = new Date(dateObj);
      endTimeObj.setHours(endHour, endMinute, 0, 0);
      const isoEndTime = endTimeObj.toISOString();
      
      // Prepare the override data with correct formats
      const overrideData = {
        ...editedOverride,
        date: isoDate,
        startTime: isoStartTime,
        endTime: isoEndTime,
        newMaxSeats: Number(editedOverride.newMaxSeats || 0),
        newMaxTables: Number(editedOverride.newMaxTables || 0),
      } as BookingOverride;
      
      // Debug: Log the formatted override data
      console.log('Updating booking override with formatted data:', overrideData);
      
      updateExistingBookingOverride(selectedOverride.id, overrideData)
        .then(() => {
          Alert.alert('Success', 'Booking override updated successfully');
          setIsEditingOverride(false);
          setSelectedOverride(null);
        })
        .catch((err) => {
          Alert.alert('Error', `Failed to update booking override: ${err.message}`);
          console.error('Error updating booking override:', err);
        });
    }
  };

  // Function to handle deleting a booking override
  const handleDeleteBookingOverride = (overrideId: number) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this booking override?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteBookingOverride(overrideId)
              .then(() => {
                Alert.alert('Success', 'Booking override deleted successfully');
              })
              .catch((err) => {
                Alert.alert('Error', `Failed to delete booking override: ${err.message}`);
                console.error('Error deleting booking override:', err);
              });
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Render booking override item
  const renderOverrideItem = ({ item }: { item: BookingOverride }) => {
    const date = new Date(item.date);
    const formattedDate = format(date, 'MMM d, yyyy');
    
    return (
      <View style={styles.overrideItem}>
        <View style={styles.overrideHeader}>
          <Text style={styles.overrideDate}>{formattedDate}</Text>
          <View style={styles.overrideActions}>
            <TouchableOpacity 
              onPress={() => handleEditBookingOverride(item)}
              style={styles.actionIcon}
            >
              <Ionicons name="pencil" size={18} color="#B22222" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDeleteBookingOverride(item.id)}
              style={styles.actionIcon}
            >
              <Ionicons name="trash-outline" size={18} color="#B22222" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.overrideDetails}>
          <View style={styles.overrideDetail}>
            <Text style={styles.overrideLabel}>Type:</Text>
            <Text style={styles.overrideValue}>
              {item.overrideType === 'CLOSED' ? 'Closed' : 'Modified Hours'}
            </Text>
          </View>
          
          {item.overrideType === 'MODIFIED' && (
            <>
              <View style={styles.overrideDetail}>
                <Text style={styles.overrideLabel}>Hours:</Text>
                <Text style={styles.overrideValue}>
                  {formatTimeToAMPM(item.startTime)} - {formatTimeToAMPM(item.endTime)}
                </Text>
              </View>
              
              <View style={styles.overrideDetail}>
                <Text style={styles.overrideLabel}>Capacity:</Text>
                <Text style={styles.overrideValue}>
                  {item.newMaxSeats} seats, {item.newMaxTables} tables
                </Text>
              </View>
            </>
          )}
          
          {item.note && (
            <View style={styles.overrideDetail}>
              <Text style={styles.overrideLabel}>Note:</Text>
              <Text style={styles.overrideValue}>{item.note}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Booking Overrides</Text>
        <TouchableOpacity onPress={handleAddBookingOverride}>
          <Text style={styles.editText}>Add Override</Text>
        </TouchableOpacity>
      </View>
      
      {isAddingOverride ? (
        <View style={styles.overrideEditContainer}>
          <Text style={styles.editSectionTitle}>Add New Override</Text>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Date:</Text>
            <TouchableOpacity 
              style={styles.dateTimeInput} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>{newOverride.date}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={(date) => {
                  setNewOverride({ ...newOverride, date: format(date, 'yyyy-MM-dd') });
                }}
                selectedDate={new Date()}
                minDate={new Date()}
              />
            )}
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Type:</Text>
            <View style={styles.typeButtonsContainer}>
              <TouchableOpacity 
                style={[styles.typeButton, newOverride.overrideType === 'CLOSED' && styles.activeTypeButton]}
                onPress={() => setNewOverride({ ...newOverride, overrideType: 'CLOSED' })}
              >
                <Text style={[styles.typeButtonText, newOverride.overrideType === 'CLOSED' && styles.activeTypeButtonText]}>Closed</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeButton, newOverride.overrideType === 'MODIFIED' && styles.activeTypeButton]}
                onPress={() => setNewOverride({ ...newOverride, overrideType: 'MODIFIED' })}
              >
                <Text style={[styles.typeButtonText, newOverride.overrideType === 'MODIFIED' && styles.activeTypeButtonText]}>Modified Hours</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Start Time:</Text>
            <TouchableOpacity 
              style={styles.dateTimeInput} 
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTimeToAMPM(newOverride.startTime || '')}</Text>
            </TouchableOpacity>
            {showStartTimePicker && (
              <TimePickerModal
                visible={showStartTimePicker}
                onClose={() => setShowStartTimePicker(false)}
                onSelect={(time) => {
                  setNewOverride({ ...newOverride, startTime: format(time, 'HH:mm') });
                }}
                selectedTime={newOverride.startTime && typeof newOverride.startTime === 'string' && newOverride.startTime.includes(':') ? 
                  parse(newOverride.startTime, 'HH:mm', new Date()) : new Date()}
                selectedDate={new Date()}
                startHour={8}
                endHour={23}
                interval={30}
              />
            )}
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>End Time:</Text>
            <TouchableOpacity 
              style={styles.dateTimeInput} 
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTimeToAMPM(newOverride.endTime || '')}</Text>
            </TouchableOpacity>
            {showEndTimePicker && (
              <TimePickerModal
                visible={showEndTimePicker}
                onClose={() => setShowEndTimePicker(false)}
                onSelect={(time) => {
                  setNewOverride({ ...newOverride, endTime: format(time, 'HH:mm') });
                }}
                selectedTime={newOverride.endTime && typeof newOverride.endTime === 'string' && newOverride.endTime.includes(':') ? 
                  parse(newOverride.endTime, 'HH:mm', new Date()) : new Date()}
                selectedDate={new Date()}
                startHour={8}
                endHour={23}
                interval={30}
              />
            )}
          </View>
          
          {newOverride.overrideType === 'MODIFIED' && (
            <>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Max Seats:</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(newOverride.newMaxSeats || '')}
                  onChangeText={(text) => setNewOverride({ ...newOverride, newMaxSeats: parseInt(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Max Tables:</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(newOverride.newMaxTables || '')}
                  onChangeText={(text) => setNewOverride({ ...newOverride, newMaxTables: parseInt(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Note:</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={newOverride.note || ''}
              onChangeText={(text) => setNewOverride({ ...newOverride, note: text })}
              placeholder="Add a note"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => setIsAddingOverride(false)}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSaveNewBookingOverride}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isEditingOverride && selectedOverride ? (
        <View style={styles.overrideEditContainer}>
          <Text style={styles.editSectionTitle}>Edit Override</Text>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Date:</Text>
            <TouchableOpacity 
              style={styles.dateTimeInput} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateTimeText}>{format(new Date(selectedOverride.date), 'MMM d, yyyy')}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DatePickerModal
                visible={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={(date) => {
                  setEditedOverride({ ...editedOverride, date: format(date, 'yyyy-MM-dd') });
                }}
                selectedDate={new Date()}
                minDate={new Date()}
              />
            )}
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Type:</Text>
            <View style={styles.typeButtonsContainer}>
              <TouchableOpacity 
                style={[styles.typeButton, selectedOverride.overrideType === 'CLOSED' && styles.activeTypeButton]}
                disabled={true}
              >
                <Text style={[styles.typeButtonText, selectedOverride.overrideType === 'CLOSED' && styles.activeTypeButtonText]}>Closed</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeButton, selectedOverride.overrideType === 'MODIFIED' && styles.activeTypeButton]}
                disabled={true}
              >
                <Text style={[styles.typeButtonText, selectedOverride.overrideType === 'MODIFIED' && styles.activeTypeButtonText]}>Modified Hours</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Start Time:</Text>
            <TouchableOpacity 
              style={styles.dateTimeInput} 
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTimeToAMPM(editedOverride?.startTime || '')}</Text>
            </TouchableOpacity>
            {showStartTimePicker && (
              <TimePickerModal
                visible={showStartTimePicker}
                onClose={() => setShowStartTimePicker(false)}
                onSelect={(time) => {
                  setEditedOverride({ ...editedOverride, startTime: format(time, 'HH:mm') });
                }}
                selectedTime={editedOverride?.startTime && typeof editedOverride.startTime === 'string' && editedOverride.startTime.includes(':') ? 
                  parse(editedOverride.startTime, 'HH:mm', new Date()) : new Date()}
                selectedDate={new Date()}
                startHour={8}
                endHour={23}
                interval={30}
              />
            )}
          </View>
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>End Time:</Text>
            <TouchableOpacity 
              style={styles.dateTimeInput} 
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={styles.dateTimeText}>{formatTimeToAMPM(editedOverride?.endTime || '')}</Text>
            </TouchableOpacity>
            {showEndTimePicker && (
              <TimePickerModal
                visible={showEndTimePicker}
                onClose={() => setShowEndTimePicker(false)}
                onSelect={(time) => {
                  setEditedOverride({ ...editedOverride, endTime: format(time, 'HH:mm') });
                }}
                selectedTime={editedOverride?.endTime && typeof editedOverride.endTime === 'string' && editedOverride.endTime.includes(':') ? 
                  parse(editedOverride.endTime, 'HH:mm', new Date()) : new Date()}
                selectedDate={new Date()}
                startHour={8}
                endHour={23}
                interval={30}
              />
            )}
          </View>
          
          {selectedOverride.overrideType === 'MODIFIED' && (
            <>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Max Seats:</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(editedOverride?.newMaxSeats || '')}
                  onChangeText={(text) => setEditedOverride({ ...editedOverride, newMaxSeats: parseInt(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Max Tables:</Text>
                <TextInput
                  style={styles.textInput}
                  value={String(editedOverride?.newMaxTables || '')}
                  onChangeText={(text) => setEditedOverride({ ...editedOverride, newMaxTables: parseInt(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}
          
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Note:</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={editedOverride?.note || ''}
              onChangeText={(text) => setEditedOverride({ ...editedOverride, note: text })}
              placeholder="Add a note"
              multiline
              numberOfLines={3}
            />
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                setIsEditingOverride(false);
                setSelectedOverride(null);
              }}
            >
              <Text style={[styles.actionButtonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleUpdateBookingOverride}
            >
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {bookingOverrides.length > 0 ? (
            <View style={styles.overridesList}>
              {bookingOverrides.map((override, index) => (
                <React.Fragment key={override.id.toString()}>
                  {index > 0 && <View style={styles.separator} />}
                  {renderOverrideItem({item: override})}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No booking overrides configured</Text>
            </View>
          )}
        </>
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
  overrideEditContainer: {
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
  },
  editSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
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
  typeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    height: 44,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeTypeButton: {
    backgroundColor: '#B22222',
    borderColor: '#B22222',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  activeTypeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  textAreaInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
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
  overridesList: {
    marginTop: 10,
  },
  overrideItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  overrideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  overrideDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  overrideActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginLeft: 15,
  },
  overrideDetails: {
    marginTop: 5,
  },
  overrideDetail: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  overrideLabel: {
    fontSize: 14,
    color: '#666',
    width: 70,
  },
  overrideValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
});

export default BookingOverridesSection;
