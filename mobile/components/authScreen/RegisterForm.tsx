import React, { useState, Dispatch, SetStateAction } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EhgezliButton } from '../common/EhgezliButton';
import BirthdayPicker from '../common/BirthdayPicker';
import ModalPicker from '../common/ModalPicker';
import MultiSelectModalPicker from '../common/MultiSelectModalPicker';

interface RegisterFormProps {
  onSuccess?: () => void;
  isLoginMode?: boolean;
  setIsLoginMode?: Dispatch<SetStateAction<boolean>>;
  isRestaurantMode?: boolean;
  setIsRestaurantMode?: Dispatch<SetStateAction<boolean>>;
  isRestaurantLoginMode?: boolean;
  setIsRestaurantLoginMode?: Dispatch<SetStateAction<boolean>>;
  firstName?: string;
  setFirstName?: Dispatch<SetStateAction<string>>;
  lastName?: string;
  setLastName?: Dispatch<SetStateAction<string>>;
  phoneNumber?: string;
  setPhoneNumber?: Dispatch<SetStateAction<string>>;
  gender?: string;
  setGender?: Dispatch<SetStateAction<string>>;
  birthday?: Date | null;
  setBirthday?: Dispatch<SetStateAction<Date | null>>;
  city?: string;
  setCity?: Dispatch<SetStateAction<string>>;
  nationality?: string;
  setNationality?: Dispatch<SetStateAction<string>>;
  cuisines?: string[];
  setCuisines?: Dispatch<SetStateAction<string[]>>;
  availableCuisines?: string[];
  showCityDropdown?: boolean;
  setShowCityDropdown?: Dispatch<SetStateAction<boolean>>;
  showBirthdayPicker?: boolean;
  setShowBirthdayPicker?: Dispatch<SetStateAction<boolean>>;
  showNationalityDropdown?: boolean;
  setShowNationalityDropdown?: Dispatch<SetStateAction<boolean>>;
  datePickerMode?: 'date' | 'time';
  setDatePickerMode?: Dispatch<SetStateAction<'date' | 'time'>>;
  showGenderDropdown?: boolean;
  setShowGenderDropdown?: Dispatch<SetStateAction<boolean>>;
  showCuisineDropdown?: boolean;
  setShowCuisineDropdown?: Dispatch<SetStateAction<boolean>>;
  showImagePickerModal?: boolean;
  setShowImagePickerModal?: Dispatch<SetStateAction<boolean>>;
  isAuthenticating?: boolean;
  setIsAuthenticating?: Dispatch<SetStateAction<boolean>>;
  onFormSubmit?: (formData?: { 
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string;
    gender: string;
    birthday: Date | null;
    city: string;
    nationality: string;
    cuisines: string[];
  }) => void;
  setEmail?: Dispatch<SetStateAction<string>>;
  setPassword?: Dispatch<SetStateAction<string>>;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSuccess,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phoneNumber,
  setPhoneNumber,
  gender,
  setGender,
  birthday,
  setBirthday,
  city,
  setCity,
  nationality,
  setNationality,
  availableCuisines,
  showGenderDropdown,
  setShowGenderDropdown,
  showCuisineDropdown,
  setShowCuisineDropdown,
  showImagePickerModal,
  setShowImagePickerModal,
  isAuthenticating,
  setIsAuthenticating,
  onFormSubmit,
  setEmail,
  setPassword,
  cuisines,
  setCuisines,
  showCityDropdown,
  setShowCityDropdown,
  showBirthdayPicker,
  setShowBirthdayPicker,
  showNationalityDropdown,
  setShowNationalityDropdown
}) => {
  // Local state for form fields
  const [email, setEmailState] = useState('');
  const [password, setPasswordState] = useState('');
  const [isLoading, setIsLoading] = useState(isAuthenticating || false);
  const [error, setError] = useState<string | null>(null);

  // Update local loading state when prop changes
  React.useEffect(() => {
    if (isAuthenticating !== undefined) {
      setIsLoading(isAuthenticating);
    }
  }, [isAuthenticating]);

  // Handle form submission
  const handleRegister = () => {
    // Validate form fields
    if (!firstName || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    // Start loading state and clear any previous errors
    setIsLoading(true);
    if (setIsAuthenticating) {
      setIsAuthenticating(true);
    }
    setError(null);

    // If external submit handler is provided, use it
    if (onFormSubmit) {
      onFormSubmit({
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || '',
        password: password || '',
        phoneNumber: phoneNumber || '',
        gender: gender || '',
        birthday: birthday || null,
        city: city || '',
        nationality: nationality || '',
        cuisines: cuisines || []
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to start booking restaurant reservations</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <View style={styles.formRow}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter first name"
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
        </View>
        
        <View style={styles.halfInput}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter last name"
            placeholderTextColor="#999"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </View>
      </View>
      
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email address"
        placeholderTextColor="#999"
        value={email}
        onChangeText={(text) => {
          setEmailState(text);
          if (setEmail) {
            setEmail(text);
          }
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Create a password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={(text) => {
          setPasswordState(text);
          if (setPassword) {
            setPassword(text);
          }
        }}
        secureTextEntry
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your phone number"
        placeholderTextColor="#999"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Birthday</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => setShowBirthdayPicker && setShowBirthdayPicker(true)}
      >
        <Text>{birthday ? `${birthday.getDate().toString().padStart(2, '0')}/${(birthday.getMonth() + 1).toString().padStart(2, '0')}/${birthday.getFullYear()}` : 'Select birthday'}</Text>
      </TouchableOpacity>
      
      {showBirthdayPicker && (
        <BirthdayPicker
          birthday={birthday || null}
          setBirthday={(date) => {
            if (setBirthday) {
              setBirthday(date);
            }
          }}
        />
      )}
      
      
      <Text style={styles.label}>Gender</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => setShowGenderDropdown && setShowGenderDropdown(true)}
      >
        <Text>{gender || 'Select Gender'}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      
      {showGenderDropdown && (
        <ModalPicker
          visible={showGenderDropdown}
          onClose={() => setShowGenderDropdown && setShowGenderDropdown(false)}
          title="Select Gender"
          options={[
            { label: 'Male', value: 'Male' },
            { label: 'Female', value: 'Female' },
            { label: 'Prefer not to say', value: 'Prefer not to say' }
          ]}
          selectedValue={gender}
          onSelect={(value) => setGender && setGender(value)}
        />
      )}
      
      <Text style={styles.label}>City</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => setShowCityDropdown && setShowCityDropdown(true)}
      >
        <Text>{city || 'Select City'}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity> 

      {showCityDropdown && (
        <ModalPicker
          visible={showCityDropdown}
          onClose={() => setShowCityDropdown && setShowCityDropdown(false)}
          title="Select City"
          options={[
            { label: 'Alexandria', value: 'Alexandria' },
            { label: 'Cairo', value: 'Cairo' }
          ]}
          selectedValue={city}
          onSelect={(value) => setCity && setCity(value)}
        />
      )}
      
      <Text style={styles.label}>Nationality</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => setShowNationalityDropdown && setShowNationalityDropdown(true)}
      >
        <Text>{nationality || 'Select Nationality'}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      
      {showNationalityDropdown && (
        <ModalPicker
          visible={showNationalityDropdown}
          onClose={() => setShowNationalityDropdown && setShowNationalityDropdown(false)}
          title="Select Nationality"
          options={[
            { label: 'Egyptian', value: 'Egyptian' },
            { label: 'American', value: 'American' },
            { label: 'British', value: 'British' },
            { label: 'French', value: 'French' },
            { label: 'German', value: 'German' },
            { label: 'Italian', value: 'Italian' },
            { label: 'Spanish', value: 'Spanish' },
            { label: 'Other', value: 'Other' }
          ]}
          selectedValue={nationality}
          onSelect={(value) => setNationality && setNationality(value)}
        />
      )}
      
      <Text style={styles.label}>Cuisines</Text>
      <TouchableOpacity 
        style={styles.dropdown}
        onPress={() => setShowCuisineDropdown && setShowCuisineDropdown(true)}
      >
        <Text>{cuisines && cuisines.length > 0 ? cuisines.join(', ') : 'Select Cuisines (Max 3)'}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>
      
      {showCuisineDropdown && (
        <MultiSelectModalPicker
          visible={showCuisineDropdown}
          onClose={() => setShowCuisineDropdown && setShowCuisineDropdown(false)}
          title="Select Cuisines (Max 3)"
          options={availableCuisines || []}
          selectedValues={cuisines || []}
          onSelect={(values) => setCuisines && setCuisines(values)}
          maxSelections={3}
        />
      )}
      
      <EhgezliButton
        title="Register"
        onPress={handleRegister}
        disabled={isLoading}
        loading={isLoading}
        variant="ehgezli"
        size="md"
        style={styles.buttonContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'left',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'left',
    color: '#666',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarIcon: {
    fontSize: 24,
  },
  buttonContainer: {
    marginTop: 16,
    backgroundColor: '#B01C2E',
  },
  errorText: {
    color: '#B01C2E',
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  halfInput: {
    width: '48%',
  },
  dropdownArrow: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '80%',
  },
  countryModalContent: {
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalItemText: {
    fontSize: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#B01C2E',
    borderColor: '#B01C2E',
  },
  checkmark: {
    fontSize: 16,
    color: '#fff',
  },
  closeButton: {
    paddingVertical: 8,
    backgroundColor: '#B01C2E',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default RegisterForm;
