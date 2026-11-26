/**
 * Extra translation strings for the "groups" area. Merged into `dict` in
 * ../index.ts. Add every key to BOTH en and ar.
 */
export const groupsStrings = {
  en: {
    // ---- Groups overview (/groups) ----
    "groups.action.add": "Add group",
    "groups.action.editName": "Edit {name}",
    "groups.action.details": "Group details",
    "groups.cards.label": "Choose a group",
    "groups.card.agesFrom": "Ages {min}+",
    "groups.card.agesUpTo": "Up to {max} years",
    "groups.card.players": "{count} players",
    "groups.card.players.one": "1 player",
    "groups.card.playersOf": "{count} / {max} players",
    "groups.card.overCapacity": "Over capacity",
    "groups.card.full": "Full",
    "groups.card.noSchedule": "No sessions yet",
    "groups.unassigned.title": "Unassigned",
    "groups.unassigned.sub": "Players without a group",

    // ---- Players section ----
    "groups.players.title": "{name} players",
    "groups.players.col.player": "Player",
    "groups.players.empty.title": "No players in this group yet",
    "groups.players.empty.sub": "Add a student and pick this group, or move a player here from another group.",
    "groups.players.empty.unassigned": "Every player has a group.",
    "groups.noGroup": "No group",

    // ---- Change group dialog ----
    "groups.change.action": "Change group",
    "groups.change.actionName": "Change group for {name}",
    "groups.change.title": "Change group for {name}",
    "groups.change.desc": "Unpaid invoices move to the new group's fee, and this month's roster is updated.",
    "groups.change.label": "New group",
    "groups.change.current": "(current)",
    "groups.toast.moved": "{name} moved to {group}",
    "groups.toast.removedFromGroup": "{name} no longer has a group",
    "groups.error.changeGroup": "Couldn't change the group",

    // ---- Drag & drop ----
    "groups.drag.hint": "Drag a player onto a group card to move them.",
    "groups.drag.ghost": "{name} → …",
    "groups.drag.dropHere": "Move {name} here",
    "groups.drag.moving": "Moving…",
    "groups.toast.undo": "Undo",
  },
  ar: {
    // ---- Groups overview (/groups) ----
    "groups.action.add": "ضيف مجموعة",
    "groups.action.editName": "عدّل {name}",
    "groups.action.details": "تفاصيل المجموعة",
    "groups.cards.label": "اختار مجموعة",
    "groups.card.agesFrom": "من عمر {min} وطالع",
    "groups.card.agesUpTo": "لحدّ عمر {max}",
    "groups.card.players": "{count} لاعبين",
    "groups.card.players.one": "لاعب واحد",
    "groups.card.playersOf": "{count} / {max} لاعبين",
    "groups.card.overCapacity": "فوق العدد",
    "groups.card.full": "مليانة",
    "groups.card.noSchedule": "ما في حصص بعد",
    "groups.unassigned.title": "بلا مجموعة",
    "groups.unassigned.sub": "لاعبين ما إلن مجموعة",

    // ---- Players section ----
    "groups.players.title": "لاعبين {name}",
    "groups.players.col.player": "اللاعب",
    "groups.players.empty.title": "ما في لاعبين بهالمجموعة بعد",
    "groups.players.empty.sub": "ضيف تلميذ واختار هالمجموعة، أو انقل لاعب لهون من مجموعة تانية.",
    "groups.players.empty.unassigned": "كل اللاعبين إلن مجموعة.",
    "groups.noGroup": "بلا مجموعة",

    // ---- Change group dialog ----
    "groups.change.action": "غيّر المجموعة",
    "groups.change.actionName": "غيّر المجموعة لـ {name}",
    "groups.change.title": "غيّر مجموعة {name}",
    "groups.change.desc": "الفواتير يلّي ما اندفعت بتمشي عقسط المجموعة الجديدة، ولائحة هالشهر بتتحدّث.",
    "groups.change.label": "المجموعة الجديدة",
    "groups.change.current": "(الحالية)",
    "groups.toast.moved": "{name} انتقل على {group}",
    "groups.toast.removedFromGroup": "{name} صار بلا مجموعة",
    "groups.error.changeGroup": "ما زبط تغيير المجموعة",

    // ---- Drag & drop ----
    "groups.drag.hint": "اسحب لاعب وحطّو على كرت مجموعة لتنقلو.",
    "groups.drag.ghost": "{name} ← …",
    "groups.drag.dropHere": "انقل {name} لهون",
    "groups.drag.moving": "عم ننقل…",
    "groups.toast.undo": "تراجع",
  },
} as const;
