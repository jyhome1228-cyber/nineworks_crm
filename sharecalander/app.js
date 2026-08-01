import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getFirestore,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBXhDb0jyhIR4G1ho6Y7V8sibwvENI2r8k",
  authDomain: "nineworks-crm.firebaseapp.com",
  projectId: "nineworks-crm",
  storageBucket: "nineworks-crm.firebasestorage.app",
  messagingSenderId: "1096147745343",
  appId: "1:1096147745343:web:cbec82631cbc2d9db1968a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let events = [];
let calendar = null;

function addDays(key, amount) {
  const [year, month, day] = String(key).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatTimestamp(timestamp) {
  const date = timestamp?.toDate?.();
  if (!date) return "업데이트 대기 중";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function filteredEvents() {
  const client = document.querySelector("#clientFilter")?.value || "all";
  return events.filter((event) => client === "all" || event.client === client);
}

function toCalendarEvent(event) {
  return {
    id: event.id,
    title: `${event.client} · ${event.title}`,
    start: event.start,
    end: addDays(event.end || event.start, 1),
    allDay: true,
    extendedProps: { ...event }
  };
}

function renderClientFilter() {
  const select = document.querySelector("#clientFilter");
  if (!select) return;
  const selected = select.value;
  const clients = [...new Set(events.map((event) => event.client).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ko"));
  select.innerHTML = '<option value="all">전체 클라이언트</option>'
    + clients.map((client) => `<option value="${client}">${client}</option>`).join("");
  if (clients.includes(selected)) select.value = selected;
}

function eventNodes(info) {
  const data = info.event.extendedProps;
  const wrapper = document.createElement("span");
  wrapper.className = "share-event-copy";

  const title = document.createElement("strong");
  title.textContent = `${data.client || "나인웍스"} · ${data.title || "일정"}`;
  wrapper.appendChild(title);

  const summary = document.createElement("small");
  summary.textContent = data.summary || [data.member, data.category].filter(Boolean).join(" · ");
  summary.hidden = !summary.textContent;
  wrapper.appendChild(summary);

  return { domNodes: [wrapper] };
}

function initializeCalendar() {
  const element = document.querySelector("#calendar");
  if (!element || typeof FullCalendar === "undefined") return;

  calendar = new FullCalendar.Calendar(element, {
    initialView: "dayGridMonth",
    firstDay: 1,
    height: "auto",
    editable: false,
    selectable: false,
    dayMaxEvents: 4,
    eventDisplay: "block",
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,listWeek"
    },
    buttonText: {
      today: "오늘",
      month: "월간",
      week: "주간",
      list: "목록"
    },
    titleFormat: { year: "numeric", month: "long" },
    dayHeaderContent: (info) => ["일", "월", "화", "수", "목", "금", "토"][info.date.getDay()],
    events: (_info, success) => success(filteredEvents().map(toCalendarEvent)),
    eventClassNames: (info) => [`event-status-${info.event.extendedProps.status || "planned"}`],
    eventContent: eventNodes,
    eventDidMount: (info) => {
      const data = info.event.extendedProps;
      info.el.title = [
        `${data.client || ""} · ${data.title || ""}`,
        data.summary || "",
        [data.member, data.category].filter(Boolean).join(" · ")
      ].filter(Boolean).join("\n");
    }
  });

  calendar.render();
}

function updateCalendar() {
  renderClientFilter();
  calendar?.refetchEvents();
  const empty = document.querySelector("#emptyState");
  if (empty) empty.hidden = events.length > 0;
}

function subscribe() {
  onSnapshot(
    doc(db, "publicCalendar", "current"),
    (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      events = Array.isArray(data.events) ? data.events : [];
      const updated = document.querySelector("#updatedAt");
      if (updated) updated.textContent = formatTimestamp(data.updatedAt);
      updateCalendar();
    },
    (error) => {
      console.error("공유 캘린더 불러오기 실패", error);
      const updated = document.querySelector("#updatedAt");
      if (updated) updated.textContent = "일정을 불러오지 못했습니다";
      const empty = document.querySelector("#emptyState");
      if (empty) {
        empty.hidden = false;
        empty.textContent = "공유 일정에 접근할 수 없습니다.";
      }
    }
  );
}

function initialize() {
  initializeCalendar();
  document.querySelector("#clientFilter")?.addEventListener("change", () => calendar?.refetchEvents());
  subscribe();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, { once: true });
} else {
  initialize();
}
