import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
} from 'react-native';

interface MultiSelectModalPickerProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: Array<{ label: string; value: string }> | string[];
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  maxSelections?: number;
}

export default function MultiSelectModalPicker({
  visible,
  onClose,
  title,
  options,
  selectedValues,
  onSelect,
  maxSelections = 3,
}: MultiSelectModalPickerProps) {
  // Convert string[] to {label, value} format if needed
  const formattedOptions = options.map(option => 
    typeof option === 'string' ? { label: option, value: option } : option
  );

  const toggleOption = (value: string) => {
    let newValues;
    if (selectedValues.includes(value)) {
      // Remove if already selected
      newValues = selectedValues.filter(v => v !== value);
    } else if (selectedValues.length < maxSelections) {
      // Add if under max limit
      newValues = [...selectedValues, value];
    } else {
      // At max limit, don't change
      return;
    }
    onSelect(newValues);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.pickerModalContent}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Text style={styles.subtitle}>Select up to {maxSelections} options</Text>
          </View>
          
          <FlatList
            data={formattedOptions}
            keyExtractor={(item) => item.value}
            style={styles.optionsList}
            renderItem={({ item }) => {
              const isSelected = selectedValues.includes(item.value);
              return (
                <TouchableOpacity
                  style={[styles.optionItem, isSelected && styles.selectedOption]}
                  onPress={() => toggleOption(item.value)}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.optionText}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  header: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#B01C2E',
    borderColor: '#B01C2E',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#B01C2E',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#fff',
  },
});
