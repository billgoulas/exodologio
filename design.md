# Εξοδολόγιο - Mobile App Design

## Overview

Το Εξοδολόγιο είναι μια εφαρμογή διαχείρισης προσωπικών οικονομικών που επιτρέπει στους χρήστες να παρακολουθούν τα έσοδα και τα έξοδα τους ανά κατηγορία, να δημιουργούν αναφορές με διαγράμματα και να εξάγουν/εισάγουν δεδομένα μεταξύ συσκευών.

## Screen List

1. **Home (Dashboard)** - Αρχική οθόνη με σύνοψη εσόδων/εξόδων
2. **Transactions** - Λίστα συναλλαγών με φίλτρα
3. **Analytics** - Διαγράμματα και ανάλυση κατηγοριών
4. **Add/Edit Transaction** - Φόρμα προσθήκης/επεξεργασίας συναλλαγής
5. **Settings** - Ρυθμίσεις γλώσσας, νομίσματος, θέματος, import/export

## Primary Content and Functionality

### Home Screen (Dashboard)
- **Summary Cards** (3 cards με χρώματα):
  - Συνολικά Έσοδα (πράσινο)
  - Συνολικά Έξοδα (κόκκινο)
  - Καθαρό Υπόλοιπο (μπλε)
- **Month Navigation**: Βέλη για πλοήγηση μεταξύ μηνών
- **Recent Transactions**: Λίστα πρόσφατων συναλλαγών με εικονίδια κατηγοριών
- **Floating Action Button (FAB)**: Κουμπί προσθήκης νέας συναλλαγής

### Transactions Screen
- **Filter Tabs**: "Όλες", "Έσοδα", "Έξοδα"
- **Transaction List**: Κάθε συναλλαγή δείχνει:
  - Εικονίδιο κατηγορίας
  - Όνομα κατηγορίας
  - Περιγραφή (προαιρετικό)
  - Ποσό με χρώμα (πράσινο για έσοδα, κόκκινο για έξοδα)
  - Ημερομηνία
- **Swipe to Delete**: Δυνατότητα διαγραφής με σύρσιμο

### Analytics Screen
- **Expense Analysis by Category**: Λίστα κατηγοριών με ποσοστό και ποσό
- **Income Analysis by Category**: Λίστα κατηγοριών με ποσοστό και ποσό
- **Charts** (Pie/Bar charts για visual representation)

### Add/Edit Transaction Screen
- **Type Toggle**: Έξοδο / Έσοδο
- **Amount Input**: Ποσό με νόμισμα
- **Category Selection**: Κουμπιά κατηγοριών (wrap layout)
- **Date Picker**: Επιλογή ημερομηνίας
- **Notes Field**: Προαιρετικές σημειώσεις
- **Save Button**: Αποθήκευση συναλλαγής

### Settings Screen
- **Language Section**: 9 κουμπιά γλωσσών
- **Currency Section**: 9 κουμπιά νομισμάτων
- **Date Format Section**: 6 επιλογές μορφής ημερομηνίας
- **Theme Section**: Auto, Light, Dark
- **Data Management**: 
  - Export Data Button
  - Import Data Button
  - Delete All Transactions Button

## Key User Flows

### Flow 1: Add Income
1. User taps FAB on Home screen
2. Add/Edit screen opens with "Έσοδο" selected
3. User enters amount, selects category, date, notes
4. User taps Save
5. Transaction appears in list, summary updates

### Flow 2: View Expenses by Category
1. User navigates to Analytics screen
2. User sees expense breakdown by category with percentages
3. User can view pie/bar chart visualization

### Flow 3: Export and Import Data
1. User goes to Settings
2. User taps "Export Data" → file is generated (JSON)
3. User can share file via email/cloud
4. On another device, user taps "Import Data"
5. User selects file → data is merged with existing data
6. Summary updates to reflect merged data

## Color Choices

| Element | Color | Usage |
|---------|-------|-------|
| Income | #22C55E (Green) | Summary card, positive amounts |
| Expense | #EF4444 (Red) | Summary card, negative amounts |
| Balance | #0A7EA4 (Teal) | Summary card, net balance |
| Primary | #0A7EA4 (Teal) | Buttons, active states |
| Background | #FFFFFF (Light) / #151718 (Dark) | Screen background |
| Surface | #F5F5F5 (Light) / #1E2022 (Dark) | Cards, elevated surfaces |
| Text | #11181C (Light) / #ECEDEE (Dark) | Primary text |
| Muted | #687076 (Light) / #9BA1A6 (Dark) | Secondary text |

## Category Icons and Colors

Each category has a unique emoji/icon:

| Category | Icon | Color |
|----------|------|-------|
| Μισθός | 💼 | Green |
| Δώρο | 🎁 | Orange |
| Ελεύθερη Εργασία | 💻 | Blue |
| Επέndυση | 📈 | Purple |
| Άλλο (Income) | 📌 | Gray |
| Ενοίκιο | 🏠 | Orange |
| Τρόφιμα | 🛒 | Green |
| Μεταφορά | 🚗 | Red |
| Υγεία | 🏥 | Blue |
| Ψυχαγωγία | 🎬 | Purple |
| Επισκευή | 🔧 | Gray |
| Διασκέδαση | 🎬 | Pink |
| Λογαριασμοί | 📋 | Teal |
| Άλλο (Expense) | 📌 | Gray |

## Layout Principles

- **Portrait Orientation**: All screens designed for 9:16 portrait mode
- **One-Handed Usage**: Important buttons positioned in lower half of screen
- **Safe Area**: Content respects notch and home indicator
- **Tab Bar**: Bottom tab navigation (Home, Transactions, Analytics, Settings)
- **Spacing**: Consistent 16px padding, 12px gaps between elements
- **Typography**: 
  - Headings: 24px bold
  - Body: 16px regular
  - Small: 14px regular
  - Muted: 12px regular

## Interaction Patterns

- **Press Feedback**: Buttons scale to 0.97 with haptic feedback
- **Swipe Actions**: Swipe left to delete transactions
- **Pull to Refresh**: Refresh transaction list (if needed)
- **Modal Sheets**: Add/Edit transaction opens as modal
- **Haptic Feedback**: Light impact on button press, success on save
