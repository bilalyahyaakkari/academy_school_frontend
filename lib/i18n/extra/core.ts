/**
 * Extra translation strings for the "core" area. Merged into `dict` in
 * ../index.ts. Add every key to BOTH en and ar.
 */
export const coreStrings = {
  en: {
    // Nav
    "nav.trials": "Trials",
    // App shell
    "shell.sidebar.expand": "Expand sidebar",
    "shell.sidebar.collapse": "Collapse sidebar",
    "shell.menu.open": "Open menu",
    "shell.menu.close": "Close menu",
    "shell.menu.title": "Navigation",
    "shell.menu.desc": "Main navigation menu",
    "shell.locale.change": "Change language",
    "shell.locale.failed": "Couldn't change the language. Try again.",
    // UI primitives
    "ui.close": "Close",
    // Route error boundary
    "error.title": "Something went wrong",
    "error.desc": "The server may be waking up after being idle — that can take up to 30 seconds. Try again in a moment.",
    "error.desc.session": "If it keeps happening, your session may have expired — sign in again.",
    "error.retry": "Try again",
    "error.signInAgain": "Sign in again",
    "error.details": "Technical details",
    // Login
    "login.metaTitle": "Sign in — Academy",
    "login.title": "Sign in",
    "login.subtitle": "Welcome back. Enter your admin credentials below.",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Sign in",
    "login.help": "Need help? Contact your academy admin.",
    "login.toast.welcome": "Welcome back",
    "login.expired": "Your session expired. Please sign in again.",
    "login.error.invalid": "Invalid email or password",
    "login.error.backend": "Can't reach the server — your login is probably fine. Check that the backend and database are up, then try again.",
    "login.error.generic": "Could not sign in. Please try again.",
    "login.hero.title": "Run your academy without the spreadsheets.",
    "login.hero.sub": "Students, groups, payments, uniforms — every detail in a single, sharp dashboard.",
    "login.feature.students.title": "Student management",
    "login.feature.students.desc": "Profiles, groups, schedules — all in one place.",
    "login.feature.payments.title": "Payments tracking",
    "login.feature.payments.desc": "Auto-generated invoices, partial payments, reminders.",
    "login.feature.uniforms.title": "Uniforms & extras",
    "login.feature.uniforms.desc": "Track every order and what's still owed.",
    "login.trust": "Secure admin access · JWT-protected sessions",
  },
  ar: {
    // Nav
    "nav.trials": "الحصص التجريبية",
    // App shell
    "shell.sidebar.expand": "كبّر القائمة",
    "shell.sidebar.collapse": "صغّر القائمة",
    "shell.menu.open": "افتح القائمة",
    "shell.menu.close": "سكّر القائمة",
    "shell.menu.title": "التنقّل",
    "shell.menu.desc": "قائمة التنقّل الرئيسية",
    "shell.locale.change": "غيّر اللغة",
    "shell.locale.failed": "ما زبط تغيير اللغة. جرّب مرة تانية.",
    // UI primitives
    "ui.close": "سكّر",
    // Route error boundary
    "error.title": "صار في مشكلة",
    "error.desc": "يمكن السيرفر عم يفيق بعد ما كان واقف — هالشي بياخد لحد 30 ثانية. جرّب كمان شوي.",
    "error.desc.session": "إذا ضلّت تصير، يمكن الجلسة خلصت — سجّل دخول من جديد.",
    "error.retry": "جرّب مرة تانية",
    "error.signInAgain": "سجّل دخول من جديد",
    "error.details": "تفاصيل تقنية",
    // Login
    "login.metaTitle": "تسجيل الدخول — الأكاديمية",
    "login.title": "تسجيل الدخول",
    "login.subtitle": "أهلا فيك من جديد. حطّ معلومات حساب المدير تحت.",
    "login.email": "الإيميل",
    "login.password": "كلمة السر",
    "login.submit": "فوت",
    "login.help": "بدك مساعدة؟ تواصل مع مدير الأكاديمية.",
    "login.toast.welcome": "أهلا وسهلا فيك",
    "login.expired": "خلصت الجلسة. سجّل دخول مرة تانية.",
    "login.error.invalid": "الإيميل أو كلمة السر غلط",
    "login.error.backend": "ما عم نقدر نوصل للسيرفر — غالباً معلوماتك صح. تأكّد إنو السيرفر وقاعدة البيانات شغّالين، وبعدين جرّب مرة تانية.",
    "login.error.generic": "ما زبط تسجيل الدخول. جرّب مرة تانية.",
    "login.hero.title": "دير الأكاديمية بلا جداول إكسل.",
    "login.hero.sub": "الطلاب، المجموعات، المدفوعات، الأزياء — كل التفاصيل بلوحة وحدة مرتّبة.",
    "login.feature.students.title": "إدارة الطلاب",
    "login.feature.students.desc": "الملفات، المجموعات، والمواعيد — كلّن بمحل واحد.",
    "login.feature.payments.title": "متابعة المدفوعات",
    "login.feature.payments.desc": "فواتير بتنعمل لحالها، دفعات جزئية، وتذكيرات.",
    "login.feature.uniforms.title": "الأزياء والإضافات",
    "login.feature.uniforms.desc": "تابع كل طلب وشو بعد باقي عليه.",
    "login.trust": "دخول آمن للمدير · جلسات محمية بـ JWT",
  },
} as const;
