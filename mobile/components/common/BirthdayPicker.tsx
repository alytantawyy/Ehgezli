import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  useColorScheme,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  FlatList,
} from 'react-native';
import { CalendarList } from 'react-native-calendars';

interface BirthdayPickerProps {
  birthday: Date | null;
  setBirthday?: (date: Date) => void;
}

export default function BirthdayPicker({
  birthday,
  setBirthday,
}: BirthdayPickerProps) {
  const scheme = useColorScheme();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(birthday || today);
  const calendarRef = useRef<any>(null);

  // Sync when parent birthday changes
  useEffect(() => {
    if (birthday) {
      setCurrentDate(birthday);
      calendarRef.current?.scrollToMonth({
        month: birthday.getMonth() + 1,
        year: birthday.getFullYear(),
        animated: false,
      });
    }
  }, [birthday]);

  // Month names and a 120-year range back from today
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const years = Array.from(
    { length: 120 },
    (_, i) => today.getFullYear() - i
  );

  // Themes to override the native “today” blue
  const lightTheme = {
    backgroundColor: '#fff',
    calendarBackground: '#fff',
    textSectionTitleColor: '#333',
    dayTextColor: '#333',
    todayTextColor: '#333',
    selectedDayBackgroundColor: '#B01C2E',
    selectedDayTextColor: '#fff',
    arrowColor: '#B01C2E',
    monthTextColor: '#333',
  };
  const darkTheme = {
    backgroundColor: '#000',
    calendarBackground: '#000',
    textSectionTitleColor: '#ddd',
    dayTextColor: '#fff',
    todayTextColor: '#fff',
    selectedDayBackgroundColor: '#B01C2E',
    selectedDayTextColor: '#fff',
    arrowColor: '#B01C2E',
    monthTextColor: '#fff',
  };

  const currentKey = currentDate.toISOString().slice(0, 10);

  // When user taps a day
  const onDayPress = (day: any) => {
    const picked = new Date(day.year, day.month - 1, day.day);
    setCurrentDate(picked);
    setBirthday?.(picked);
    // Keep calendar focused on that month
    calendarRef.current?.scrollToMonth({
      month: day.month,
      year: day.year,
      animated: true,
    });
  };

  // Move by one month
  const changeMonth = (offset: number) => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + offset);
    setCurrentDate(next);
    setBirthday?.(next);
    calendarRef.current?.scrollToMonth({
      month: next.getMonth() + 1,
      year: next.getFullYear(),
      animated: true,
    });
  };

  // Modal visibility
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const [showYearSelector, setShowYearSelector] = useState(false);

  return (
    <View style={styles.container}>
      {/* custom header with arrows, month, and year */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
          <Text style={styles.navText}>◀︎</Text>
        </TouchableOpacity>

        <View style={styles.labelGroup}>
          <TouchableOpacity onPress={() => setShowMonthSelector(true)}>
            <Text style={styles.labelText}>
              {months[currentDate.getMonth()]}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowYearSelector(true)}>
            <Text style={styles.labelText}>
              {currentDate.getFullYear()}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
          <Text style={styles.navText}>▶︎</Text>
        </TouchableOpacity>
      </View>

      {/* inline CalendarList */}
      <CalendarList
        ref={calendarRef}
        current={currentKey}
        pastScrollRange={0}
        futureScrollRange={0}
        horizontal
        pagingEnabled
        showScrollIndicator
        onDayPress={onDayPress}
        markedDates={{
          [currentKey]: {
            selected: true,
            selectedColor: '#B01C2E',
            selectedTextColor: '#fff',
          },
        }}
        theme={scheme === 'dark' ? darkTheme : lightTheme}
        hideArrows
        renderHeader={() => null}
        hideExtraDays
        style={styles.calendar}
      />

      {/* Month Selector Modal */}
      <Modal visible={showMonthSelector} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.selectorContainer}>
            <FlatList
              data={months}
              keyExtractor={m => m}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.selectorItem,
                    index === currentDate.getMonth() && styles.selectedItem,
                  ]}
                  onPress={() => {
                    const next = new Date(currentDate);
                    next.setMonth(index);
                    setCurrentDate(next);
                    setBirthday?.(next);
                    calendarRef.current?.scrollToMonth({
                      month: index + 1,
                      year: next.getFullYear(),
                      animated: true,
                    });
                    setShowMonthSelector(false);
                  }}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      index === currentDate.getMonth() && styles.selectedText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMonthSelector(false)}
            >
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Year Selector Modal */}
      <Modal visible={showYearSelector} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.selectorContainer}>
            <FlatList
              data={years}
              keyExtractor={y => y.toString()}
              initialScrollIndex={years.findIndex(y => y === currentDate.getFullYear())}
              getItemLayout={(_d, idx) => ({
                length: 50,
                offset: 50 * idx,
                index: idx,
              })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectorItem,
                    item === currentDate.getFullYear() && styles.selectedItem,
                  ]}
                  onPress={() => {
                    const next = new Date(currentDate);
                    next.setFullYear(item);
                    setCurrentDate(next);
                    setBirthday?.(next);
                    calendarRef.current?.scrollToMonth({
                      month: next.getMonth() + 1,
                      year: item,
                      animated: true,
                    });
                    setShowYearSelector(false);
                  }}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      item === currentDate.getFullYear() && styles.selectedText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowYearSelector(false)}
            >
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  navButton: { padding: 8 },
  navText: { fontSize: 18, color: '#B01C2E', fontWeight: '600' },
  labelGroup: { flexDirection: 'row' },
  labelText: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  calendar: { borderRadius: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorContainer: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  selectorItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectorText: { fontSize: 16, color: '#333' },
  selectedItem: { backgroundColor: '#B01C2E' },
  selectedText: { color: '#fff', fontWeight: '600' },
  closeButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeText: { color: '#B01C2E', fontWeight: '600' },
});
