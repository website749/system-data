import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  Upload,
  Shuffle,
  Link2,
  RotateCcw,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  MapPin,
  UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// --- Firebase Setup (Safe initialization if config exists) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'stau-volunteer-default';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;

let app = null;
let auth = null;
let db = null;

if (firebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

// --- Helper Functions ---
const REQUIRED_PASSWORD = '$printc++';

const DEFAULT_HEADERS = ['ឈ្មោះ', 'ភេទ', 'ភូមិ', 'ឃុំ', 'ស្រុក'];

const DEFAULT_YOUTH_DATA = [
  { name: 'សុខ ចាន់ណា', gender: 'ស្រី', location: 'ភូមិស្តៅ, ឃុំស្តៅ, ស្រុករតនមណ្ឌល', rawRow: { 'ឈ្មោះ': 'សុខ ចាន់ណា', 'ភេទ': 'ស្រី', 'ភូមិ': 'ស្តៅ', 'ឃុំ': 'ស្តៅ', 'ស្រុក': 'រតនមណ្ឌល' } },
  { name: 'កែវ វិសាល', gender: 'ប្រុស', location: 'ភូមិបឹងអំពិល, ឃុំស្តៅ, ស្រុករតនមណ្ឌល', rawRow: { 'ឈ្មោះ': 'កែវ វិសាល', 'ភេទ': 'ប្រុស', 'ភូមិ': 'បឹងអំពិល', 'ឃុំ': 'ស្តៅ', 'ស្រុក': 'រតនមណ្ឌល' } },
  { name: 'លី សុភា', gender: 'ស្រី', location: 'ភូមិបវេល, ឃុំបវេល, ស្រុកបវេល', rawRow: { 'ឈ្មោះ': 'លី សុភា', 'ភេទ': 'ស្រី', 'ភូមិ': 'បវេល', 'ឃុំ': 'បវេល', 'ស្រុក': 'បវេល' } },
  { name: 'ចាន់ តារា', gender: 'ប្រុស', location: 'ភូមិដូនម៉ាយ, ឃុំស្តៅ, ស្រុករតនមណ្ឌល', rawRow: { 'ឈ្មោះ': 'ចាន់ តារា', 'ភេទ': 'ប្រុស', 'ភូមិ': 'ដូនម៉ាយ', 'ឃុំ': 'ស្តៅ', 'ស្រុក': 'រតនមណ្ឌល' } },
  { name: 'ហេង ស្រីនិច', gender: 'ស្រី', location: 'ភូមិខ្នាចរមាស, ឃុំខ្នាចរមាស, ស្រុកបវេល', rawRow: { 'ឈ្មោះ': 'ហេង ស្រីនិច', 'ភេទ': 'ស្រី', 'ភូមិ': 'ខ្នាចរមាស', 'ឃុំ': 'ខ្នាចរមាស', 'ស្រុក': 'បវេល' } },
  { name: 'ផាន់ សុវណ្ណ', gender: 'ប្រុស', location: 'ភូមិស្តៅ, ឃុំស្តៅ, ស្រុករតនមណ្ឌល', rawRow: { 'ឈ្មោះ': 'ផាន់ សុវណ្ណ', 'ភេទ': 'ប្រុស', 'ភូមិ': 'ស្តៅ', 'ឃុំ': 'ស្តៅ', 'ស្រុក': 'រតនមណ្ឌល' } },
  { name: 'ម៉ៅ រតនា', gender: 'ស្រី', location: 'ភូមិល្វា, ឃុំល្វា, ស្រុកបវេល', rawRow: { 'ឈ្មោះ': 'ម៉ៅ រតនា', 'ភេទ': 'ស្រី', 'ភូមិ': 'ល្វា', 'ឃុំ': 'ល្វា', 'ស្រុក': 'បវេល' } },
  { name: 'គង់ ពិសិដ្ឋ', gender: 'ប្រុស', location: 'ភូមិបវេល, ឃុំបវេល, ស្រុកបវេល', rawRow: { 'ឈ្មោះ': 'គង់ ពិសិដ្ឋ', 'ភេទ': 'ប្រុស', 'ភូមិ': 'បវេល', 'ឃុំ': 'បវេល', 'ស្រុក': 'បវេល' } },
  { name: 'អ៊ុក ស្រីមុំ', gender: 'ស្រី', location: 'ភូមិអូរដា, ឃុំស្តៅ, ស្រុករតនមណ្ឌល', rawRow: { 'ឈ្មោះ': 'អ៊ុក ស្រីមុំ', 'ភេទ': 'ស្រី', 'ភូមិ': 'អូរដា', 'ឃុំ': 'ស្តៅ', 'ស្រុក': 'រតនមណ្ឌល' } },
  { name: 'ឈុន បញ្ញា', gender: 'ប្រុស', location: 'ភូមិខ្នាចរមាស, ឃុំខ្នាចរមាស, ស្រុកបវេល', rawRow: { 'ឈ្មោះ': 'ឈុន បញ្ញា', 'ភេទ': 'ប្រុស', 'ភូមិ': 'ខ្នាចរមាស', 'ឃុំ': 'ខ្នាចរមាស', 'ស្រុក': 'បវេល' } }
];

function getRandomAge(min = 19, max = 40) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizeGender(val) {
  if (!val) return 'មិនបញ្ជាក់';
  const v = val.toString().trim().toLowerCase();
  if (v.includes('ស្រី') || v === 'female' || v === 'f') return 'ស្រី';
  if (v.includes('ប្រុស') || v === 'male' || v === 'm') return 'ប្រុស';
  return val.toString().trim();
}

// Robust CSV line parser handling quoted commas
function parseCSVRows(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^\uFEFF/, ''));
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] !== undefined ? values[idx] : '';
    });
    return obj;
  });

  return { headers, rows };
}

// Safe UTF-8 Base64 encoding/decoding for URL sharing without external libs
function encodeDatasetToHash(payload) {
  try {
    const jsonStr = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error('Encoding error:', e);
    return '';
  }
}

function decodeDatasetFromHash(encoded) {
  try {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Decoding error:', e);
    return null;
  }
}

// Custom Tooltip for Main Bar Chart
const CustomAgeTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const person = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 border border-slate-700">
        <p className="font-bold text-sm text-white">{person.name}</p>
        <p className="text-amber-300 font-semibold">អាយុ៖ {person.age} ឆ្នាំ</p>
        <p className="text-slate-200">ភេទ៖ {person.gender}</p>
        <p className="text-slate-300">ទីកន្លែង៖ {person.location}</p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Location Bar Chart
const CustomLocationTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg text-xs border border-slate-700">
        <p className="font-semibold text-white">{item.location}</p>
        <p className="text-emerald-300 mt-0.5">ចំនួនយុវជន៖ {item.count} នាក់</p>
      </div>
    );
  }
  return null;
};

export default function App() {
  // Auth & Lock Screen State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);

  // Firebase Auth User
  const [user, setUser] = useState(null);

  // Dataset State
  const [youthData, setYouthData] = useState(() =>
    DEFAULT_YOUTH_DATA.map((p) => ({ ...p, age: getRandomAge(19, 40) }))
  );
  const [originalHeaders, setOriginalHeaders] = useState(DEFAULT_HEADERS);
  const [currentFileName, setCurrentFileName] = useState('ទិន្នន័យគំរូ');
  const [isRealData, setIsRealData] = useState(false);

  // Filter & Chart Controls
  const [chartLimit, setChartLimit] = useState('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 3200);
  };

  // Load JSZip dynamically for .zip support without extra setup
  useEffect(() => {
    if (!window.JSZip) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Load dataset from URL hash (#data=...) on mount
  useEffect(() => {
    if (window.location.hash && window.location.hash.startsWith('#data=')) {
      const encoded = window.location.hash.substring(6);
      const payload = decodeDatasetFromHash(encoded);
      if (payload && Array.isArray(payload.d) && payload.d.length > 0) {
        const restored = payload.d.map((item) => ({
          name: item[0],
          age: item[1],
          gender: item[2],
          location: item[3],
          rawRow: {
            'ឈ្មោះ': item[0],
            'អាយុ': item[1],
            'ភេទ': item[2],
            'ទីកន្លែងរស់នៅ': item[3]
          }
        }));
        setYouthData(restored);
        setCurrentFileName(payload.f || 'ឯកសារដែលបានចែករំលែក');
        setIsRealData(payload.r === 1);
      }
    }
  }, []);

  // Initialize Firebase Auth (RULE 3)
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Firebase auth error:', err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Sync from Cloud Firestore when authenticated (if no URL hash override)
  useEffect(() => {
    if (!user || !db) return;
    if (window.location.hash && window.location.hash.startsWith('#data=')) return;

    const sharedDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'volunteer_dashboard', 'latest_dataset');
    const unsubscribe = onSnapshot(
      sharedDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && data.youthDataJson) {
            const parsedYouth = JSON.parse(data.youthDataJson);
            const parsedHeaders = data.originalHeadersJson
              ? JSON.parse(data.originalHeadersJson)
              : DEFAULT_HEADERS;
            if (Array.isArray(parsedYouth) && parsedYouth.length > 0) {
              setYouthData(parsedYouth);
              setOriginalHeaders(parsedHeaders);
              setCurrentFileName(data.currentFileName || 'ឯកសារដែលបានផ្ទុក');
              setIsRealData(data.isRealData !== undefined ? data.isRealData : true);
            }
          }
        }
      },
      (error) => {
        console.error('Firestore listener error:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Sync dataset to URL Hash and Cloud
  const syncDataset = async (newData, newHeaders, fileName, realFlag) => {
    try {
      const compactData = newData.map((p) => [p.name, p.age, p.gender, p.location]);
      const encoded = encodeDatasetToHash({
        f: fileName,
        r: realFlag ? 1 : 0,
        d: compactData
      });
      if (encoded && encoded.length < 32000) {
        window.history.replaceState(null, '', '#data=' + encoded);
      }
    } catch (e) {
      console.error('URL sync error:', e);
    }

    if (db && user) {
      try {
        const sharedDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'volunteer_dashboard', 'latest_dataset');
        await setDoc(sharedDocRef, {
          youthDataJson: JSON.stringify(newData),
          originalHeadersJson: JSON.stringify(newHeaders),
          currentFileName: fileName,
          isRealData: realFlag,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error('Cloud save error:', err);
      }
    }
  };

  // Password Form Handler
  const handleUnlock = (e) => {
    e.preventDefault();
    if (passwordInput === REQUIRED_PASSWORD) {
      setLoginError(false);
      setIsUnlocked(true);
    } else {
      setLoginError(true);
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 300);
    }
  };

  // Parse CSV text and extract Name, Age (Random 19-40), Gender, Location (ភូមិ ឃុំ ស្រុក)
  const processCSVText = (csvText, fileName) => {
    const { headers, rows } = parseCSVRows(csvText);
    if (!rows || rows.length === 0) {
      showToast('ឯកសារ CSV មិនមានទិន្នន័យទេ!');
      return;
    }

    const nameKey =
      headers.find((h) => h.includes('ឈ្មោះ') || h.includes('គោត្តនាម') || h.toLowerCase().includes('name')) ||
      headers[1] ||
      headers[0];

    const genderKey = headers.find(
      (h) => h.includes('ភេទ') || h.toLowerCase().includes('gender') || h.toLowerCase().includes('sex')
    );

    const villageKey = headers.find((h) => h.includes('ភូមិ') || h.toLowerCase().includes('village'));
    const communeKey = headers.find(
      (h) => h.includes('ឃុំ') || h.includes('សង្កាត់') || h.toLowerCase().includes('commune')
    );
    const districtKey = headers.find(
      (h) => h.includes('ស្រុក') || h.includes('ខណ្ឌ') || h.includes('ក្រុង') || h.toLowerCase().includes('district')
    );
    const provinceKey = headers.find(
      (h) => h.includes('ខេត្ត') || h.includes('រាជធានី') || h.toLowerCase().includes('province')
    );
    const generalLocKey = headers.find(
      (h) =>
        h.includes('ទីកន្លែង') ||
        h.includes('អាសយដ្ឋាន') ||
        h.includes('រស់នៅ') ||
        h.toLowerCase().includes('address') ||
        h.toLowerCase().includes('location')
    );

    const parsedList = [];
    rows.forEach((row) => {
      const rawName = row[nameKey] ? row[nameKey].toString().trim() : '';
      if (!rawName) return;

      const rawGender = genderKey && row[genderKey] ? normalizeGender(row[genderKey]) : 'មិនបញ្ជាក់';

      const locationParts = [];
      if (villageKey && row[villageKey]) locationParts.push(row[villageKey].toString().trim());
      if (communeKey && row[communeKey]) locationParts.push(row[communeKey].toString().trim());
      if (districtKey && row[districtKey]) locationParts.push(row[districtKey].toString().trim());
      if (provinceKey && row[provinceKey]) locationParts.push(row[provinceKey].toString().trim());

      let fullLocation = '';
      if (locationParts.length > 0) {
        fullLocation = locationParts.filter(Boolean).join(', ');
      } else if (generalLocKey && row[generalLocKey]) {
        fullLocation = row[generalLocKey].toString().trim();
      } else {
        fullLocation = 'សហគមន៍ស្តៅសន្តិភាព';
      }

      parsedList.push({
        name: rawName,
        age: getRandomAge(19, 40),
        gender: rawGender,
        location: fullLocation || 'មិនបញ្ជាក់',
        rawRow: { ...row }
      });
    });

    if (parsedList.length > 0) {
      setYouthData(parsedList);
      setOriginalHeaders(headers);
      setCurrentFileName(fileName);
      setIsRealData(true);
      syncDataset(parsedList, headers, fileName, true);
      showToast(`បានផ្ទុកទិន្នន័យ (${parsedList.length} នាក់) រួចរាល់!`);
    } else {
      showToast("មិនអាចស្វែងរកជួរឈរ 'ឈ្មោះ' ក្នុងឯកសារបានទេ!");
    }
  };

  // File Upload Handler (.csv & .zip)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.zip')) {
      if (!window.JSZip) {
        showToast('កំពុងរៀបចំកម្មវិធីពន្លា ZIP សូមព្យាយាមម្តងទៀត!');
        return;
      }
      try {
        const zip = await window.JSZip.loadAsync(file);
        let csvEntry = null;
        zip.forEach((relativePath, entry) => {
          if (!entry.dir && relativePath.toLowerCase().endsWith('.csv')) {
            csvEntry = entry;
          }
        });
        if (csvEntry) {
          const text = await csvEntry.async('string');
          processCSVText(text, csvEntry.name);
        } else {
          showToast('រកមិនឃើញឯកសារ .csv នៅក្នុង ZIP នេះទេ!');
        }
      } catch (err) {
        console.error(err);
        showToast('មានបញ្ហាក្នុងការពន្លាឯកសារ ZIP!');
      }
    } else if (file.name.toLowerCase().endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        processCSVText(event.target.result, file.name);
      };
      reader.readAsText(file, 'UTF-8');
    } else {
      showToast('សូមជ្រើសរើសឯកសារ .csv ឬ .zip!');
    }
  };

  // Randomize Ages (19-40)
  const handleRandomizeAges = () => {
    const updated = youthData.map((person) => ({
      ...person,
      age: getRandomAge(19, 40)
    }));
    setYouthData(updated);
    if (isRealData) {
      syncDataset(updated, originalHeaders, currentFileName, true);
    }
    showToast('បានប្តូរអាយុ Random ថ្មី (១៩-៤០ ឆ្នាំ) រួចរាល់!');
  };

  // Copy Shareable Link with Embedded URL Hash Data
  const handleCopyShareLink = () => {
    syncDataset(youthData, originalHeaders, currentFileName, isRealData);
    const shareUrl = window.location.href;

    const tempInput = document.createElement('input');
    tempInput.value = shareUrl;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    showToast('បានចម្លង Link ជាប់ទិន្នន័យរួចរាល់! អាចផ្ញើឱ្យគ្រូបើកលើទូរស័ព្ទបានភ្លាម');
  };

  // Reset to Default Sample Data
  const handleResetData = async () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (db && user) {
      try {
        const sharedDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'volunteer_dashboard', 'latest_dataset');
        await deleteDoc(sharedDocRef);
      } catch (e) {
        console.error(e);
      }
    }
    const freshDefault = DEFAULT_YOUTH_DATA.map((p) => ({ ...p, age: getRandomAge(19, 40) }));
    setYouthData(freshDefault);
    setOriginalHeaders(DEFAULT_HEADERS);
    setCurrentFileName('ទិន្នន័យគំរូ');
    setIsRealData(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('បានសម្អាតទិន្នន័យ និងត្រឡប់ទៅទិន្នន័យគំរូដើមវិញ!');
  };

  // Export CSV Preserving All Original Columns (ភូមិ ឃុំ ស្រុក...) + Random Age
  const handleExportCSV = () => {
    const existingAgeHeader = originalHeaders.find(
      (h) => h.includes('អាយុ') || h.toLowerCase().includes('age')
    );
    const exportHeaders = [...originalHeaders];

    if (!existingAgeHeader) {
      const nameIdx = exportHeaders.findIndex(
        (h) => h.includes('ឈ្មោះ') || h.toLowerCase().includes('name')
      );
      if (nameIdx !== -1) {
        exportHeaders.splice(nameIdx + 1, 0, 'អាយុ');
      } else {
        exportHeaders.push('អាយុ');
      }
    }

    const csvRows = [
      exportHeaders.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...youthData.map((person) =>
        exportHeaders
          .map((header) => {
            if (header === 'អាយុ' || header === existingAgeHeader) {
              return person.age;
            }
            const val = person.rawRow && person.rawRow[header] !== undefined ? person.rawRow[header] : '';
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(',')
      )
    ];

    const csvString = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ទិន្នន័យយុវជនស្ម័គ្រចិត្ត_ពេញលេញ.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('បានទាញយកឯកសារ CSV ពេញលេញ (រួមទាំង ភូមិ ឃុំ ស្រុក និងអាយុ)!');
  };

  // Computed KPI Metrics
  const stats = useMemo(() => {
    const total = youthData.length;
    const females = youthData.filter((d) => d.gender === 'ស្រី').length;
    const males = youthData.filter((d) => d.gender === 'ប្រុស').length;
    const avgAge =
      total > 0 ? (youthData.reduce((sum, d) => sum + d.age, 0) / total).toFixed(1) : '0';
    const locationsCount = new Set(youthData.map((d) => d.location)).size;
    return { total, females, males, avgAge, locationsCount };
  }, [youthData]);

  // Computed Primary Chart Data
  const primaryChartData = useMemo(() => {
    if (chartLimit === 'all') return youthData;
    return youthData.slice(0, parseInt(chartLimit, 10));
  }, [youthData, chartLimit]);

  // Computed Secondary Location Chart Data
  const locationChartData = useMemo(() => {
    const counts = {};
    youthData.forEach((d) => {
      counts[d.location] = (counts[d.location] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));
  }, [youthData]);

  // Computed Filtered Table Rows
  const filteredYouthData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return youthData.filter((person) => {
      const matchesSearch =
        person.name.toLowerCase().includes(term) || person.location.toLowerCase().includes(term);
      const matchesGender = genderFilter === 'all' || person.gender === genderFilter;
      return matchesSearch && matchesGender;
    });
  }, [youthData, searchTerm, genderFilter]);

  // --- Password Lock Screen View ---
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Kantumruy+Pro:wght@400;500;600;700&display=swap');
          body { font-family: 'Kantumruy Pro', 'Battambang', sans-serif; }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            75% { transform: translateX(6px); }
          }
          .animate-shake { animation: shake 0.25s ease-in-out; }
        `}</style>

        <div
          className={`bg-white rounded-2xl max-w-sm w-full p-7 shadow-sm border border-slate-200/80 text-center transition-transform ${
            shakeCard ? 'animate-shake' : ''
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">ចូលប្រើប្រាស់ប្រព័ន្ធ</h2>
          <p className="text-slate-500 text-xs mt-1.5">
            ទិន្នន័យយុវជនស្ម័គ្រចិត្ត - វិទ្យាល័យស្តៅសន្តិភាព
          </p>

          <form onSubmit={handleUnlock} className="mt-6 space-y-4 text-left">
            <div>
              <label
                htmlFor="passwordInput"
                className="block text-xs font-medium text-slate-600 mb-1.5"
              >
                ពាក្យសម្ងាត់ (Password)
              </label>
              <div className="relative">
                <input
                  id="passwordInput"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="off"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {loginError && (
                <p className="text-rose-600 text-xs mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>ពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl text-sm transition duration-200"
            >
              បន្តចូលប្រើប្រាស់
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Dashboard View ---
  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-800 flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Kantumruy+Pro:wght@400;500;600;700&display=swap');
        body { font-family: 'Kantumruy Pro', 'Battambang', sans-serif; }
      `}</style>

      {/* Top Sticky Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  វិទ្យាល័យស្តៅសន្តិភាព
                </h1>
                {isRealData ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <CheckCircle2 className="w-3 h-3" />
                    រួចរាល់សម្រាប់ចែករំលែក
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                    ទិន្នន័យគំរូ
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                {isRealData
                  ? `ឯកសារ៖ ${currentFileName} • សរុប ${youthData.length} នាក់ (អាយុ Random ១៩-៤០ ឆ្នាំ)`
                  : 'កម្មវិធីការស្ម័គ្រចិត្តដើម្បីសហគមន៍ខ្ញុំ • ក្រាហ្វសសរ និងអាយុចៃដន្យ (១៩-៤០ ឆ្នាំ)'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium px-3.5 py-2 rounded-xl transition text-xs sm:text-sm">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>ផ្ទុក CSV / ZIP</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.zip"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleRandomizeAges}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-medium px-3.5 py-2 rounded-xl transition text-xs sm:text-sm"
              >
                <Shuffle className="w-3.5 h-3.5 text-slate-500" />
                <span>Random អាយុ</span>
              </button>

              <button
                onClick={handleCopyShareLink}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3.5 py-2 rounded-xl transition text-xs sm:text-sm shadow-sm"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>ចម្លង Link ផ្ញើជូនគ្រូ</span>
              </button>

              <button
                onClick={handleResetData}
                title="សម្អាត និងត្រឡប់ទៅគំរូដើម"
                className="inline-flex items-center justify-center bg-white hover:bg-rose-50 text-rose-600 border border-slate-300 hover:border-rose-200 font-medium p-2.5 rounded-xl transition text-xs sm:text-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-2 rounded-xl transition text-xs sm:text-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ទាញយក CSV</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">អ្នកចូលរួមសរុប</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats.total} នាក់</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">ភេទ (ស្រី / ប្រុស)</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                ស្រី {stats.females} / ប្រុស {stats.males}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">អាយុមធ្យម (19-40)</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats.avgAge} ឆ្នាំ</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-xs">ទីកន្លែងរស់នៅ</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{stats.locationsCount} កន្លែង</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Bar Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Primary Bar Chart: Names & Ages */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  ក្រាហ្វសសរតាំងឈ្មោះ និងអាយុ (១៩-៤០ ឆ្នាំ)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  ចុចឬដាក់ Mouse លើសសរដើម្បីមើល ឈ្មោះ អាយុ ភេទ និងទីកន្លែងរស់នៅ
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> ស្រី
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> ប្រុស
                  </span>
                </div>
                <select
                  value={chartLimit}
                  onChange={(e) => setChartLimit(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-slate-400"
                >
                  <option value="15">១៥ នាក់ដំបូង</option>
                  <option value="30">៣០ នាក់ដំបូង</option>
                  <option value="50">៥០ នាក់ដំបូង</option>
                  <option value="all">ទាំងអស់</option>
                </select>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <div
                style={{
                  minWidth: primaryChartData.length > 22 ? `${primaryChartData.length * 38}px` : '100%',
                  height: '330px'
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={primaryChartData}
                    margin={{ top: 10, right: 12, left: -16, bottom: 52 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-32}
                      textAnchor="end"
                      tick={{ fontSize: 11, fill: '#475569' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 45]}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomAgeTooltip />} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="age" radius={[6, 6, 0, 0]} maxBarSize={32}>
                      {primaryChartData.map((entry, idx) => {
                        let fill = '#64748b';
                        if (entry.gender === 'ស្រី') fill = '#f43f5e';
                        else if (entry.gender === 'ប្រុស') fill = '#3b82f6';
                        return <Cell key={`cell-${idx}`} fill={fill} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Secondary Bar Chart: Location Summary */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900">ទីកន្លែងរស់នៅ</h2>
              <p className="text-xs text-slate-400 mt-0.5">ចំនួនយុវជនតាមភូមិ/ឃុំ/ស្រុក</p>
            </div>
            <div className="w-full h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={locationChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 16, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="location"
                    width={110}
                    tick={{ fontSize: 10, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomLocationTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#0f172a" radius={[0, 5, 5, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Data Table Section */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">បញ្ជីទិន្នន័យយុវជន</h2>
              <p className="text-xs text-slate-400 mt-0.5">ឈ្មោះ • អាយុ • ភេទ • ទីកន្លែងរស់នៅ</p>
            </div>

            {/* Search & Gender Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ស្វែងរកឈ្មោះ ឬទីកន្លែង..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-slate-400 w-44 sm:w-56"
                />
              </div>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-slate-400"
              >
                <option value="all">ភេទទាំងអស់</option>
                <option value="ស្រី">ស្រី</option>
                <option value="ប្រុស">ប្រុស</option>
              </select>
            </div>
          </div>

          {/* Responsive Table */}
          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 w-14 text-center">
                    ល.រ
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500">ឈ្មោះ</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">
                    អាយុ (19-40)
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 text-center">ភេទ</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500">ទីកន្លែងរស់នៅ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredYouthData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      មិនមានទិន្នន័យដែលត្រូវនឹងការស្វែងរកទេ
                    </td>
                  </tr>
                ) : (
                  filteredYouthData.map((person, index) => (
                    <tr key={`${person.name}-${index}`} className="hover:bg-slate-50/90 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-500 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{person.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                          {person.age} ឆ្នាំ
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {person.gender === 'ស្រី' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
                            ♀ ស្រី
                          </span>
                        ) : person.gender === 'ប្រុស' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            ♂ ប្រុស
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {person.gender}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{person.location}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="bg-slate-50/60 px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>
              បង្ហាញ {filteredYouthData.length} ក្នុងចំណោម {youthData.length} នាក់
            </span>
            <span>ទាញយក CSV រក្សាទុកគ្រប់ជួរឈរដើម</span>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-5 right-5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2.5 transition-all duration-300 z-50 ${
          toastVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}