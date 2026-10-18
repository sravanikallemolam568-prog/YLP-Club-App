import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import { auth, db, firebaseClubId, firebaseConfigured } from '../config/firebase.js';

const DATA_COLLECTIONS = [
  { key: 'pssgavel_members', name: 'members' },
  { key: 'pssgavel_meetings', name: 'meetings' },
  { key: 'pssgavel_attendance', name: 'attendance' },
  { key: 'pssgavel_mentors', name: 'mentors' },
  { key: 'pssgavel_ec', name: 'settings', objectRecord: true },
  { key: 'pssgavel_media', name: 'media' },
  { key: 'pssgavel_elections', name: 'elections' },
  { key: 'pssgavel_support_tickets', name: 'supportTickets' },
  { key: 'pssgavel_reminders', name: 'reminders' },
  { key: 'pssgavel_ec_chat', name: 'ecChat' }
];

let state = 'unconfigured';
let lastError = '';
let activeUid = null;
let activeRole = null;
let generation = 0;
let unsubscribeListeners = [];
let readyCollections = new Set();
let localBaselines = new Map();
let remoteRecords = new Map();
let syncQueues = new Map();

function readCache(spec) {
  let stored;
  try {
    stored = JSON.parse(localStorage.getItem(spec.key) || (spec.objectRecord ? '{}' : '[]'));
  } catch {
    stored = spec.objectRecord ? {} : [];
  }
  if (spec.objectRecord) return [{ id: 'roster', ...(stored || {}) }];
  return Array.isArray(stored) ? stored.filter(record => record && record.id != null) : [];
}

function writeCache(spec, records) {
  if (spec.objectRecord) {
    const { id, ...roster } = records.find(record => record.id === 'roster') || {};
    localStorage.setItem(spec.key, JSON.stringify(roster));
  } else {
    localStorage.setItem(spec.key, JSON.stringify(records));
  }
}

function cleanRecord(record) {
  const { cloudUpdatedAt, cloudUpdatedBy, ...data } = record;
  return data;
}

function stableValue(value) {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableValue(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function recordsEqual(first, second) {
  return stableValue(cleanRecord(first)) === stableValue(cleanRecord(second));
}

function collectionRef(spec) {
  return collection(db, 'clubs', firebaseClubId, spec.name);
}

function collectionsForRole(role) {
  if (['President', 'Club Advisor', 'EC Officer', 'Member'].includes(role)) return DATA_COLLECTIONS;
  const allowedKeys = role === 'VP Membership'
    ? ['pssgavel_members', 'pssgavel_meetings', 'pssgavel_attendance', 'pssgavel_ec', 'pssgavel_elections', 'pssgavel_support_tickets', 'pssgavel_reminders', 'pssgavel_ec_chat']
    : role === 'VP Education'
      ? ['pssgavel_meetings', 'pssgavel_attendance', 'pssgavel_mentors', 'pssgavel_ec', 'pssgavel_elections', 'pssgavel_support_tickets', 'pssgavel_reminders', 'pssgavel_ec_chat']
      : role === 'VP Public Relations'
        ? ['pssgavel_meetings', 'pssgavel_ec', 'pssgavel_media', 'pssgavel_elections', 'pssgavel_support_tickets', 'pssgavel_reminders', 'pssgavel_ec_chat']
        : role === 'Secretary'
          ? ['pssgavel_meetings', 'pssgavel_attendance', 'pssgavel_ec', 'pssgavel_elections', 'pssgavel_support_tickets', 'pssgavel_reminders', 'pssgavel_ec_chat']
          : role === 'Sergeant-at-Arms'
            ? ['pssgavel_meetings', 'pssgavel_ec', 'pssgavel_elections', 'pssgavel_support_tickets', 'pssgavel_reminders', 'pssgavel_ec_chat']
            : [];
  return DATA_COLLECTIONS.filter(spec => allowedKeys.includes(spec.key));
}

function queryForRole(spec, role, uid) {
  const ref = collectionRef(spec);
  const isLeader = ['President', 'Club Advisor', 'VP Education', 'Secretary', 'EC Officer'].includes(role);
  return spec.name === 'supportTickets' && !isLeader
    ? query(ref, where('createdByUid', '==', uid))
    : ref;
}

function notifyStatus() {
  window.dispatchEvent(new CustomEvent('club:cloud-status', { detail: getCloudStatus() }));
}

function setState(nextState, error = '') {
  state = nextState;
  lastError = error;
  notifyStatus();
}

function newAuditRef() {
  return doc(collection(db, 'clubs', firebaseClubId, 'auditLogs'));
}

async function commitChanges(spec, upserts, deletions) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('You are signed out. Sign in again to save club data.');
  const changes = [
    ...upserts.map(record => ({ action: 'created-or-updated', record })),
    ...deletions.map(id => ({ action: 'deleted', id }))
  ];

  for (let offset = 0; offset < changes.length; offset += 200) {
    const batch = writeBatch(db);
    for (const change of changes.slice(offset, offset + 200)) {
      const id = String(change.record?.id ?? change.id);
      const recordRef = doc(collectionRef(spec), id);
      if (change.record) {
        const ticketOwner = spec.name === 'supportTickets' && !remoteRecords.get(spec.key)?.has(id)
          ? { createdByUid: uid }
          : {};
        batch.set(recordRef, {
          ...change.record,
          ...ticketOwner,
          cloudUpdatedBy: uid,
          cloudUpdatedAt: serverTimestamp()
        });
      } else {
        batch.delete(recordRef);
      }
      batch.set(newAuditRef(), {
        collection: spec.name,
        recordId: id,
        action: change.action,
        actorUid: uid,
        recordedAt: serverTimestamp()
      });
    }
    await batch.commit();
  }
}

export function notifyLocalDataChanged(storageKey, value) {
  if (state !== 'online' || !readyCollections.has(storageKey)) return;
  const spec = DATA_COLLECTIONS.find(item => item.key === storageKey);
  if (!spec) return;

  const before = localBaselines.get(storageKey) || [];
  const after = spec.objectRecord
    ? [{ id: 'roster', ...(value || {}) }]
    : Array.isArray(value) ? value.filter(record => record && record.id != null) : [];
  const oldById = new Map(before.map(record => [String(record.id), record]));
  const newById = new Map(after.map(record => [String(record.id), record]));
  const upserts = after.filter(record => {
    const previous = oldById.get(String(record.id));
    return !previous || !recordsEqual(previous, record);
  });
  const remote = remoteRecords.get(storageKey) || new Map();
  const deletions = [...oldById.keys()].filter(id => !newById.has(id) && remote.has(id));
  localBaselines.set(storageKey, after);
  if (!upserts.length && !deletions.length) return;

  const previousQueue = syncQueues.get(storageKey) || Promise.resolve();
  const nextQueue = previousQueue
    .catch(() => {})
    .then(() => commitChanges(spec, upserts, deletions))
    .then(() => {
      const updatedRemote = new Map(remoteRecords.get(storageKey) || []);
      upserts.forEach(record => updatedRemote.set(String(record.id), record));
      deletions.forEach(id => updatedRemote.delete(id));
      remoteRecords.set(storageKey, updatedRemote);
    })
    .catch(error => {
      setState('error', error?.message || 'Could not save records to Firestore.');
      window.dispatchEvent(new CustomEvent('club:cloud-error', { detail: lastError }));
    });
  syncQueues.set(storageKey, nextQueue);
}

export function getCloudStatus() {
  return {
    configured: firebaseConfigured,
    state: firebaseConfigured ? state : 'unconfigured',
    error: lastError,
    clubId: firebaseClubId
  };
}

export async function startCloudSync(role) {
  if (!firebaseConfigured || !db || !auth?.currentUser) {
    setState('unconfigured', 'Configure Firebase and sign in to access club records.');
    return false;
  }
  if (activeUid === auth.currentUser.uid && activeRole === role && state === 'online') return true;

  stopCloudSync();
  const currentGeneration = ++generation;
  activeUid = auth.currentUser.uid;
  activeRole = role;
  readyCollections = new Set();
  localBaselines = new Map();
  remoteRecords = new Map();
  setState('connecting');
  const accessibleCollections = collectionsForRole(role);
  const accessibleKeys = new Set(accessibleCollections.map(spec => spec.key));
  DATA_COLLECTIONS.filter(spec => !accessibleKeys.has(spec.key)).forEach(spec => writeCache(spec, []));

  return new Promise(resolve => {
    let remaining = accessibleCollections.length;
    let finished = false;
    const timeoutId = setTimeout(() => {
      if (currentGeneration === generation) setState('error', 'Timed out while loading Firestore records.');
      finish(false);
    }, 15000);
    const finish = success => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      resolve(success);
    };
    const markReady = () => {
      remaining -= 1;
      if (remaining === 0) {
        if (state !== 'error') setState('online');
        finish(state === 'online');
      }
    };

    if (!remaining) {
      setState('error', 'This account has no database access role.');
      finish(false);
      return;
    }

    for (const spec of accessibleCollections) {
      const unsubscribe = onSnapshot(queryForRole(spec, role, activeUid), snapshot => {
        if (currentGeneration !== generation) return;
        const records = snapshot.docs.map(item => ({ ...cleanRecord(item.data()), id: item.id }));
        remoteRecords.set(spec.key, new Map(records.map(record => [String(record.id), record])));
        writeCache(spec, records);
        localBaselines.set(spec.key, records);
        readyCollections.add(spec.key);
        window.dispatchEvent(new CustomEvent('club:cloud-data-changed'));
        markReady();
      }, error => {
        if (currentGeneration !== generation) return;
        setState('error', error?.message || 'Unable to load Firestore records.');
        readyCollections.add(spec.key);
        markReady();
      });
      unsubscribeListeners.push(unsubscribe);
    }
  });
}

export function stopCloudSync() {
  generation += 1;
  unsubscribeListeners.forEach(unsubscribe => unsubscribe());
  unsubscribeListeners = [];
  readyCollections = new Set();
  localBaselines = new Map();
  remoteRecords = new Map();
  syncQueues = new Map();
  activeUid = null;
  activeRole = null;
  setState(firebaseConfigured ? 'offline' : 'unconfigured');
}

export function exportCloudBackup() {
  const backup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    clubId: firebaseClubId,
    note: 'Client cache export only. Use scheduled Firestore exports for a complete cloud backup.',
    collections: Object.fromEntries(DATA_COLLECTIONS.map(spec => [spec.name, readCache(spec)]))
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `pss-miyapur-gavel-cache-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
