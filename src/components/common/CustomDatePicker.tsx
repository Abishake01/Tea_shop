import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface CustomDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  onCancel: () => void;
  visible: boolean;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  onCancel,
  visible,
}) => {
  const [viewMonth, setViewMonth] = useState(value.getMonth());
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [selectedDay, setSelectedDay] = useState(value.getDate());

  const daysInMonth = useMemo(() => {
    const d = new Date(viewYear, viewMonth + 1, 0);
    return d.getDate();
  }, [viewMonth, viewYear]);

  const firstDayOfWeek = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.getDay();
  }, [viewMonth, viewYear]);

  const days = useMemo(() => {
    const blanks = Array(firstDayOfWeek).fill(null);
    const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    return [...blanks, ...daysList];
  }, [firstDayOfWeek, daysInMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDay(1);
  };

  const handleDayPress = (day: number | null) => {
    if (day == null) return;
    setSelectedDay(day);
  };

  const handleDone = () => {
    const date = new Date(viewYear, viewMonth, selectedDay);
    date.setHours(12, 0, 0, 0);
    onChange(date);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onCancel}
      >
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Select date</Text>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navButton} onPress={handlePrevMonth}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <Text key={d} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {days.map((day, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCell,
                  day == null && styles.dayCellEmpty,
                  day === selectedDay && styles.dayCellSelected,
                ]}
                onPress={() => handleDayPress(day)}
                disabled={day == null}
              >
                <Text
                  style={[
                    styles.dayText,
                    day == null && styles.dayTextEmpty,
                    day === selectedDay && styles.dayTextSelected,
                  ]}
                >
                  {day ?? ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    minWidth: 280,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  cancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: colors.text,
    fontWeight: '600',
  },
  monthYear: {
    ...typography.h3,
    color: colors.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekday: {
    flex: 1,
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellEmpty: {
    opacity: 0,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 20,
  },
  dayText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  dayTextEmpty: {
    color: 'transparent',
  },
  dayTextSelected: {
    color: colors.surface,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    ...typography.button,
    color: colors.surface,
  },
});

export default CustomDatePicker;
