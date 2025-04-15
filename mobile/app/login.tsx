import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ImageBackground,
  Dimensions,
  StyleProp,
  TextStyle,
  ViewStyle,
  ImageStyle,
  Image,
  Keyboard,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/auth-context';
import { EhgezliButton } from '../components/EhgezliButton';
import Colors from '../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Define the style types
type Styles = {
  container: ViewStyle;
  webContainer: ViewStyle;
  mobileContainer: ViewStyle;
  scrollContainer: ViewStyle;
  formSection: ViewStyle;
  imageSection: ViewStyle;
  imageContainer: ViewStyle;
  imageOverlay: ViewStyle;
  logoOnImage: TextStyle;
  taglineOnImage: TextStyle;
  header: ViewStyle;
  logo: TextStyle;
  logoImage: ImageStyle;
  logoImageOnBackground: ImageStyle;
  tagline: TextStyle;
  formContainer: ViewStyle;
  tabs: ViewStyle;
  tab: ViewStyle;
  activeTab: ViewStyle;
  tabText: TextStyle;
  activeTabText: TextStyle;
  form: ViewStyle;
  welcomeText: TextStyle;
  subtitle: TextStyle;
  nameRow: ViewStyle;
  nameField: ViewStyle;
  label: TextStyle;
  input: TextStyle;
  button: ViewStyle;
  errorText: TextStyle;
  forgotPassword: ViewStyle;
  forgotPasswordText: TextStyle;
  imageBackground: ViewStyle;
  cuisineContainer: ViewStyle;
  cuisineItem: ViewStyle;
  selectedCuisineItem: ViewStyle;
  checkboxContainer: ViewStyle;
  checkbox: ViewStyle;
  checkedBox: ViewStyle;
  cuisineText: TextStyle;
  checkmark: TextStyle;
  dropdown: ViewStyle;
  dropdownItem: ViewStyle;
  dropdownText: TextStyle;
  cityDropdownContainer: ViewStyle;
  cityDropdown: ViewStyle;
  cityDropdownList: ViewStyle;
  cityDropdownItem: ViewStyle;
  selectedCityItem: ViewStyle;
  dropdownIcon: TextStyle;
  datePickerContainer: ViewStyle;
  dateText: TextStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalHeader: ViewStyle;
  modalCancel: TextStyle;
  modalTitle: TextStyle;
  modalDone: TextStyle;
  datePicker: ViewStyle;
};

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [city, setCity] = useState('');
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [availableCuisines] = useState([
    'Italian', 'Chinese', 'Japanese', 'Mexican', 'Indian', 'French', 
    'Thai', 'Mediterranean', 'American', 'Middle Eastern', 'Greek', 
    'Spanish', 'Korean', 'Vietnamese', 'Turkish', 'Egyptian'
  ]);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showBirthdayPicker, setShowBirthdayPicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  
  const { login, register, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const onChangeBirthday = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || birthday;
    setShowBirthdayPicker(Platform.OS === 'ios');
    setBirthday(currentDate);
  };

  const formatBirthdayForAPI = () => {
    return birthday ? birthday.toISOString() : '';
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return 'Select a date';
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async () => {
    try {
      if (isLoginMode) {
        await login(email, password);
        router.replace('/(tabs)');
      } else {
        // Validate form
        if (!firstName || !lastName || !email || !password || !gender || !birthday || !city || cuisines.length === 0) {
          Alert.alert('Error', 'Please fill in all fields');
          return;
        }
        if (password.length < 8) {
          Alert.alert('Error', 'Password must be at least 8 characters long');
          return;
        }
        
        // Register the user and wait for the registration to complete
        const result = await register({ 
          firstName, 
          lastName, 
          email, 
          password, 
          gender, 
          birthday: formatBirthdayForAPI(), 
          city,
          cuisines 
        });
        
        // Now we can safely navigate to the index page with user data properly set
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      // Error is already set in the auth context
      // We don't need to log the error here since it's already logged in the API client
      // Just handle any additional UI feedback if needed
      
      // Optional: Add specific UI feedback based on error type
      if (err.type === 'network_error') {
        // Could show a network status indicator
      }
    }
  };

  const toggleMode = (mode: 'login' | 'register' | 'restaurant') => {
    clearError();
    setIsLoginMode(mode === 'login');
  };

  return (
    <View style={styles.container}>
      {isWeb ? (
        // Web layout - side by side
        <View style={styles.webContainer}>
          <View style={styles.formSection}>
            <View style={styles.formContainer}>
              <View style={styles.tabs}>
                <TouchableOpacity 
                  style={[styles.tab, isLoginMode ? styles.activeTab : null]} 
                  onPress={() => toggleMode('login')}
                >
                  <Text style={[styles.tabText, isLoginMode ? styles.activeTabText : null]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, !isLoginMode ? styles.activeTab : null]} 
                  onPress={() => toggleMode('register')}
                >
                  <Text style={[styles.tabText, !isLoginMode ? styles.activeTabText : null]}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tab}>
                  <Text style={styles.tabText}>Restaurant</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.form}>
                <Text style={styles.welcomeText}>
                  {isLoginMode ? 'Welcome Back' : 'Create Account'}
                </Text>
                <Text style={styles.subtitle}>
                  {isLoginMode 
                    ? 'Login to manage your restaurant reservations' 
                    : 'Sign up to start booking restaurant reservations'}
                </Text>
                
                {isLoginMode && (
                  <>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </>
                )}
                
                {!isLoginMode && (
                  <View>
                    <View style={styles.nameRow}>
                      <View style={styles.nameField}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                          style={styles.input}
                          value={firstName}
                          onChangeText={setFirstName}
                          autoCapitalize="words"
                        />
                      </View>
                      
                      <View style={styles.nameField}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                          style={styles.input}
                          value={lastName}
                          onChangeText={setLastName}
                          autoCapitalize="words"
                        />
                      </View>
                    </View>
                    
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                    
                    <Text style={styles.label}>Gender</Text>
                    <TextInput
                      style={styles.input}
                      value={gender}
                      onChangeText={setGender}
                      autoCapitalize="words"
                    />
                    
                    <Text style={styles.label}>Birthday</Text>
                    <TouchableOpacity 
                      onPress={() => setShowBirthdayPicker(true)}
                      style={styles.datePickerContainer}
                    >
                      <Text style={styles.dateText}>{formatDate(birthday)}</Text>
                    </TouchableOpacity>
                    
                    {/* Custom Date Picker Modal */}
                    {Platform.OS === 'ios' && (
                      <Modal
                        animationType="slide"
                        transparent={true}
                        visible={showBirthdayPicker}
                        onRequestClose={() => setShowBirthdayPicker(false)}
                      >
                        <View style={styles.modalOverlay}>
                          <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                              <TouchableOpacity onPress={() => setShowBirthdayPicker(false)}>
                                <Text style={styles.modalCancel}>Cancel</Text>
                              </TouchableOpacity>
                              <Text style={styles.modalTitle}>Select Birthday</Text>
                              <TouchableOpacity 
                                onPress={() => {
                                  setShowBirthdayPicker(false);
                                }}
                              >
                                <Text style={styles.modalDone}>Done</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={{backgroundColor: 'white'}}>
                              <DateTimePicker
                                testID="dateTimePicker"
                                value={birthday || new Date()}
                                mode={datePickerMode}
                                is24Hour={true}
                                display="spinner"
                                onChange={(event, selectedDate) => {
                                  if (selectedDate) {
                                    setBirthday(selectedDate);
                                  }
                                }}
                                style={styles.datePicker}
                                textColor="black"
                                themeVariant="light"
                              />
                            </View>
                          </View>
                        </View>
                      </Modal>
                    )}
                    
                    {/* Android Date Picker */}
                    {Platform.OS === 'android' && showBirthdayPicker && (
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={birthday || new Date()}
                        mode="date"
                        is24Hour={true}
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowBirthdayPicker(false);
                          if (selectedDate) {
                            setBirthday(selectedDate);
                          }
                        }}
                      />
                    )}
                    
                    <Text style={styles.label}>City</Text>
                    <View style={styles.cityDropdownContainer}>
                      <TouchableOpacity 
                        style={styles.cityDropdown}
                        onPress={() => setShowCityDropdown(!showCityDropdown)}
                      >
                        <Text style={styles.dropdownText}>{city || 'Select City'}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                      
                      {showCityDropdown && (
                        <View style={styles.cityDropdownList}>
                          <TouchableOpacity 
                            style={[styles.cityDropdownItem, city === 'Alexandria' && styles.selectedCityItem]}
                            onPress={() => {
                              setCity('Alexandria');
                              setShowCityDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownText}>Alexandria</Text>
                            {city === 'Alexandria' && <Text style={styles.checkmark}>✓</Text>}
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.cityDropdownItem, city === 'Cairo' && styles.selectedCityItem]}
                            onPress={() => {
                              setCity('Cairo');
                              setShowCityDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownText}>Cairo</Text>
                            {city === 'Cairo' && <Text style={styles.checkmark}>✓</Text>}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.label}>Favorite Cuisines (Max 3)</Text>
                    <View style={styles.cuisineContainer}>
                      {availableCuisines.map((cuisine, index) => (
                        <TouchableOpacity 
                          key={index} 
                          style={[styles.cuisineItem, cuisines.includes(cuisine) && styles.selectedCuisineItem]}
                          onPress={() => {
                            if (cuisines.includes(cuisine)) {
                              // Remove if already selected
                              setCuisines(cuisines.filter(c => c !== cuisine));
                            } else if (cuisines.length < 3) {
                              // Add if less than 3 selected
                              setCuisines([...cuisines, cuisine]);
                            } else {
                              // Alert if trying to select more than 3
                              Alert.alert('Limit Reached', 'You can select a maximum of 3 cuisines');
                            }
                          }}
                        >
                          <View style={styles.checkboxContainer}>
                            <View style={[styles.checkbox, cuisines.includes(cuisine) && styles.checkedBox]}>
                              {cuisines.includes(cuisine) && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.cuisineText}>{cuisine}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                {error && <Text style={styles.errorText}>{error}</Text>}
                
                <EhgezliButton
                  title={isLoginMode ? 'Login' : 'Register'}
                  onPress={handleSubmit}
                  variant="ehgezli"
                  loading={isLoading}
                  style={styles.button}
                />
                
                {isLoginMode && (
                  <TouchableOpacity 
                    style={styles.forgotPassword}
                    onPress={() => {
                      console.log('Navigating to forgot password screen');
                      router.push('/forgot-password');
                    }}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <View style={styles.imageOverlay}>
                <Text style={styles.logoOnImage}>Ehgezli</Text>
                <Text style={styles.taglineOnImage}>
                  Your gateway to exceptional dining experiences. Book tables at the finest restaurants with just a few clicks.
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        // Mobile layout - stacked
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.mobileContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.header}>
              <Image 
                source={require('../assets/Ehgezli-logo.png')} 
                style={styles.logoImage} 
                resizeMode="contain"
              />
            </View>
            
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000' }}
              style={styles.imageBackground}
              resizeMode="cover"
            >
              <View style={styles.imageOverlay}>
                <Text style={styles.taglineOnImage}>
                  Your gateway to exceptional dining experiences. Book tables at the finest restaurants with just a few clicks.
                </Text>
              </View>
            </ImageBackground>
            
            <View style={styles.formContainer}>
              <View style={styles.tabs}>
                <TouchableOpacity 
                  style={[styles.tab, isLoginMode ? styles.activeTab : null]} 
                  onPress={() => toggleMode('login')}
                >
                  <Text style={[styles.tabText, isLoginMode ? styles.activeTabText : null]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tab, !isLoginMode ? styles.activeTab : null]} 
                  onPress={() => toggleMode('register')}
                >
                  <Text style={[styles.tabText, !isLoginMode ? styles.activeTabText : null]}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tab}>
                  <Text style={styles.tabText}>Restaurant</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.form}>
                <Text style={styles.welcomeText}>
                  {isLoginMode ? 'Welcome Back' : 'Create Account'}
                </Text>
                <Text style={styles.subtitle}>
                  {isLoginMode 
                    ? 'Login to manage your restaurant reservations' 
                    : 'Sign up to start booking restaurant reservations'}
                </Text>
                
                {isLoginMode && (
                  <>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </>
                )}
                
                {!isLoginMode && (
                  <View>
                    <View style={styles.nameRow}>
                      <View style={styles.nameField}>
                        <Text style={styles.label}>First Name</Text>
                        <TextInput
                          style={styles.input}
                          value={firstName}
                          onChangeText={setFirstName}
                          autoCapitalize="words"
                        />
                      </View>
                      
                      <View style={styles.nameField}>
                        <Text style={styles.label}>Last Name</Text>
                        <TextInput
                          style={styles.input}
                          value={lastName}
                          onChangeText={setLastName}
                          autoCapitalize="words"
                        />
                      </View>
                    </View>
                    
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                    
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                    
                    <Text style={styles.label}>Gender</Text>
                    <TextInput
                      style={styles.input}
                      value={gender}
                      onChangeText={setGender}
                      autoCapitalize="words"
                    />
                    
                    <Text style={styles.label}>Birthday</Text>
                    <TouchableOpacity 
                      onPress={() => setShowBirthdayPicker(true)}
                      style={styles.datePickerContainer}
                    >
                      <Text style={styles.dateText}>{formatDate(birthday)}</Text>
                    </TouchableOpacity>
                    
                    {/* Custom Date Picker Modal */}
                    {Platform.OS === 'ios' && (
                      <Modal
                        animationType="slide"
                        transparent={true}
                        visible={showBirthdayPicker}
                        onRequestClose={() => setShowBirthdayPicker(false)}
                      >
                        <View style={styles.modalOverlay}>
                          <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                              <TouchableOpacity onPress={() => setShowBirthdayPicker(false)}>
                                <Text style={styles.modalCancel}>Cancel</Text>
                              </TouchableOpacity>
                              <Text style={styles.modalTitle}>Select Birthday</Text>
                              <TouchableOpacity 
                                onPress={() => {
                                  setShowBirthdayPicker(false);
                                }}
                              >
                                <Text style={styles.modalDone}>Done</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={{backgroundColor: 'white'}}>
                              <DateTimePicker
                                testID="dateTimePicker"
                                value={birthday || new Date()}
                                mode={datePickerMode}
                                is24Hour={true}
                                display="spinner"
                                onChange={(event, selectedDate) => {
                                  if (selectedDate) {
                                    setBirthday(selectedDate);
                                  }
                                }}
                                style={styles.datePicker}
                                textColor="black"
                                themeVariant="light"
                              />
                            </View>
                          </View>
                        </View>
                      </Modal>
                    )}
                    
                    {/* Android Date Picker */}
                    {Platform.OS === 'android' && showBirthdayPicker && (
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={birthday || new Date()}
                        mode="date"
                        is24Hour={true}
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowBirthdayPicker(false);
                          if (selectedDate) {
                            setBirthday(selectedDate);
                          }
                        }}
                      />
                    )}
                    
                    <Text style={styles.label}>City</Text>
                    <View style={styles.cityDropdownContainer}>
                      <TouchableOpacity 
                        style={styles.cityDropdown}
                        onPress={() => setShowCityDropdown(!showCityDropdown)}
                      >
                        <Text style={styles.dropdownText}>{city || 'Select City'}</Text>
                        <Text style={styles.dropdownIcon}>▼</Text>
                      </TouchableOpacity>
                      
                      {showCityDropdown && (
                        <View style={styles.cityDropdownList}>
                          <TouchableOpacity 
                            style={[styles.cityDropdownItem, city === 'Alexandria' && styles.selectedCityItem]}
                            onPress={() => {
                              setCity('Alexandria');
                              setShowCityDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownText}>Alexandria</Text>
                            {city === 'Alexandria' && <Text style={styles.checkmark}>✓</Text>}
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.cityDropdownItem, city === 'Cairo' && styles.selectedCityItem]}
                            onPress={() => {
                              setCity('Cairo');
                              setShowCityDropdown(false);
                            }}
                          >
                            <Text style={styles.dropdownText}>Cairo</Text>
                            {city === 'Cairo' && <Text style={styles.checkmark}>✓</Text>}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.label}>Favorite Cuisines (Max 3)</Text>
                    <View style={styles.cuisineContainer}>
                      {availableCuisines.map((cuisine, index) => (
                        <TouchableOpacity 
                          key={index} 
                          style={[styles.cuisineItem, cuisines.includes(cuisine) && styles.selectedCuisineItem]}
                          onPress={() => {
                            if (cuisines.includes(cuisine)) {
                              // Remove if already selected
                              setCuisines(cuisines.filter(c => c !== cuisine));
                            } else if (cuisines.length < 3) {
                              // Add if less than 3 selected
                              setCuisines([...cuisines, cuisine]);
                            } else {
                              // Alert if trying to select more than 3
                              Alert.alert('Limit Reached', 'You can select a maximum of 3 cuisines');
                            }
                          }}
                        >
                          <View style={styles.checkboxContainer}>
                            <View style={[styles.checkbox, cuisines.includes(cuisine) && styles.checkedBox]}>
                              {cuisines.includes(cuisine) && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.cuisineText}>{cuisine}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                {error && <Text style={styles.errorText}>{error}</Text>}
                
                <EhgezliButton
                  title={isLoginMode ? 'Login' : 'Register'}
                  onPress={handleSubmit}
                  variant="ehgezli"
                  loading={isLoading}
                  style={styles.button}
                />
                
                {isLoginMode && (
                  <TouchableOpacity 
                    style={styles.forgotPassword}
                    onPress={() => {
                      console.log('Navigating to forgot password screen');
                      router.push('/forgot-password');
                    }}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

export default LoginScreen;

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webContainer: {
    flex: 1,
    flexDirection: 'row',
    height: Platform.OS === 'web' ? ('100vh' as unknown as number) : '100%',
  },
  mobileContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imageSection: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#333',
  },
  imageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isWeb ? 40 : 20,
  },
  logoOnImage: {
    fontSize: isWeb ? 48 : 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: isWeb ? 20 : 10,
  },
  taglineOnImage: {
    fontSize: isWeb ? 18 : 14,
    color: '#fff',
    textAlign: 'center',
    lineHeight: isWeb ? 28 : 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 40,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#B71C1C',
    marginBottom: 5,
  },
  logoImage: {
    width: 120,
    height: 60,
    marginBottom: 5,
  },
  logoImageOnBackground: {
    width: 150,
    height: 75,
    marginBottom: 10,
    tintColor: '#ffffff',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      },
    }),
    overflow: 'hidden',
    width: isWeb ? 400 : '100%',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#666',
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  nameField: {
    width: '48%',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  button: {
    marginTop: 10,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
  },
  imageBackground: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  cuisineContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  cuisineItem: {
    width: '48%',
    marginBottom: 10,
  },
  selectedCuisineItem: {
    backgroundColor: '#f5f5f5',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#C1272D',
    borderColor: '#C1272D',
  },
  cuisineText: {
    fontSize: 16,
    color: '#333',
  },
  checkmark: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  cityDropdownContainer: {
    position: 'relative',
    paddingBottom: 15,
  },
  cityDropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  cityDropdownList: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    zIndex: 1,
  },
  cityDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  selectedCityItem: {
    backgroundColor: '#f5f5f5',
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#333',
  },
  datePickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalDone: {
    fontSize: 16,
    color: Colors.primary,
  },
  datePicker: {
    width: '100%',
  },
});
