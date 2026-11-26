/**
 * Extra translation strings for the "attendance" area. Merged into `dict` in
 * ../index.ts. Add every key to BOTH en and ar.
 */
export const attendanceStrings = {
  en: {
    // Tabs
    "attendance.tabs.label": "Attendance views",
    "attendance.tab.today": "Today",
    "attendance.tab.history": "History",

    // Today — session list
    "attendance.today.desc": "{weekday}, {date} — pick a session and mark who came.",
    "attendance.today.selectSession": "Select session",
    "attendance.today.sessionsLabel": "Today's sessions",
    "attendance.today.noSessions": "No sessions scheduled today.",
    "attendance.today.otherGroups": "Other groups",
    "attendance.today.otherGroupsHint": "Not scheduled today — you can still take attendance.",
    "attendance.today.saved": "Saved",
    "attendance.today.savedCount": "{present}/{total}",
    "attendance.today.savedCountLabel": "Saved: {present} of {total} present",
    "attendance.today.now": "Now",
    "attendance.today.next": "Next",

    // Today — right panel
    "attendance.today.panelTitle": "{group} attendance",
    "attendance.today.session": "Session",
    "attendance.today.time": "Time",
    "attendance.today.noSlot": "Not scheduled today",
    "attendance.today.groupMissing": "This group couldn't be loaded. It may have been deleted.",

    // The checklist sheet (Today + editing a past checklist)
    "attendance.sheet.desc": "Mark each player present or absent, then save.",
    "attendance.sheet.no": "No.",
    "attendance.sheet.player": "Player",
    "attendance.sheet.attendance": "Attendance",
    "attendance.sheet.present": "Present",
    "attendance.sheet.absent": "Absent",
    "attendance.sheet.rowLabel": "Attendance for {name}",
    "attendance.sheet.count.present": "{count} present",
    "attendance.sheet.count.absent": "{count} absent",
    "attendance.sheet.count.unmarked": "{count} not marked",
    "attendance.sheet.unmarkedHint": "Players left unmarked are saved as absent.",
    "attendance.sheet.markAllPresent": "Mark all present",
    "attendance.sheet.notesPlaceholder": "e.g. Training moved indoors",
    "attendance.sheet.saved": "Attendance saved — {present} present, {absent} absent",
    "attendance.sheet.dirty": "Unsaved changes",
    "attendance.sheet.savedBadge": "Saved",

    // History
    "attendance.history.desc": "{month} — sessions and attendance rate for each group",
    "attendance.history.viewMonth": "View month",
    "attendance.history.rateLabel": "Attendance rate",

    // Trials on the checklist
    "attendance.trials.title": "Trying today",
    "attendance.trials.desc": "Not on the register — just mark whether they came.",
    "attendance.trials.manage": "Open trials",
    "attendance.trials.cancelledHint": "{count} children were coming to try this group — move their trial on the Trials page.",
    "attendance.trials.cancelledHint.one": "1 child was coming to try this group — move their trial on the Trials page.",

    // Cancelling a session
    "attendance.cancel.action": "Cancel session",
    "attendance.cancel.title": "Cancel {group}'s session?",
    "attendance.cancel.desc": "{date} — it won't count as an absence for anyone.",
    "attendance.cancel.reason": "Reason",
    "attendance.cancel.reason.rain": "Rain",
    "attendance.cancel.reason.holiday": "Holiday",
    "attendance.cancel.reason.field": "Field unavailable",
    "attendance.cancel.reason.other": "Other",
    "attendance.cancel.otherLabel": "Other reason",
    "attendance.cancel.otherPlaceholder": "Write the reason",
    "attendance.cancel.keep": "Keep the session",
    "attendance.cancel.toast": "Session cancelled",
    "attendance.uncancel.toast": "The session is back on",
    "attendance.cancelled.banner": "Session cancelled — {reason}",
    "attendance.cancelled.bannerNoReason": "Session cancelled",
    "attendance.cancelled.sub": "It doesn't count as an absence for anyone.",
    "attendance.cancelled.share": "Share with parents",
    "attendance.cancelled.undo": "Undo cancel",
    "attendance.cancelled.badge": "Cancelled",
    "attendance.grid.cancelledTitle": "Cancelled — {reason}",
    "attendance.grid.legendCancelled": "Shaded columns are cancelled sessions — they don't count.",
    "attendance.error.cancel": "Couldn't cancel the session",
    "attendance.error.uncancel": "Couldn't bring the session back",
    // WhatsApp notice (always sent in Arabic; English kept for reference)
    "attendance.cancel.share.today": "We're sorry, {group}'s training today {date} is cancelled because of {reason}.",
    "attendance.cancel.share.todayNoReason": "We're sorry, {group}'s training today {date} is cancelled.",
    "attendance.cancel.share.day": "We're sorry, {group}'s training on {date} is cancelled because of {reason}.",
    "attendance.cancel.share.dayNoReason": "We're sorry, {group}'s training on {date} is cancelled.",
  },
  ar: {
    // Tabs
    "attendance.tabs.label": "عرض الحضور",
    "attendance.tab.today": "اليوم",
    "attendance.tab.history": "السجل",

    // Today — session list
    "attendance.today.desc": "{weekday}، {date} — اختار الحصة وعلّم مين إجا.",
    "attendance.today.selectSession": "اختار الحصة",
    "attendance.today.sessionsLabel": "حصص اليوم",
    "attendance.today.noSessions": "ما في حصص اليوم.",
    "attendance.today.otherGroups": "مجموعات تانية",
    "attendance.today.otherGroupsHint": "ما عندها حصة اليوم — بس فيك تاخد الحضور برضو.",
    "attendance.today.saved": "انحفظ",
    "attendance.today.savedCount": "{present}/{total}",
    "attendance.today.savedCountLabel": "انحفظ: {present} من {total} حاضرين",
    "attendance.today.now": "هلّق",
    "attendance.today.next": "الجاية",

    // Today — right panel
    "attendance.today.panelTitle": "حضور {group}",
    "attendance.today.session": "الحصة",
    "attendance.today.time": "الوقت",
    "attendance.today.noSlot": "ما عندها حصة اليوم",
    "attendance.today.groupMissing": "ما قدرنا نفتح هالمجموعة. يمكن انحذفت.",

    // The checklist sheet
    "attendance.sheet.desc": "علّم كل لاعب حاضر أو غايب، بعدين احفظ.",
    "attendance.sheet.no": "رقم",
    "attendance.sheet.player": "اللاعب",
    "attendance.sheet.attendance": "الحضور",
    "attendance.sheet.present": "حاضر",
    "attendance.sheet.absent": "غايب",
    "attendance.sheet.rowLabel": "حضور {name}",
    "attendance.sheet.count.present": "{count} حاضر",
    "attendance.sheet.count.absent": "{count} غايب",
    "attendance.sheet.count.unmarked": "{count} بلا علامة",
    "attendance.sheet.unmarkedHint": "اللي بيضلّوا بلا علامة بينحفظوا غايبين.",
    "attendance.sheet.markAllPresent": "الكل حاضر",
    "attendance.sheet.notesPlaceholder": "مثلاً: التمرين صار بالصالة",
    "attendance.sheet.saved": "انحفظ الحضور — {present} حاضر، {absent} غايب",
    "attendance.sheet.dirty": "في تغييرات ما انحفظت",
    "attendance.sheet.savedBadge": "محفوظ",

    // History
    "attendance.history.desc": "{month} — عدد الحصص ونسبة الحضور لكل مجموعة",
    "attendance.history.viewMonth": "شوف الشهر",
    "attendance.history.rateLabel": "نسبة الحضور",

    // Trials on the checklist
    "attendance.trials.title": "عم يجرّبوا اليوم",
    "attendance.trials.desc": "مش عاللائحة — بس علّم إذا إجوا.",
    "attendance.trials.manage": "افتح التجارب",
    "attendance.trials.cancelledHint": "كان في {count} ولاد جايين يجرّبوا هالمجموعة — غيّر موعد تجربتهن من صفحة الحصص التجريبية.",
    "attendance.trials.cancelledHint.one": "كان في ولد جايي يجرّب هالمجموعة — غيّر موعد تجربتو من صفحة الحصص التجريبية.",

    // Cancelling a session
    "attendance.cancel.action": "لغي الحصة",
    "attendance.cancel.title": "تلغي حصة {group}؟",
    "attendance.cancel.desc": "{date} — ما رح تنحسب غياب على حدا.",
    "attendance.cancel.reason": "السبب",
    "attendance.cancel.reason.rain": "الشتي",
    "attendance.cancel.reason.holiday": "عطلة",
    "attendance.cancel.reason.field": "الملعب مش متاح",
    "attendance.cancel.reason.other": "غير شي",
    "attendance.cancel.otherLabel": "سبب تاني",
    "attendance.cancel.otherPlaceholder": "اكتب السبب",
    "attendance.cancel.keep": "خلّي الحصة",
    "attendance.cancel.toast": "انلغت الحصة",
    "attendance.uncancel.toast": "رجعت الحصة",
    "attendance.cancelled.banner": "الحصة ملغاية — {reason}",
    "attendance.cancelled.bannerNoReason": "الحصة ملغاية",
    "attendance.cancelled.sub": "ما بتنحسب غياب على حدا.",
    "attendance.cancelled.share": "ابعت للأهل",
    "attendance.cancelled.undo": "رجّع الحصة",
    "attendance.cancelled.badge": "ملغاية",
    "attendance.grid.cancelledTitle": "ملغاية — {reason}",
    "attendance.grid.legendCancelled": "الأعمدة المظلّلة حصص ملغاية — ما بتنحسب.",
    "attendance.error.cancel": "ما زبط إلغاء الحصة",
    "attendance.error.uncancel": "ما زبط ترجيع الحصة",
    // WhatsApp notice (always sent in Arabic)
    "attendance.cancel.share.today": "نعتذر، تم إلغاء تمرين {group} اليوم {date} بسبب {reason}.",
    "attendance.cancel.share.todayNoReason": "نعتذر، تم إلغاء تمرين {group} اليوم {date}.",
    "attendance.cancel.share.day": "نعتذر، تم إلغاء تمرين {group} يوم {date} بسبب {reason}.",
    "attendance.cancel.share.dayNoReason": "نعتذر، تم إلغاء تمرين {group} يوم {date}.",
  },
} as const;
