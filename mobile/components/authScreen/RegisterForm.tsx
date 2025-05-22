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
        <Text>{birthday ? birthday.toDateString() : 'Select birthday'}</Text>
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
        <Modal
          visible={showGenderDropdown}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGenderDropdown && setShowGenderDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowGenderDropdown && setShowGenderDropdown(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Gender</Text>
              
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setGender && setGender('Male');
                  setShowGenderDropdown && setShowGenderDropdown(false);
                }}
              >
                <Text style={styles.modalItemText}>Male</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setGender && setGender('Female');
                  setShowGenderDropdown && setShowGenderDropdown(false);
                }}
              >
                <Text style={styles.modalItemText}>Female</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setGender && setGender('Prefer not to say');
                  setShowGenderDropdown && setShowGenderDropdown(false);
                }}
              >
                <Text style={styles.modalItemText}>Prefer not to say</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
        <Modal
          visible={showCityDropdown}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCityDropdown && setShowCityDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCityDropdown && setShowCityDropdown(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select City</Text>
              
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setCity && setCity('Alexandria');
                  setShowCityDropdown && setShowCityDropdown(false);
                }}
              >
                <Text style={styles.modalItemText}>Alexandria</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  setCity && setCity('Cairo');
                  setShowCityDropdown && setShowCityDropdown(false);
                }}
              >
                <Text style={styles.modalItemText}>Cairo</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
        <Modal
          visible={showNationalityDropdown}
          transparent
          animationType="slide"
          onRequestClose={() => setShowNationalityDropdown && setShowNationalityDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowNationalityDropdown && setShowNationalityDropdown(false)}
          >
            <View style={[styles.modalContent, styles.countryModalContent]}>
              <Text style={styles.modalTitle}>Select Nationality</Text>
              
              <FlatList
                data={[
                  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
                  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
                  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
                  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
                  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador',
                  'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
                  'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
                  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
                  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, North', 'Korea, South',
                  'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
                  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
                  'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
                  'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway',
                  'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
                  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
                  'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands',
                  'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
                  'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan',
                  'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
                  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
                ]}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setNationality && setNationality(item);
                      setShowNationalityDropdown && setShowNationalityDropdown(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowNationalityDropdown && setShowNationalityDropdown(false)}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
        <Modal
          visible={showCuisineDropdown}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCuisineDropdown && setShowCuisineDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCuisineDropdown && setShowCuisineDropdown(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Cuisines (Max 3)</Text>
              
              <FlatList
                data={availableCuisines || []}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isSelected = cuisines && cuisines.includes(item);
                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, styles.checkboxItem]}
                      onPress={() => {
                        if (setCuisines) {
                          if (isSelected) {
                            // Remove if already selected
                            setCuisines(cuisines.filter(cuisine => cuisine !== item));
                          } else if (!cuisines || cuisines.length < 3) {
                            // Add if less than 3 are selected
                            setCuisines([...(cuisines || []), item]);
                          }
                        }
                      }}
                    >
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <Text style={styles.modalItemText}>{item}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
              
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCuisineDropdown && setShowCuisineDropdown(false)}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
