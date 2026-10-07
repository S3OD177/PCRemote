// Tiny built-in localization. The app ships Arabic and English; the device
// language picks one, and everything (including layout direction) follows.
import { getLocales } from 'expo-localization';

export type Lang = 'ar' | 'en';

const STRINGS = {
  ar: {
    appName: 'ريموت الكمبيوتر',
    tagline: 'تحكّم بكمبيوترك من جوالك',

    // connection
    connecting: 'جاري الاتصال…',
    connected: 'متصل',
    offline: 'غير متصل',
    offlineHint: 'تأكد إن الكمبيوتر شغّال وعلى نفس الواي فاي',
    moment: 'لحظات',

    // actions
    shutdown: 'إيقاف التشغيل',
    shutdownSub: 'يطفيه بالكامل',
    sleep: 'وضع السكون',
    sleepSub: 'ينوّمه ويرجع بسرعة',
    lock: 'قفل الشاشة',
    lockSub: 'يقفلها ويحميها برمز',
    wake: 'تشغيل الجهاز',
    wakeSub: 'يوقظه وهو نايم',

    // confirm sheet
    confirmShutdown: 'تطفي الكمبيوتر؟',
    confirmShutdownBody: 'بيتقفل كل شي مفتوح، وأي شغل مو محفوظ بيضيع.',
    confirmSleep: 'تنوّم الكمبيوتر؟',
    confirmSleepBody: 'تقدر تصحّيه بعدين بحركة الماوس أو ضغطة زر.',
    confirmLock: 'تقفل الشاشة؟',
    confirmLockBody: 'بتحتاج كلمة السر عشان ترجع تستخدمه.',
    yesShutdown: 'إيه، طفّه',
    yesSleep: 'إيه، نوّمه',
    yesLock: 'إيه، اقفلها',
    cancel: 'إلغاء',

    // results
    sentShutdown: 'تم ✓ الكمبيوتر بيطفي الحين',
    sentSleep: 'تم ✓ الكمبيوتر بينام الحين',
    sentLock: 'تم ✓ الشاشة اتقفلت',
    sentWake: 'تم ✓ أرسلنا إشارة التشغيل',
    busyShutdown: 'جاري الإيقاف…',
    busySleep: 'جاري التنويم…',
    busyLock: 'جاري القفل…',
    busyWake: 'جاري الإرسال…',
    failSend: 'ما وصل الأمر — تأكد إن الكمبيوتر شغّال',
    failBusy: 'لحظة، الأمر السابق قيد التنفيذ',
    notConnected: 'الكمبيوتر غير متصل الحين',

    // pairing
    addPC: 'أضف كمبيوتر',
    getAppTitle: 'أول شي: برنامج الكمبيوتر',
    getAppBody: 'عشان تتحكم بكمبيوترك، لازم تثبّت برنامج PC Remote المجاني على ويندوز.',
    getAppUrlLabel: 'على كمبيوترك، افتح هذا الرابط وحمّله:',
    haveItScan: 'ثبّته؟ امسح رمز الربط',
    pairTitle: 'امسح رمز الربط',
    pairHint: 'افتح برنامج PC Remote على الكمبيوتر، واضغط «Pair iPhone»، ثم وجّه الكاميرا للرمز',
    cameraNeeded: 'نحتاج إذن الكاميرا',
    cameraNeededBody: 'عشان نمسح رمز الربط الظاهر على الكمبيوتر.',
    grantCamera: 'السماح للكاميرا',
    openSettings: 'افتح الإعدادات',
    paired: 'تم الربط ✓',
    pairedBody: 'كمبيوترك جاهز. ترجع للتحكم فيه بأي وقت.',
    pairBadQR: 'هذا مو رمز ربط صحيح. امسح الرمز الظاهر في برنامج الكمبيوتر.',

    // devices / settings
    myPCs: 'أجهزتي',
    noPCs: 'ما فيه أجهزة بعد',
    noPCsBody: 'اربط كمبيوترك عشان تبدأ',
    remove: 'حذف',
    removePC: 'تحذف هذا الكمبيوتر؟',
    removePCBody: 'بيتشال من التطبيق. تقدر تربطه مرة ثانية بعدين.',
    rename: 'إعادة تسمية',
    done: 'تم',
    settings: 'الإعدادات',
    about: 'عن التطبيق',
    language: 'اللغة',

    retry: 'إعادة المحاولة',
  },

  en: {
    appName: 'PC Remote',
    tagline: 'Control your PC from your phone',

    connecting: 'Connecting…',
    connected: 'Connected',
    offline: 'Offline',
    offlineHint: 'Make sure the PC is on and on the same Wi-Fi',
    moment: 'A moment…',

    shutdown: 'Shut down',
    shutdownSub: 'Turns the PC fully off',
    sleep: 'Sleep',
    sleepSub: 'Sleeps it; wakes fast',
    lock: 'Lock screen',
    lockSub: 'Locks it behind your password',
    wake: 'Wake PC',
    wakeSub: 'Wakes it while asleep',

    confirmShutdown: 'Shut down the PC?',
    confirmShutdownBody: 'Open apps will close, and any unsaved work is lost.',
    confirmSleep: 'Put the PC to sleep?',
    confirmSleepBody: 'Wake it later with a mouse move or a key press.',
    confirmLock: 'Lock the screen?',
    confirmLockBody: "You'll need your password to get back in.",
    yesShutdown: 'Shut down',
    yesSleep: 'Sleep',
    yesLock: 'Lock',
    cancel: 'Cancel',

    sentShutdown: 'Done ✓ the PC is shutting down',
    sentSleep: 'Done ✓ the PC is going to sleep',
    sentLock: 'Done ✓ the screen is locked',
    sentWake: 'Done ✓ wake signal sent',
    busyShutdown: 'Shutting down…',
    busySleep: 'Sleeping…',
    busyLock: 'Locking…',
    busyWake: 'Sending…',
    failSend: "Command didn't go through — check the PC is on",
    failBusy: 'One moment — the last command is still running',
    notConnected: 'The PC is offline right now',

    addPC: 'Add a PC',
    getAppTitle: 'First, get the PC app',
    getAppBody: 'To control your PC, install the free PC Remote app on your Windows computer.',
    getAppUrlLabel: 'On your computer, open this link and download it:',
    haveItScan: 'Installed it? Scan the code',
    pairTitle: 'Scan the pairing code',
    pairHint: 'Open PC Remote on your computer, click “Pair iPhone”, then point the camera at the code',
    cameraNeeded: 'Camera access needed',
    cameraNeededBody: 'To scan the pairing code shown on your computer.',
    grantCamera: 'Allow camera',
    openSettings: 'Open Settings',
    paired: 'Paired ✓',
    pairedBody: 'Your PC is ready. Come back to control it any time.',
    pairBadQR: "That isn't a pairing code. Scan the code shown in the PC app.",

    myPCs: 'My PCs',
    noPCs: 'No PCs yet',
    noPCsBody: 'Pair your computer to get started',
    remove: 'Remove',
    removePC: 'Remove this PC?',
    removePCBody: 'It will be removed from the app. You can pair it again later.',
    rename: 'Rename',
    done: 'Done',
    settings: 'Settings',
    about: 'About',
    language: 'Language',

    retry: 'Try again',
  },
} as const;

export type StringKey = keyof (typeof STRINGS)['en'];

export const lang: Lang = pickLang();
export const isRTL = lang === 'ar';

function pickLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode?.toLowerCase();
    return code === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

export function t(key: StringKey): string {
  return STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
}
