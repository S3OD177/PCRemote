PC Remote — Windows helper
ريموت الكمبيوتر — برنامج ويندوز
================================================================

العربية
--------
هذا هو البرنامج اللي يشتغل على كمبيوتر ويندوز، ويخلّي تطبيق الآيفون
يتحكم فيه (إيقاف، سكون، قفل، تشغيل).

التشغيل:
  • افتح ملف  PCRemote.exe  بضغطتين.
  • أول مرة، ويندوز أو مكافح الفيروسات قد ينبّهك لأن الملف غير موقّع
    بشهادة. اختر "مزيد من المعلومات" ثم "تشغيل على أي حال"
    (More info → Run anyway). لتفادي هذا نهائيًا لازم توقّع الملف
    بشهادة (مشروح في الدليل).
  • بيظهر البرنامج كأيقونة صغيرة جنب الساعة (قد تحتاج تضغط السهم ^).
  • كليك يمين على الأيقونة:
        Pair iPhone…         → يعرض رمز QR تمسحه بالتطبيق
        Start with Windows   → يشغّله تلقائيًا مع ويندوز (مستحسن)
        Unpair all devices   → يلغي ربط كل الأجهزة
        Open log folder      → يفتح مجلد السجل والإعدادات
        Quit                 → إيقاف البرنامج

الأمان:
  • رمز الـ QR يحتوي مفتاحًا سريًا يبقى داخل شبكتك ولا يخرج للإنترنت.
  • كل أمر موقّع بهذا المفتاح، فما يقدر أي تطبيق أو موقع ثاني يتحكم بجهازك.

الإعدادات والسجل تنحفظ في:
  %APPDATA%\PCRemote\

English
-------
This is the companion service for Windows. It lets the PC Remote iPhone
app shut down, sleep, lock, and wake this computer.

To run:
  • Double-click  PCRemote.exe
  • First time, Windows SmartScreen may warn because the file isn't
    code-signed. Click "More info" → "Run anyway". To remove the warning
    permanently, sign the .exe with a certificate (see the guide).
  • It appears as a small icon near the clock (click ^ to reveal it).
  • Right-click the icon for: Pair iPhone, Start with Windows,
    Unpair all devices, Open log folder, Quit.

Settings and logs are stored in:  %APPDATA%\PCRemote\

--------
To rebuild from source (needs Go 1.24+):
    cd source
    go build -ldflags "-H windowsgui -s -w" -o ../PCRemote.exe .
