import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { TECHS, Tech } from '../../../constants/techs';
import { ROOM_PRESETS } from '../../../constants/templates';
import { PlaybookPhases } from './playbook-phases';
import { PlaybookPrices } from './playbook-prices';
import { PlaybookContest } from './playbook-contest';
import {
  BG_APP,
  BG_CARD,
  BG_INPUT,
  BORDER_COLOR,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_MUTED,
  TEXT_DIM,
  PDQ_ORANGE,
  PDQ_BLUE,
  PDQ_RED,
  PDQ_GREEN,
} from '../../../constants/colors';

type TabId = 'techs' | 'rooms' | 'phases' | 'prices' | 'contest';

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: 'techs', label: 'Techs', icon: '\uD83D\uDC77' },
  { id: 'rooms', label: 'Rooms', icon: '\uD83C\uDFE0' },
  { id: 'phases', label: 'Phases', icon: '\uD83D\uDCCB' },
  { id: 'prices', label: 'Prices', icon: '\uD83D\uDCB0' },
  { id: 'contest', label: 'Contest', icon: '\uD83C\uDFC6' },
];

interface EditableTech {
  id: string;
  name: string;
  code: string;
  closingRatio: number;
  avgJobSize: number;
}

interface RoomEntry {
  name: string;
  enabled: boolean;
  custom: boolean;
}

export default function PlaybookScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('techs');

  // ── Techs state ──
  const [techs, setTechs] = useState<EditableTech[]>(
    TECHS.map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      closingRatio: t.closingRatio,
      avgJobSize: t.avgJobSize,
    }))
  );
  const [editingTechId, setEditingTechId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', closingRatio: '', avgJobSize: '' });
  const [showAddTech, setShowAddTech] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', code: '', closingRatio: '', avgJobSize: '' });

  // ── Rooms state ──
  const [rooms, setRooms] = useState<RoomEntry[]>(
    ROOM_PRESETS.map((name) => ({ name, enabled: true, custom: false }))
  );
  const [newRoomName, setNewRoomName] = useState('');

  // ── Tab bar ──
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          onPress={() => setActiveTab(tab.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Save handler ──
  const handleSave = () => {
    if (Platform.OS === 'web') {
      window.alert('Playbook saves will be connected to Supabase in a future update.');
    } else {
      Alert.alert('Save', 'Playbook saves will be connected to Supabase in a future update.');
    }
  };

  // ── Techs Tab ──
  const startEditTech = (tech: EditableTech) => {
    setEditingTechId(tech.id);
    setEditForm({
      name: tech.name,
      code: tech.code,
      closingRatio: String(tech.closingRatio),
      avgJobSize: String(tech.avgJobSize),
    });
  };

  const saveEditTech = () => {
    if (!editingTechId) return;
    setTechs((prev) =>
      prev.map((t) =>
        t.id === editingTechId
          ? {
              ...t,
              name: editForm.name,
              code: editForm.code.toUpperCase(),
              closingRatio: Number(editForm.closingRatio) || 0,
              avgJobSize: Number(editForm.avgJobSize) || 0,
            }
          : t
      )
    );
    setEditingTechId(null);
  };

  const deleteTech = (techId: string) => {
    const tech = techs.find((t) => t.id === techId);
    const doDelete = () => setTechs((prev) => prev.filter((t) => t.id !== techId));

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete ${tech?.name}? This cannot be undone.`)) {
        doDelete();
      }
    } else {
      Alert.alert('Delete Tech', `Delete ${tech?.name}? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const addTech = () => {
    if (!addForm.name.trim() || !addForm.code.trim()) return;
    const code = addForm.code.toUpperCase().slice(0, 2);
    const newTech: EditableTech = {
      id: code,
      name: addForm.name.trim(),
      code,
      closingRatio: Number(addForm.closingRatio) || 0,
      avgJobSize: Number(addForm.avgJobSize) || 0,
    };
    setTechs((prev) => [...prev, newTech]);
    setAddForm({ name: '', code: '', closingRatio: '', avgJobSize: '' });
    setShowAddTech(false);
  };

  const renderTechsTab = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      <Text style={styles.sectionTitle}>Tech Roster</Text>
      <Text style={styles.sectionSubtitle}>
        Manage technicians, login codes, and KPI targets
      </Text>

      {techs.map((tech) => (
        <View key={tech.id} style={styles.techCard}>
          {editingTechId === tech.id ? (
            <View>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Name</Text>
                <TextInput
                  style={styles.editInput}
                  value={editForm.name}
                  onChangeText={(t) => setEditForm((f) => ({ ...f, name: t }))}
                  placeholderTextColor={TEXT_DIM}
                />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Code</Text>
                <TextInput
                  style={[styles.editInput, { width: 80 }]}
                  value={editForm.code}
                  onChangeText={(t) => setEditForm((f) => ({ ...f, code: t.toUpperCase().slice(0, 2) }))}
                  maxLength={2}
                  autoCapitalize="characters"
                  placeholderTextColor={TEXT_DIM}
                />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Closing %</Text>
                <TextInput
                  style={[styles.editInput, { width: 80 }]}
                  value={editForm.closingRatio}
                  onChangeText={(t) => setEditForm((f) => ({ ...f, closingRatio: t }))}
                  keyboardType="numeric"
                  placeholderTextColor={TEXT_DIM}
                />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>Avg Job $</Text>
                <TextInput
                  style={[styles.editInput, { width: 120 }]}
                  value={editForm.avgJobSize}
                  onChangeText={(t) => setEditForm((f) => ({ ...f, avgJobSize: t }))}
                  keyboardType="numeric"
                  placeholderTextColor={TEXT_DIM}
                />
              </View>
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.btnSave} onPress={saveEditTech} activeOpacity={0.7}>
                  <Text style={styles.btnSaveText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnCancel}
                  onPress={() => setEditingTechId(null)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.techRow}>
              <View style={styles.techInfo}>
                <View style={styles.techHeader}>
                  <Text style={styles.techAvatar}>{'\uD83D\uDC77'}</Text>
                  <Text style={styles.techName}>{tech.name}</Text>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeBadgeText}>{tech.code}</Text>
                  </View>
                </View>
                <View style={styles.techStats}>
                  <Text style={styles.statText}>
                    Close: <Text style={styles.statValue}>{tech.closingRatio}%</Text>
                  </Text>
                  <Text style={styles.statDivider}>|</Text>
                  <Text style={styles.statText}>
                    Avg: <Text style={styles.statValue}>${tech.avgJobSize.toLocaleString()}</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.techActions}>
                <TouchableOpacity
                  style={styles.btnEdit}
                  onPress={() => startEditTech(tech)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnEditText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnDelete}
                  onPress={() => deleteTech(tech.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.btnDeleteText}>{'\u2715'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}

      {showAddTech ? (
        <View style={styles.addCard}>
          <Text style={styles.addCardTitle}>Add New Tech</Text>
          <View style={styles.editRow}>
            <Text style={styles.editLabel}>Name</Text>
            <TextInput
              style={styles.editInput}
              value={addForm.name}
              onChangeText={(t) => setAddForm((f) => ({ ...f, name: t }))}
              placeholder="e.g. John D"
              placeholderTextColor={TEXT_DIM}
            />
          </View>
          <View style={styles.editRow}>
            <Text style={styles.editLabel}>Code</Text>
            <TextInput
              style={[styles.editInput, { width: 80 }]}
              value={addForm.code}
              onChangeText={(t) => setAddForm((f) => ({ ...f, code: t.toUpperCase().slice(0, 2) }))}
              maxLength={2}
              autoCapitalize="characters"
              placeholder="JD"
              placeholderTextColor={TEXT_DIM}
            />
          </View>
          <View style={styles.editRow}>
            <Text style={styles.editLabel}>Closing %</Text>
            <TextInput
              style={[styles.editInput, { width: 80 }]}
              value={addForm.closingRatio}
              onChangeText={(t) => setAddForm((f) => ({ ...f, closingRatio: t }))}
              keyboardType="numeric"
              placeholder="65"
              placeholderTextColor={TEXT_DIM}
            />
          </View>
          <View style={styles.editRow}>
            <Text style={styles.editLabel}>Avg Job $</Text>
            <TextInput
              style={[styles.editInput, { width: 120 }]}
              value={addForm.avgJobSize}
              onChangeText={(t) => setAddForm((f) => ({ ...f, avgJobSize: t }))}
              keyboardType="numeric"
              placeholder="9000"
              placeholderTextColor={TEXT_DIM}
            />
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.btnSave, (!addForm.name.trim() || !addForm.code.trim()) && { opacity: 0.5 }]}
              onPress={addTech}
              disabled={!addForm.name.trim() || !addForm.code.trim()}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSaveText}>Add Tech</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => {
                setShowAddTech(false);
                setAddForm({ name: '', code: '', closingRatio: '', avgJobSize: '' });
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddTech(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+ Add Tech</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
        <Text style={styles.saveBtnText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── Rooms Tab ──
  const toggleRoom = (index: number) => {
    setRooms((prev) =>
      prev.map((r, i) => (i === index ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const moveRoom = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= rooms.length) return;
    setRooms((prev) => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  };

  const addCustomRoom = () => {
    const name = newRoomName.trim();
    if (!name) return;
    if (rooms.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
      if (Platform.OS === 'web') {
        window.alert('A room with that name already exists.');
      } else {
        Alert.alert('Duplicate', 'A room with that name already exists.');
      }
      return;
    }
    setRooms((prev) => [...prev, { name, enabled: true, custom: true }]);
    setNewRoomName('');
  };

  const removeCustomRoom = (index: number) => {
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  const renderRoomsTab = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      <Text style={styles.sectionTitle}>Room Presets</Text>
      <Text style={styles.sectionSubtitle}>
        Toggle rooms on/off and reorder the list
      </Text>

      {rooms.map((room, index) => (
        <View key={`${room.name}-${index}`} style={styles.roomCard}>
          <View style={styles.roomLeft}>
            <View style={styles.roomArrows}>
              <TouchableOpacity
                onPress={() => moveRoom(index, 'up')}
                style={[styles.arrowBtn, index === 0 && { opacity: 0.3 }]}
                disabled={index === 0}
                activeOpacity={0.5}
              >
                <Text style={styles.arrowText}>{'\u25B2'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveRoom(index, 'down')}
                style={[styles.arrowBtn, index === rooms.length - 1 && { opacity: 0.3 }]}
                disabled={index === rooms.length - 1}
                activeOpacity={0.5}
              >
                <Text style={styles.arrowText}>{'\u25BC'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.roomName, !room.enabled && styles.roomNameDisabled]}>
              {room.name}
            </Text>
            {room.custom && (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Custom</Text>
              </View>
            )}
          </View>
          <View style={styles.roomRight}>
            {room.custom && (
              <TouchableOpacity
                style={styles.btnDeleteSmall}
                onPress={() => removeCustomRoom(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.btnDeleteText}>{'\u2715'}</Text>
              </TouchableOpacity>
            )}
            <Switch
              value={room.enabled}
              onValueChange={() => toggleRoom(index)}
              trackColor={{ false: '#334155', true: PDQ_GREEN + '80' }}
              thumbColor={room.enabled ? PDQ_GREEN : '#64748b'}
            />
          </View>
        </View>
      ))}

      <View style={styles.addRoomRow}>
        <TextInput
          style={styles.addRoomInput}
          value={newRoomName}
          onChangeText={setNewRoomName}
          placeholder="Custom room name..."
          placeholderTextColor={TEXT_DIM}
          onSubmitEditing={addCustomRoom}
        />
        <TouchableOpacity
          style={[styles.addRoomBtn, !newRoomName.trim() && { opacity: 0.5 }]}
          onPress={addCustomRoom}
          disabled={!newRoomName.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.addRoomBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.7}>
        <Text style={styles.saveBtnText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ── Placeholder Tab ──
  const renderPlaceholder = (tabName: string) => (
    <View style={styles.placeholderWrap}>
      <Text style={styles.placeholderText}>{tabName} — Coming soon</Text>
    </View>
  );

  // ── Content switcher ──
  const renderContent = () => {
    switch (activeTab) {
      case 'techs':
        return renderTechsTab();
      case 'rooms':
        return renderRoomsTab();
      case 'phases':
        return <PlaybookPhases />;
      case 'prices':
        return <PlaybookPrices />;
      case 'contest':
        return <PlaybookContest />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backText}>{'\u2190'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Playbook — Admin</Text>
        <View style={{ width: 60 }} />
      </View>

      {renderTabBar()}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_APP,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: BG_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  backText: {
    color: PDQ_BLUE,
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    color: TEXT_PRIMARY,
    fontSize: 17,
    fontWeight: '800',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: BG_CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: PDQ_ORANGE,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_DIM,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: PDQ_ORANGE,
  },

  // Content
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_PRIMARY,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 16,
  },

  // Tech card
  techCard: {
    backgroundColor: BG_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 14,
    marginBottom: 10,
  },
  techRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  techInfo: {
    flex: 1,
  },
  techHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  techAvatar: {
    fontSize: 20,
  },
  techName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  codeBadge: {
    backgroundColor: PDQ_BLUE + '25',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  codeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: PDQ_BLUE,
    letterSpacing: 1,
  },
  techStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 30,
  },
  statText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  statValue: {
    fontWeight: '700',
    color: TEXT_SECONDARY,
  },
  statDivider: {
    color: BORDER_COLOR,
  },
  techActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnEdit: {
    backgroundColor: PDQ_BLUE + '20',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnEditText: {
    color: PDQ_BLUE,
    fontSize: 13,
    fontWeight: '700',
  },
  btnDelete: {
    backgroundColor: PDQ_RED + '20',
    borderRadius: 6,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDeleteSmall: {
    backgroundColor: PDQ_RED + '20',
    borderRadius: 6,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  btnDeleteText: {
    color: PDQ_RED,
    fontSize: 14,
    fontWeight: '700',
  },

  // Edit form
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  editLabel: {
    width: 80,
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  editInput: {
    flex: 1,
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: TEXT_PRIMARY,
    fontSize: 14,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnSave: {
    backgroundColor: PDQ_GREEN,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btnSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  btnCancelText: {
    color: TEXT_MUTED,
    fontSize: 14,
    fontWeight: '600',
  },

  // Add tech
  addCard: {
    backgroundColor: BG_CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PDQ_ORANGE + '40',
    padding: 16,
    marginBottom: 10,
  },
  addCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PDQ_ORANGE,
    marginBottom: 12,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  addBtnText: {
    color: PDQ_BLUE,
    fontSize: 15,
    fontWeight: '700',
  },

  // Save button
  saveBtn: {
    backgroundColor: PDQ_ORANGE,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  // Room card
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG_CARD,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  roomLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  roomArrows: {
    flexDirection: 'column',
    gap: 2,
  },
  arrowBtn: {
    width: 24,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 10,
    color: TEXT_MUTED,
  },
  roomName: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  roomNameDisabled: {
    color: TEXT_DIM,
    textDecorationLine: 'line-through',
  },
  customBadge: {
    backgroundColor: PDQ_ORANGE + '20',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: PDQ_ORANGE,
    textTransform: 'uppercase',
  },
  roomRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Add room
  addRoomRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  addRoomInput: {
    flex: 1,
    backgroundColor: BG_INPUT,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT_PRIMARY,
    fontSize: 14,
  },
  addRoomBtn: {
    backgroundColor: PDQ_BLUE,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addRoomBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Placeholder
  placeholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  placeholderText: {
    fontSize: 18,
    color: TEXT_DIM,
    fontWeight: '600',
  },
});
