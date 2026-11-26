/**
 * Extra translation strings for the "payments" area. Merged into `dict` in
 * ../index.ts. Add every key to BOTH en and ar.
 *
 * Also holds the strings for the other month-scoped screens owned alongside it
 * (roster, attendance, dashboard, settings).
 */
export const paymentsStrings = {
  en: {
    // Shared labels
    "payments.method.CASH": "Cash",
    "payments.method.BANK_TRANSFER": "Bank transfer",
    "payments.method.OTHER": "Other",
    "payments.field.method": "Payment method",
    "payments.field.notes": "Notes",
    "payments.table.method": "Method",
    "payments.back": "Back to payments",
    "payments.descMonth": "{month} · {count} students",
    "payments.descMonth.one": "{month} · 1 student",

    // Month picker
    "payments.monthPicker.prev": "Previous month",
    "payments.monthPicker.next": "Next month",
    "payments.monthPicker.month": "Month",
    "payments.monthPicker.year": "Year",

    // Generate invoices
    "payments.generate.toast.created": "Created {count} invoices",
    "payments.generate.toast.created.one": "Created 1 invoice",
    "payments.generate.toast.none": "No invoices created — everyone in this month already has one.",

    // Record payment dialog
    "payments.add.amount": "Payment amount *",
    "payments.add.submit": "Record {amount}",
    "payments.add.notesHint": "This is the invoice's note — edit it or add to it.",

    // Edit payment dialog
    "payments.edit.title": "Edit payment",
    "payments.edit.paidAmount": "Paid amount (more than 0, less than {total})",
    "payments.edit.partialHint": "If the whole amount was paid, choose Paid. If nothing was paid, choose Unpaid.",
    "payments.edit.toast.saved": "Payment updated",
    "payments.validation.partialRange":
      "A partial payment must be more than 0 and less than the total ({total}).",

    // Undo
    "payments.undo.title": "Undo {name}'s payment?",
    "payments.undo.desc":
      "This erases {amount} recorded on this invoice and sets it back to unpaid. This can't be undone.",
    "payments.undo.descZero": "This sets the invoice back to unpaid. No money is recorded on it.",
    "payments.undo.confirm": "Erase {amount}",
    "payments.undo.confirmZero": "Set to unpaid",
    "payments.undo.toast": "Reset to unpaid",

    // Timeline
    "payments.timeline.partial": "paid {paid} · {due} due",

    // History page
    "payments.history.title": "Payment history",
    "payments.history.desc": "{count} records",
    "payments.history.desc.one": "1 record",
    "payments.history.truncated":
      "Showing the latest {shown} of {total} records. Narrow the dates to see the rest.",
    "payments.history.empty": "No payments yet.",

    // Outstanding page
    "payments.outstanding.title": "Outstanding payments",
    "payments.outstanding.desc": "Students with at least one unpaid invoice — across all months.",
    "payments.outstanding.totalOwed": "Total owed",
    "payments.outstanding.students": "Students with balance",
    "payments.outstanding.empty.title": "Nothing outstanding",
    "payments.outstanding.empty.sub": "All invoices are paid.",
    "payments.outstanding.monthsUnpaid": "Months unpaid",
    "payments.outstanding.oldest": "Oldest unpaid",
    "payments.outstanding.oldestShort": "oldest: {month}",
    "payments.outstanding.remind": "Remind",
    "payments.outstanding.noPhone": "no phone",

    // Action errors
    "payments.error.generic": "Something went wrong",
    "payments.error.positiveAmount": "Enter a positive amount",
    "payments.error.generate": "Failed to generate invoices",
    "payments.error.record": "Failed to record payment",
    "payments.error.update": "Failed to update payment",
    "payments.error.roster.fill": "Failed to fill this month",
    "payments.error.roster.noneSelected": "No students selected",
    "payments.error.roster.add": "Failed to add students",
    "payments.error.roster.remove": "Failed to remove student",
    "payments.error.roster.update": "Failed to update student",
    "payments.error.attendance.open": "Failed to open the checklist",
    "payments.error.attendance.save": "Failed to save attendance",
    "payments.error.attendance.delete": "Failed to delete the checklist",
    "payments.error.settings.passwordLength": "New password must be at least 6 characters",
    "payments.error.settings.passwordMismatch": "Passwords don't match",
    "payments.error.settings.password": "Failed to change password",

    // Roster
    "payments.roster.remove.label": "Remove from {month} (and later months, until re-added)",
    "payments.roster.left.label": "Left the academy (from {month} on)",
    "payments.roster.remove.desc":
      "{name} is taken off {month}, and that month's invoice is deleted unless money was already recorded on it. Each new month starts from the one before, so they won't be carried into later months either — until you add them back. They are not marked as left, earlier months keep them, and months that are already filled in don't change.",
    "payments.roster.added.names": "Added {names} to {month}",
    "payments.roster.added.partial": "Added {added} of {selected} — the rest were already in {month}",
    "payments.roster.added.none": "Everyone you picked is already in {month}",
    "payments.roster.restored": "{count} returning students are no longer marked as left",
    "payments.roster.carry.nothing":
      "Nothing to carry over — no earlier month has students who are still with the academy. Add students instead.",
    "payments.roster.carry.alreadyFilled": "Everyone is already in — this month already has its students.",

    // Attendance
    "payments.attendance.unsavedWarning": "You have unsaved attendance. Leave without saving?",

    // Dashboard / settings
    "payments.stat.students": "Students",
    "payments.stat.students.sub": "Not counting students who left",
    "payments.settings.payments": "Payments {year}",
    "payments.settings.payments.sub": "Invoices with money received",

    // Settings: security + WhatsApp
    "payments.settings.showPassword": "Show password",
    "payments.settings.hidePassword": "Hide password",
    "payments.whatsapp.ph.month": "Arabic month name (all owed months)",
    "payments.whatsapp.ph.year": "4-digit year",
    "payments.whatsapp.ph.amount": "Amount owed",
    "payments.whatsapp.ph.student": "Student name",
    "payments.whatsapp.ph.academy": "Academy name",

    // WhatsApp receipt
    "payments.receipt.send": "Send receipt",
    "payments.receipt.sendWhatsApp": "Send receipt on WhatsApp",
    "payments.receipt.recorded": "Payment recorded",
    "payments.receipt.offer": "Send the parent a receipt on WhatsApp?",
    "payments.receipt.open": "Open WhatsApp",
    "payments.receipt.noPhone": "{name} has no phone number — add one on their profile to send receipts.",
    "payments.receipt.nothingPaid": "Nothing has been paid yet, so there's no receipt to send.",
    "payments.receipt.received": "Received {amount}",
    "payments.receipt.remaining": "{amount} left",
    "payments.receipt.fullyPaid": "Fully paid",
    "payments.receipt.done": "Done",
    "payments.receipt.error": "Couldn't load the receipt",
    "payments.receipt.preview": "Message",
    "payments.receipt.ph.amount": "Amount just received",
    "payments.receipt.ph.item": "What it was for (month fee or uniform)",
    "payments.receipt.ph.remaining": "What's left — or \"fully paid\"",
    "payments.receipt.ph.date": "Day the money was received",

    // Sibling discount on an invoice
    "payments.discount.note": "−{amount} sibling discount",

    // Daily cash report
    "payments.daily.title": "Daily cash",
    "payments.daily.link": "Today's cash",
    "payments.daily.total": "Total received",
    "payments.daily.count": "{count} transactions",
    "payments.daily.count.one": "1 transaction",
    "payments.daily.footer": "Monthly fees {fees} · Uniforms {uniforms}",
    "payments.daily.prev": "Previous day",
    "payments.daily.next": "Next day",
    "payments.daily.today": "Today",
    "payments.daily.date": "Date",
    "payments.daily.col.time": "Time",
    "payments.daily.col.what": "For",
    "payments.daily.fee": "{month} fee",
    "payments.daily.uniform": "Uniform ({size})",
    "payments.daily.uniformNoSize": "Uniform",
    "payments.daily.correction": "Correction",
    "payments.daily.empty.title": "Nothing came in on {date}",
    "payments.daily.empty.sub": "Money recorded on this day shows up here.",

    // Outstanding: families
    "payments.family.label": "Family · {count} children",
    "payments.family.total": "Family total",

    // Settings: receipt template
    "payments.settings.receipt.title": "WhatsApp Receipt Template",
    "payments.settings.receipt.desc": "The message parents get when you send a receipt after a payment.",
    "payments.settings.receipt.sampleNote": "Sample · {item} · {amount} · {student}",
    "payments.settings.receipt.toast.saved": "Receipt template saved",

    // Settings: sibling discount
    "payments.settings.discount.title": "Sibling discount",
    "payments.settings.discount.desc": "A discount on monthly fees for families with more than one child.",
    "payments.settings.discount.type": "Discount type",
    "payments.settings.discount.NONE": "None",
    "payments.settings.discount.PERCENT": "Percentage",
    "payments.settings.discount.FIXED": "Fixed amount",
    "payments.settings.discount.value": "Value",
    "payments.settings.discount.help":
      "Applies to the 2nd child onwards in a family; the child with the highest fee pays in full. Updates unpaid invoices from this month on.",
    "payments.settings.discount.example": "Example: a {fee} fee becomes {amount} for the 2nd child.",
    "payments.settings.discount.submit": "Save discount",
    "payments.settings.discount.toast.saved": "Sibling discount saved",
    "payments.settings.discount.err.percent": "A percentage can't be more than 100.",
    "payments.settings.discount.err.value": "Enter a value of 0 or more.",
  },
  ar: {
    // Shared labels
    "payments.method.CASH": "كاش",
    "payments.method.BANK_TRANSFER": "تحويل بنكي",
    "payments.method.OTHER": "غير شي",
    "payments.field.method": "طريقة الدفع",
    "payments.field.notes": "ملاحظات",
    "payments.table.method": "الطريقة",
    "payments.back": "رجوع عالمدفوعات",
    "payments.descMonth": "{month} · {count} تلميذ",
    "payments.descMonth.one": "{month} · تلميذ واحد",

    // Month picker
    "payments.monthPicker.prev": "الشهر اللي قبل",
    "payments.monthPicker.next": "الشهر اللي بعد",
    "payments.monthPicker.month": "الشهر",
    "payments.monthPicker.year": "السنة",

    // Generate invoices
    "payments.generate.toast.created": "انعملت {count} فواتير",
    "payments.generate.toast.created.one": "انعملت فاتورة وحدة",
    "payments.generate.toast.none": "ما انعملت ولا فاتورة — كل تلاميذ هالشهر عندن فاتورة.",

    // Record payment dialog
    "payments.add.amount": "قيمة الدفعة *",
    "payments.add.submit": "سجّل {amount}",
    "payments.add.notesHint": "هيدي ملاحظة الفاتورة — عدّلها أو زيد عليها.",

    // Edit payment dialog
    "payments.edit.title": "تعديل الدفعة",
    "payments.edit.paidAmount": "المبلغ المدفوع (أكتر من 0 وأقل من {total})",
    "payments.edit.partialHint": "إذا دفع المبلغ كلّو، اختار مدفوع. وإذا ما دفع شي، اختار غير مدفوع.",
    "payments.edit.toast.saved": "انعدّلت الدفعة",
    "payments.validation.partialRange":
      "الدفعة الجزئية لازم تكون أكتر من 0 وأقل من المجموع ({total}).",

    // Undo
    "payments.undo.title": "تلغي دفعة {name}؟",
    "payments.undo.desc":
      "رح ينمسح {amount} مسجّلين على هالفاتورة وترجع غير مدفوعة. ما في رجعة.",
    "payments.undo.descZero": "الفاتورة رح ترجع غير مدفوعة. ما في مصاري مسجّلة عليها.",
    "payments.undo.confirm": "امسح {amount}",
    "payments.undo.confirmZero": "رجّعها غير مدفوعة",
    "payments.undo.toast": "رجعت غير مدفوعة",

    // Timeline
    "payments.timeline.partial": "دفع {paid} · باقي {due}",

    // History page
    "payments.history.title": "سجل المدفوعات",
    "payments.history.desc": "{count} سجل",
    "payments.history.desc.one": "سجل واحد",
    "payments.history.truncated":
      "عم نعرض آخر {shown} من أصل {total} سجل. ضيّق التواريخ لتشوف الباقي.",
    "payments.history.empty": "ما في دفعات بعد.",

    // Outstanding page
    "payments.outstanding.title": "الدفعات المتأخّرة",
    "payments.outstanding.desc": "التلاميذ اللي عليهن فاتورة غير مدفوعة أو أكتر — بكل الأشهر.",
    "payments.outstanding.totalOwed": "مجموع المستحق",
    "payments.outstanding.students": "تلاميذ عليهن مصاري",
    "payments.outstanding.empty.title": "ما في شي متأخّر",
    "payments.outstanding.empty.sub": "كل الفواتير مدفوعة.",
    "payments.outstanding.monthsUnpaid": "أشهر غير مدفوعة",
    "payments.outstanding.oldest": "أقدم شهر غير مدفوع",
    "payments.outstanding.oldestShort": "الأقدم: {month}",
    "payments.outstanding.remind": "ذكّر",
    "payments.outstanding.noPhone": "ما في رقم",

    // Action errors
    "payments.error.generic": "صار في مشكلة",
    "payments.error.positiveAmount": "حط مبلغ أكبر من صفر",
    "payments.error.generate": "ما زبط إنشاء الفواتير",
    "payments.error.record": "ما زبط تسجيل الدفعة",
    "payments.error.update": "ما زبط تعديل الدفعة",
    "payments.error.roster.fill": "ما زبط تعبئة هالشهر",
    "payments.error.roster.noneSelected": "ما اخترت ولا تلميذ",
    "payments.error.roster.add": "ما زبطت إضافة التلاميذ",
    "payments.error.roster.remove": "ما زبط شيل التلميذ",
    "payments.error.roster.update": "ما زبط تعديل التلميذ",
    "payments.error.attendance.open": "ما زبط فتح اللائحة",
    "payments.error.attendance.save": "ما زبط حفظ الحضور",
    "payments.error.attendance.delete": "ما زبط حذف اللائحة",
    "payments.error.settings.passwordLength": "كلمة المرور الجديدة لازم تكون 6 خانات على الأقل",
    "payments.error.settings.passwordMismatch": "كلمتين المرور مش متطابقين",
    "payments.error.settings.password": "ما زبط تغيير كلمة المرور",

    // Roster
    "payments.roster.remove.label": "شيلو من {month} (ومن الأشهر الجاية لحتى ترجع تضيفو)",
    "payments.roster.left.label": "ترك الأكاديمية (من {month} وطالع)",
    "payments.roster.remove.desc":
      "{name} رح ينشال من {month}، وفاتورة هالشهر بتنمسح إلا إذا كان مدفوع عليها مصاري. كل شهر جديد بيبلّش من الشهر اللي قبلو، فما رح ينتقل عالأشهر الجاية كمان — لحتى ترجع تضيفو. ما رح يتسجّل إنو ترك، والأشهر اللي قبل بتضل متل ما هيي، والأشهر اللي تعبّت من قبل ما بتتغيّر.",
    "payments.roster.added.names": "تمت إضافة {names} على {month}",
    "payments.roster.added.partial": "تمت إضافة {added} من {selected} — الباقيين كانوا موجودين بـ {month}",
    "payments.roster.added.none": "كل اللي اخترتن موجودين أصلاً بـ {month}",
    "payments.roster.restored": "{count} تلميذ راجع ما عادوا مسجّلين إنن تركوا",
    "payments.roster.carry.nothing":
      "ما في شي ننقلو — ما في شهر قبل فيه تلاميذ بعدن بالأكاديمية. ضيف التلاميذ بإيدك.",
    "payments.roster.carry.alreadyFilled": "كلّن موجودين — هالشهر فيه تلاميذو من قبل.",

    // Attendance
    "payments.attendance.unsavedWarning": "في حضور ما انحفظ. بدك تطلع بلا حفظ؟",

    // Dashboard / settings
    "payments.stat.students": "التلاميذ",
    "payments.stat.students.sub": "بدون اللي تركوا",
    "payments.settings.payments": "دفعات {year}",
    "payments.settings.payments.sub": "فواتير انقبض عليها مصاري",

    // Settings: security + WhatsApp
    "payments.settings.showPassword": "فرجيني كلمة المرور",
    "payments.settings.hidePassword": "خبّي كلمة المرور",
    "payments.whatsapp.ph.month": "اسم الشهر (كل الأشهر المستحقة)",
    "payments.whatsapp.ph.year": "السنة (4 أرقام)",
    "payments.whatsapp.ph.amount": "المبلغ المستحق",
    "payments.whatsapp.ph.student": "اسم التلميذ",
    "payments.whatsapp.ph.academy": "اسم الأكاديمية",

    // WhatsApp receipt
    "payments.receipt.send": "ابعت إيصال",
    "payments.receipt.sendWhatsApp": "ابعت الإيصال عالواتساب",
    "payments.receipt.recorded": "انسجّلت الدفعة",
    "payments.receipt.offer": "بتحب تبعت إيصال للأهل عالواتساب؟",
    "payments.receipt.open": "افتح واتساب",
    "payments.receipt.noPhone": "ما في رقم تلفون لـ {name} — ضيف رقم على صفحتو لتقدر تبعت إيصالات.",
    "payments.receipt.nothingPaid": "ما في شي مدفوع بعد، فما في إيصال لينبعت.",
    "payments.receipt.received": "وصل {amount}",
    "payments.receipt.remaining": "باقي {amount}",
    "payments.receipt.fullyPaid": "مدفوع بالكامل",
    "payments.receipt.done": "تمام",
    "payments.receipt.error": "ما زبط جيب الإيصال",
    "payments.receipt.preview": "الرسالة",
    "payments.receipt.ph.amount": "المبلغ اللي وصل هلّق",
    "payments.receipt.ph.item": "عن شو (اشتراك الشهر أو الزيّ)",
    "payments.receipt.ph.remaining": "شو باقي — أو \"مدفوع بالكامل\"",
    "payments.receipt.ph.date": "نهار ما وصلت المصاري",

    // Sibling discount on an invoice
    "payments.discount.note": "−{amount} حسم إخوة",

    // Daily cash report
    "payments.daily.title": "صندوق اليوم",
    "payments.daily.link": "مقبوضات اليوم",
    "payments.daily.total": "مجموع المقبوض",
    "payments.daily.count": "{count} عملية",
    "payments.daily.count.one": "عملية وحدة",
    "payments.daily.footer": "اشتراكات شهرية {fees} · أزياء {uniforms}",
    "payments.daily.prev": "اليوم اللي قبل",
    "payments.daily.next": "اليوم اللي بعد",
    "payments.daily.today": "اليوم",
    "payments.daily.date": "التاريخ",
    "payments.daily.col.time": "الوقت",
    "payments.daily.col.what": "عن شو",
    "payments.daily.fee": "اشتراك {month}",
    "payments.daily.uniform": "زيّ ({size})",
    "payments.daily.uniformNoSize": "زيّ",
    "payments.daily.correction": "تصحيح",
    "payments.daily.empty.title": "ما انقبض شي بـ {date}",
    "payments.daily.empty.sub": "المصاري اللي بتنسجّل بهاليوم بتطلع هون.",

    // Outstanding: families
    "payments.family.label": "عيلة · {count} ولاد",
    "payments.family.total": "مجموع العيلة",

    // Settings: receipt template
    "payments.settings.receipt.title": "قالب إيصال واتساب",
    "payments.settings.receipt.desc": "الرسالة اللي بتوصل للأهل لمّا تبعتلن إيصال بعد الدفع.",
    "payments.settings.receipt.sampleNote": "مثال · {item} · {amount} · {student}",
    "payments.settings.receipt.toast.saved": "انحفظ قالب الإيصال",

    // Settings: sibling discount
    "payments.settings.discount.title": "حسم الإخوة",
    "payments.settings.discount.desc": "حسم عالاشتراك الشهري للعيل اللي عندا أكتر من ولد.",
    "payments.settings.discount.type": "نوع الحسم",
    "payments.settings.discount.NONE": "بلا حسم",
    "payments.settings.discount.PERCENT": "نسبة مئوية",
    "payments.settings.discount.FIXED": "مبلغ ثابت",
    "payments.settings.discount.value": "القيمة",
    "payments.settings.discount.help":
      "بيمشي عالولد التاني وطالع بالعيلة؛ الولد اللي اشتراكو الأعلى بيدفع كامل. بيعدّل الفواتير غير المدفوعة من هالشهر وطالع.",
    "payments.settings.discount.example": "مثلاً: اشتراك {fee} بيصير {amount} للولد التاني.",
    "payments.settings.discount.submit": "احفظ الحسم",
    "payments.settings.discount.toast.saved": "انحفظ حسم الإخوة",
    "payments.settings.discount.err.percent": "النسبة ما فيها تكون أكتر من 100.",
    "payments.settings.discount.err.value": "حط قيمة 0 أو أكتر.",
  },
} as const;
