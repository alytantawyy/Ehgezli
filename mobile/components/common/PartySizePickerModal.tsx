import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { modalStyles } from '../../styles/ModalStyles';

interface PartySizePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (size: number) => void;
  selectedSize: number;
  minSize?: number;
  maxSize?: number;
}

export default function PartySizePickerModal({
  visible,
  onClose,
  onSelect,
  selectedSize,
  minSize = 1,
  maxSize = 10,
}: PartySizePickerModalProps) {
  // Generate party size options
  const generatePartySizes = () => {
    const sizes = [];
    for (let i = minSize; i <= maxSize; i++) {
      sizes.push({
        label: i === 1 ? '1 person' : `${i} people`,
        value: i.toString(),
      });
    }
    return sizes;
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
          <Text style={modalStyles.modalTitle}>Party Size</Text>
          
          <FlatList
            data={generatePartySizes()}
            keyExtractor={(item) => item.value}
            style={modalStyles.optionsList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  modalStyles.optionItem, 
                  selectedSize === parseInt(item.value) && modalStyles.selectedOption
                ]}
                onPress={() => {
                  onSelect(parseInt(item.value));
                  onClose();
                }}
              >
                <Text 
                  style={[
                    modalStyles.optionText, 
                    selectedSize === parseInt(item.value) && modalStyles.selectedOptionText
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
