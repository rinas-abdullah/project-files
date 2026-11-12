import type { ScenarioDefinition } from "../engine/types";

/**
 * Hand-authored, human-reviewed scenarios (source = AUTHORED). All organisations,
 * people, hostnames, IPs and log lines are synthetic. External IPs are drawn from
 * ranges used only as simulation labels; nothing is ever contacted.
 *
 * Every adversary node is an edge in an approved action graph; the guardian
 * rejects anything outside it. Nodes marked `adaptive` are the alternative paths
 * the adversary takes when the defender blocks a primary path.
 */

export const COMPETENCIES = [
  { key: "log-analysis", nameAr: "تحليل السجلات", nameEn: "Log analysis" },
  { key: "endpoint-investigation", nameAr: "فحص الأجهزة الطرفية", nameEn: "Endpoint investigation" },
  { key: "network-analysis", nameAr: "تحليل حركة الشبكة", nameEn: "Network analysis" },
  { key: "endpoint-containment", nameAr: "احتواء الأجهزة", nameEn: "Endpoint containment" },
  { key: "identity-response", nameAr: "الاستجابة للهويات والحسابات", nameEn: "Identity response" },
  { key: "evidence-handling", nameAr: "حفظ الأدلة الرقمية", nameEn: "Evidence handling" },
  { key: "incident-coordination", nameAr: "إدارة الحادثة واتخاذ القرار", nameEn: "Incident coordination" },
  { key: "incident-reconstruction", nameAr: "إعادة بناء الحادثة", nameEn: "Incident reconstruction" },
] as const;

export type CompetencyKey = (typeof COMPETENCIES)[number]["key"];

const spearPhish: ScenarioDefinition = {
  key: "spear-phish-finance",
  titleAr: "تصيّد موجّه لقسم المالية",
  titleEn: "Targeted phishing against Finance",
  organizationAr: "شركة نُخبة للخدمات اللوجستية (منظمة افتراضية) — 420 موظفًا، مقر رئيسي وفرعان",
  briefingAr:
    "وردت رسالة فاتورة متأخرة إلى أحد موظفي المالية صباح اليوم. بعد دقائق أطلق نظام SIEM تنبيهًا على جهازه. مهمتك احتواء الحادثة قبل أن يصل الخصم إلى بيانات المالية على خادم الملفات ويخرجها.",
  objectivesAr: [
    "تحديد الجهاز ونقطة الدخول الأولى",
    "قطع قنوات التحكم والسيطرة (C2)",
    "تعطيل الحسابات المخترقة",
    "منع تسريب بيانات المالية من fs-01",
    "حفظ الأدلة من الأصول المخترقة",
  ],
  difficulty: 2,
  timeBudget: 60,
  objectiveThreshold: 100,
  assets: [
    { id: "mail-gw", name: "بوابة البريد", kind: "server", ip: "10.0.0.25", criticality: 3, links: ["ws-fin-07", "ws-hr-03"], baselineProcesses: ["postfix", "clamd", "rspamd"] },
    { id: "vpn-gw", name: "بوابة VPN", kind: "vpn", ip: "10.0.0.8", criticality: 4, links: ["fs-01", "dc-01"], baselineProcesses: ["openvpn", "radiusd"] },
    { id: "ws-fin-07", name: "جهاز موظف المالية", kind: "workstation", ip: "10.0.2.17", criticality: 2, links: ["fs-01", "dc-01", "mail-gw"], baselineProcesses: ["explorer.exe", "OUTLOOK.EXE", "EXCEL.EXE", "MsMpEng.exe"] },
    { id: "ws-hr-03", name: "جهاز الموارد البشرية", kind: "workstation", ip: "10.0.2.23", criticality: 2, links: ["fs-01", "dc-01", "mail-gw"], baselineProcesses: ["explorer.exe", "OUTLOOK.EXE", "chrome.exe", "MsMpEng.exe"] },
    { id: "fs-01", name: "خادم ملفات المالية", kind: "server", ip: "10.0.1.10", criticality: 4, links: ["dc-01", "ws-fin-07", "ws-hr-03", "vpn-gw"], baselineProcesses: ["System", "lanmanserver", "MsMpEng.exe"] },
    { id: "dc-01", name: "وحدة التحكم بالنطاق", kind: "domain-controller", ip: "10.0.1.5", criticality: 5, links: ["fs-01", "ws-fin-07", "ws-hr-03", "vpn-gw"], baselineProcesses: ["lsass.exe", "dns.exe", "ntds"] },
  ],
  identities: [
    { id: "s.alharbi", displayName: "سارة الحربي — محاسبة", privileged: false },
    { id: "a.otaibi", displayName: "عبدالله العتيبي — موارد بشرية", privileged: false },
    { id: "svc-backup", displayName: "حساب خدمة النسخ الاحتياطي", privileged: true },
  ],
  entryNode: "phish",
  nodes: [
    {
      id: "phish", technique: "T1566.001", techniqueName: "Spearphishing Attachment", tactic: "initial-access", target: "ws-fin-07",
      preconditions: [],
      effects: [
        { type: "compromise-asset", asset: "ws-fin-07" },
        { type: "compromise-identity", identity: "s.alharbi" },
        { type: "spawn-process", asset: "ws-fin-07", process: "invoice_viewer.exe", pid: 4412 },
      ],
      evidence: [
        { key: "mail", asset: "mail-gw", source: "mail", line: "{t} delivered msg-id=<7f3a@supp1ier-portal.com> from=billing@supp1ier-portal.com to=s.alharbi subject='Q3 invoice overdue' attachment=Invoice_Q3.xlsm" },
        { key: "macro", asset: "ws-fin-07", source: "edr", line: "{t} EXCEL.EXE (Invoice_Q3.xlsm) spawned %APPDATA%\\invoice_viewer.exe pid=4412 — unsigned binary" },
      ],
      noise: 0.6, duration: 2, descriptionAr: "مرفق ماكرو في رسالة فاتورة يشغّل برنامجًا خبيثًا",
    },
    {
      id: "beacon", technique: "T1071.001", techniqueName: "Web Protocols C2", tactic: "command-and-control", target: "ws-fin-07",
      preconditions: [{ type: "node-done", node: "phish" }, { type: "asset-reachable", asset: "ws-fin-07" }],
      effects: [{ type: "establish-c2", asset: "ws-fin-07", c2Ip: "185.220.101.47" }],
      evidence: [
        { key: "dns", asset: "ws-fin-07", source: "dns", line: "{t} query cdn-sync-update.net A -> 185.220.101.47" },
        { key: "flow", asset: "ws-fin-07", source: "netflow", line: "{t} 10.0.2.17:49822 -> 185.220.101.47:443 periodic interval=60s bytes=412 (beacon pattern)" },
      ],
      noise: 0.35, duration: 2, descriptionAr: "اتصال تحكم وسيطرة دوري عبر HTTPS",
    },
    {
      id: "lsass", technique: "T1003.001", techniqueName: "LSASS Memory", tactic: "credential-access", target: "ws-fin-07",
      preconditions: [{ type: "node-done", node: "beacon" }, { type: "c2-open", c2Ip: "185.220.101.47" }],
      effects: [
        { type: "compromise-identity", identity: "svc-backup" },
        { type: "spawn-process", asset: "ws-fin-07", process: "rundll32.exe comsvcs.dll MiniDump", pid: 5120 },
      ],
      evidence: [{ key: "dump", asset: "ws-fin-07", source: "edr", line: "{t} rundll32.exe (pid=5120) opened lsass.exe with PROCESS_VM_READ — credential dumping pattern; cached logon: svc-backup" }],
      noise: 0.7, duration: 3, descriptionAr: "سحب بيانات الاعتماد من ذاكرة LSASS",
    },
    {
      id: "smb-lateral", technique: "T1021.002", techniqueName: "SMB/Windows Admin Shares", tactic: "lateral-movement", target: "fs-01",
      preconditions: [
        { type: "node-done", node: "lsass" }, { type: "identity-active", identity: "svc-backup" },
        { type: "asset-reachable", asset: "ws-fin-07" }, { type: "asset-reachable", asset: "fs-01" }, { type: "not-node-done", nodes: ["vpn-reentry"] },
      ],
      effects: [{ type: "compromise-asset", asset: "fs-01" }, { type: "spawn-process", asset: "fs-01", process: "svchost_upd.exe", pid: 6631 }],
      evidence: [
        { key: "logon", asset: "fs-01", source: "auth.log", line: "{t} EventID=4624 LogonType=3 account=svc-backup source=10.0.2.17 share=ADMIN$" },
        { key: "svc", asset: "fs-01", source: "process", line: "{t} EventID=7045 new service 'UpdSvc' image=C:\\Windows\\Temp\\svchost_upd.exe pid=6631" },
      ],
      noise: 0.55, duration: 3, descriptionAr: "التنقل إلى خادم الملفات بحساب الخدمة المسروق",
    },
    {
      id: "vpn-reentry", technique: "T1133", techniqueName: "External Remote Services", tactic: "initial-access", target: "fs-01", adaptive: true,
      preconditions: [
        { type: "node-done", node: "lsass" }, { type: "asset-isolated", asset: "ws-fin-07" }, { type: "identity-active", identity: "svc-backup" },
        { type: "asset-reachable", asset: "fs-01" }, { type: "not-node-done", nodes: ["smb-lateral"] },
      ],
      effects: [{ type: "compromise-asset", asset: "fs-01" }, { type: "spawn-process", asset: "fs-01", process: "svchost_upd.exe", pid: 6631 }],
      evidence: [
        { key: "vpn", asset: "vpn-gw", source: "auth.log", line: "{t} VPN login account=svc-backup src=91.203.5.112 geo=unusual (service account interactive login)" },
        { key: "svc", asset: "fs-01", source: "process", line: "{t} EventID=7045 new service 'UpdSvc' image=C:\\Windows\\Temp\\svchost_upd.exe pid=6631" },
      ],
      noise: 0.5, duration: 3, descriptionAr: "بعد عزل الجهاز، عاد الخصم عبر VPN بحساب الخدمة المسروق",
    },
    {
      id: "c2-fs", technique: "T1071.001", techniqueName: "Web Protocols C2", tactic: "command-and-control", target: "fs-01",
      preconditions: [{ type: "any-node-done", nodes: ["smb-lateral", "vpn-reentry"] }, { type: "asset-reachable", asset: "fs-01" }],
      effects: [{ type: "establish-c2", asset: "fs-01", c2Ip: "45.137.22.9" }],
      evidence: [{ key: "flow", asset: "fs-01", source: "netflow", line: "{t} 10.0.1.10:51234 -> 45.137.22.9:443 TLS SNI=update-check.org (server initiating outbound TLS)" }],
      noise: 0.3, duration: 2, descriptionAr: "قناة تحكم ثانية من خادم الملفات",
    },
    {
      id: "stage", technique: "T1074.001", techniqueName: "Local Data Staging", tactic: "collection", target: "fs-01",
      preconditions: [{ type: "any-node-done", nodes: ["smb-lateral", "vpn-reentry"] }, { type: "asset-reachable", asset: "fs-01" }],
      effects: [{ type: "objective-progress", amount: 30 }],
      evidence: [{ key: "7z", asset: "fs-01", source: "process", line: "{t} 7z.exe a -p C:\\Windows\\Temp\\q3.7z D:\\Finance\\Q3\\* (parent svchost_upd.exe)" }],
      noise: 0.45, duration: 3, descriptionAr: "تجميع وضغط ملفات المالية",
    },
    {
      id: "exfil", technique: "T1041", techniqueName: "Exfiltration Over C2 Channel", tactic: "exfiltration", target: "fs-01",
      preconditions: [{ type: "node-done", node: "stage" }, { type: "c2-open", c2Ip: "45.137.22.9" }],
      effects: [{ type: "objective-progress", amount: 70 }],
      evidence: [{ key: "out", asset: "fs-01", source: "netflow", line: "{t} 10.0.1.10 -> 45.137.22.9:443 bytes_out=1.8GB duration=4m" }],
      noise: 0.6, duration: 4, descriptionAr: "تسريب الأرشيف عبر قناة التحكم",
    },
    {
      id: "exfil-cloud", technique: "T1567.002", techniqueName: "Exfiltration to Cloud Storage", tactic: "exfiltration", target: "fs-01", adaptive: true,
      preconditions: [{ type: "node-done", node: "stage" }, { type: "c2-blocked", c2Ip: "45.137.22.9" }, { type: "asset-reachable", asset: "fs-01" }, { type: "not-node-done", nodes: ["exfil"] }],
      effects: [{ type: "establish-c2", asset: "fs-01", c2Ip: "104.18.33.7" }, { type: "objective-progress", amount: 70 }],
      evidence: [{ key: "cloud", asset: "fs-01", source: "netflow", line: "{t} 10.0.1.10 -> 104.18.33.7:443 SNI=files.share-drop.example bytes_out=1.8GB (rclone user-agent)" }],
      noise: 0.5, duration: 4, descriptionAr: "بعد حظر قناة التحكم، حوّل الخصم التسريب إلى تخزين سحابي",
    },
  ],
  competencies: { "log-analysis": 0.2, "endpoint-investigation": 0.15, "network-analysis": 0.2, "identity-response": 0.2, "endpoint-containment": 0.15, "evidence-handling": 0.1 },
  attackRefs: ["T1566.001", "T1071.001", "T1003.001", "T1021.002", "T1133", "T1074.001", "T1041", "T1567.002"],
  backgroundEvidence: [
    { key: "hr-logon", asset: "ws-hr-03", source: "auth.log", line: "{t} EventID=4624 LogonType=2 account=a.otaibi (interactive, normal hours)" },
    { key: "hr-o365", asset: "ws-hr-03", source: "netflow", line: "{t} 10.0.2.23 -> 52.96.0.12:443 outlook.office365.com (baseline)" },
    { key: "dc-tgt", asset: "dc-01", source: "auth.log", line: "{t} EventID=4768 TGT issued account=s.alharbi source=10.0.2.17 (normal morning logon)" },
    { key: "fs-backup", asset: "fs-01", source: "auth.log", line: "{t} nightly backup job completed account=svc-backup 02:00 (scheduled, baseline)" },
  ],
  hintsAr: [
    "ابدأ بالجهاز الذي ظهر عليه التنبيه الأول، وراجع سجلات البريد على mail-gw لمعرفة ما وصل.",
    "استخدم netstat على الجهاز المشبوه وابحث عن اتصال دوري منتظم إلى عنوان خارجي — ثم احظره.",
    "أي حساب ظهر في ذاكرة جهاز مخترق يجب اعتباره مخترقًا: عطّله.",
    "الخصم قد يعود من طريق آخر (VPN). راقب fs-01 وخذ نسخة جنائية من الأصول المخترقة قبل إعلان الاحتواء.",
  ],
};

const webShell: ScenarioDefinition = {
  key: "web-shell-portal",
  titleAr: "اختراق بوابة العملاء عبر رفع الملفات",
  titleEn: "Customer portal web-shell",
  organizationAr: "جامعة افتراضية — بوابة خدمات الطلاب وقاعدة بيانات القبول",
  briefingAr:
    "سجّل جدار حماية تطبيقات الويب طلبات غريبة على بوابة الطلاب. يُشتبه بأن ثغرة في خاصية رفع الملفات استُغلّت. أوقف الخصم قبل أن يصل إلى قاعدة بيانات القبول.",
  objectivesAr: ["تحديد الثغرة المستغلة وملف الويب الخبيث", "قطع اتصال المهاجم بالخادم", "حماية قاعدة البيانات db-01", "تعطيل بيانات الاعتماد المسروقة"],
  difficulty: 1,
  timeBudget: 50,
  objectiveThreshold: 100,
  assets: [
    { id: "web-01", name: "خادم بوابة الطلاب", kind: "web", ip: "10.0.3.20", criticality: 3, links: ["db-01"], baselineProcesses: ["nginx", "php-fpm", "node_exporter"] },
    { id: "db-01", name: "قاعدة بيانات القبول", kind: "database", ip: "10.0.1.30", criticality: 5, links: ["web-01", "ws-dev-02"], baselineProcesses: ["mysqld", "node_exporter"] },
    { id: "ws-dev-02", name: "جهاز المطوّر", kind: "workstation", ip: "10.0.2.40", criticality: 2, links: ["db-01", "web-01"], baselineProcesses: ["code", "firefox", "sshd"] },
  ],
  identities: [
    { id: "svc-web", displayName: "حساب تطبيق البوابة في قاعدة البيانات", privileged: false },
    { id: "db-admin", displayName: "مدير قاعدة البيانات", privileged: true },
  ],
  entryNode: "upload",
  nodes: [
    {
      id: "upload", technique: "T1190", techniqueName: "Exploit Public-Facing Application", tactic: "initial-access", target: "web-01",
      preconditions: [],
      effects: [{ type: "compromise-asset", asset: "web-01" }, { type: "spawn-process", asset: "web-01", process: "php-cgi shell.php", pid: 3301 }],
      evidence: [{ key: "upload", asset: "web-01", source: "web.log", line: "{t} 194.26.29.113 \"POST /upload.php?name=../../uploads/shell.php HTTP/1.1\" 200 — path traversal in filename" }],
      noise: 0.75, duration: 1, descriptionAr: "رفع ملف PHP عبر ثغرة تجاوز المسار",
    },
    {
      id: "webshell", technique: "T1505.003", techniqueName: "Web Shell", tactic: "persistence", target: "web-01",
      preconditions: [{ type: "node-done", node: "upload" }, { type: "asset-reachable", asset: "web-01" }],
      effects: [{ type: "establish-c2", asset: "web-01", c2Ip: "194.26.29.113" }],
      evidence: [
        { key: "cmd", asset: "web-01", source: "web.log", line: "{t} 194.26.29.113 \"GET /uploads/shell.php?c=id HTTP/1.1\" 200 bytes=54" },
        { key: "flow", asset: "web-01", source: "netflow", line: "{t} 194.26.29.113 -> 10.0.3.20:443 repeated requests to /uploads/shell.php (every 20-40s)" },
      ],
      noise: 0.6, duration: 2, descriptionAr: "استخدام ملف الويب كقناة أوامر",
    },
    {
      id: "config-creds", technique: "T1552.001", techniqueName: "Credentials In Files", tactic: "credential-access", target: "web-01",
      preconditions: [{ type: "node-done", node: "webshell" }, { type: "c2-open", c2Ip: "194.26.29.113" }],
      effects: [{ type: "compromise-identity", identity: "svc-web" }],
      evidence: [{ key: "read", asset: "web-01", source: "process", line: "{t} php-cgi (pid=3301) exec: cat /var/www/portal/config/database.php" }],
      noise: 0.4, duration: 2, descriptionAr: "قراءة بيانات اعتماد قاعدة البيانات من ملف الإعداد",
    },
    {
      id: "db-login", technique: "T1078", techniqueName: "Valid Accounts", tactic: "lateral-movement", target: "db-01",
      preconditions: [{ type: "node-done", node: "config-creds" }, { type: "identity-active", identity: "svc-web" }, { type: "asset-reachable", asset: "web-01" }, { type: "asset-reachable", asset: "db-01" }],
      effects: [{ type: "compromise-asset", asset: "db-01" }, { type: "spawn-process", asset: "db-01", process: "mysqldump --all-databases", pid: 7702 }],
      evidence: [
        { key: "login", asset: "db-01", source: "auth.log", line: "{t} mysql: account=svc-web host=10.0.3.20 interactive session; SELECT on admissions.* (unusual for app account)" },
        { key: "dump", asset: "db-01", source: "process", line: "{t} mysqldump --all-databases pid=7702 parent=mysql (svc-web)" },
      ],
      noise: 0.5, duration: 3, descriptionAr: "الدخول إلى قاعدة البيانات بحساب التطبيق",
    },
    {
      id: "exfil-web", technique: "T1041", techniqueName: "Exfiltration Over C2 Channel", tactic: "exfiltration", target: "web-01",
      preconditions: [{ type: "node-done", node: "db-login" }, { type: "c2-open", c2Ip: "194.26.29.113" }, { type: "asset-reachable", asset: "db-01" }],
      effects: [{ type: "objective-progress", amount: 100 }],
      evidence: [{ key: "out", asset: "web-01", source: "netflow", line: "{t} 10.0.3.20 -> 194.26.29.113 bytes_out=640MB via /uploads/shell.php?f=dump.sql.gz" }],
      noise: 0.6, duration: 3, descriptionAr: "تسريب نسخة قاعدة البيانات عبر ملف الويب",
    },
    {
      id: "dns-tunnel", technique: "T1048.003", techniqueName: "Exfiltration Over Unencrypted Non-C2 Protocol (DNS)", tactic: "exfiltration", target: "db-01", adaptive: true,
      preconditions: [{ type: "node-done", node: "db-login" }, { type: "c2-blocked", c2Ip: "194.26.29.113" }, { type: "asset-reachable", asset: "db-01" }, { type: "not-node-done", nodes: ["exfil-web"] }],
      effects: [{ type: "establish-c2", asset: "db-01", c2Ip: "5.188.86.12" }, { type: "objective-progress", amount: 100 }],
      evidence: [{ key: "tunnel", asset: "db-01", source: "dns", line: "{t} 412 TXT queries/min to *.x9f2.data-sync.cc via resolver 5.188.86.12 (encoded payloads)" }],
      noise: 0.55, duration: 4, descriptionAr: "بعد حظر عنوان المهاجم، حاول التسريب عبر نفق DNS من قاعدة البيانات",
    },
  ],
  competencies: { "log-analysis": 0.3, "network-analysis": 0.25, "endpoint-containment": 0.25, "identity-response": 0.2 },
  attackRefs: ["T1190", "T1505.003", "T1552.001", "T1078", "T1041", "T1048.003"],
  backgroundEvidence: [
    { key: "normal", asset: "web-01", source: "web.log", line: "{t} 10.20.4.71 \"GET /portal/schedule HTTP/1.1\" 200 (student traffic baseline)" },
    { key: "dba", asset: "db-01", source: "auth.log", line: "{t} mysql: account=db-admin host=10.0.2.40 scheduled maintenance window (approved change CHG-2214)" },
    { key: "dev", asset: "ws-dev-02", source: "netflow", line: "{t} 10.0.2.40 -> 140.82.112.3:443 github.com (baseline)" },
  ],
  hintsAr: [
    "راجع web.log على web-01 وابحث عن طلبات رفع ملفات بأسماء غير طبيعية.",
    "عنوان IP الذي رفع الملف هو نفسه الذي يرسل الأوامر — احظره.",
    "التطبيق قرأ ملف الإعداد: حساب svc-web يجب تعطيله قبل أن يُستخدم في db-01.",
    "إذا حُظر المهاجم قد يحاول طريقًا آخر من db-01؛ راقب DNS هناك.",
  ],
};

const ransomPrecursor: ScenarioDefinition = {
  key: "ransomware-precursor",
  titleAr: "تمهيد لهجوم فدية عبر VPN",
  titleEn: "Ransomware precursor via VPN",
  organizationAr: "مستشفى افتراضي — شبكة إدارية مع خادم ملفات ونظام نسخ احتياطي",
  briefingAr:
    "رُصدت محاولات دخول فاشلة كثيرة على بوابة VPN ليلًا، تلتها جلسة ناجحة. الخصم يسعى لتعطيل النسخ الاحتياطية تمهيدًا لهجوم فدية. احتوِ الحادثة قبل تعطيل الاستعادة.",
  objectivesAr: ["تحديد الحساب المخترق عبر VPN", "إيقاف أداة الوصول عن بُعد", "حماية حساب الخدمة svc-sql", "منع حذف النسخ الاحتياطية على backup-01"],
  difficulty: 3,
  timeBudget: 75,
  objectiveThreshold: 100,
  assets: [
    { id: "vpn-gw", name: "بوابة VPN", kind: "vpn", ip: "10.0.0.8", criticality: 4, links: ["ws-it-01"], baselineProcesses: ["openvpn", "radiusd"] },
    { id: "ws-it-01", name: "جهاز فريق تقنية المعلومات", kind: "workstation", ip: "10.0.4.11", criticality: 3, links: ["dc-01", "fs-02", "backup-01"], baselineProcesses: ["explorer.exe", "mmc.exe", "MsMpEng.exe"] },
    { id: "dc-01", name: "وحدة التحكم بالنطاق", kind: "domain-controller", ip: "10.0.1.5", criticality: 5, links: ["ws-it-01", "fs-02", "backup-01"], baselineProcesses: ["lsass.exe", "dns.exe", "ntds"] },
    { id: "fs-02", name: "خادم الملفات الإدارية", kind: "server", ip: "10.0.1.12", criticality: 4, links: ["dc-01", "ws-it-01", "backup-01"], baselineProcesses: ["System", "lanmanserver", "MsMpEng.exe"] },
    { id: "backup-01", name: "خادم النسخ الاحتياطي", kind: "server", ip: "10.0.1.40", criticality: 5, links: ["fs-02", "dc-01"], baselineProcesses: ["veeam.service", "sqlservr.exe"] },
  ],
  identities: [
    { id: "k.alzahrani", displayName: "خالد الزهراني — دعم فني", privileged: false },
    { id: "m.alqahtani", displayName: "منى القحطاني — مديرة البنية التحتية", privileged: true },
    { id: "svc-sql", displayName: "حساب خدمة SQL", privileged: true },
  ],
  entryNode: "spray",
  nodes: [
    {
      id: "spray", technique: "T1110.003", techniqueName: "Password Spraying", tactic: "credential-access", target: "vpn-gw",
      preconditions: [],
      effects: [{ type: "compromise-identity", identity: "k.alzahrani" }],
      evidence: [
        { key: "fail", asset: "vpn-gw", source: "auth.log", line: "{t} 37 failed logins across 22 accounts from 80.66.88.204 within 6 minutes" },
        { key: "ok", asset: "vpn-gw", source: "auth.log", line: "{t} successful login account=k.alzahrani src=80.66.88.204 (first seen source)" },
      ],
      noise: 0.8, duration: 2, descriptionAr: "رش كلمات المرور على بوابة VPN ونجاح الدخول بحساب",
    },
    {
      id: "rdp", technique: "T1021.001", techniqueName: "Remote Desktop Protocol", tactic: "lateral-movement", target: "ws-it-01",
      preconditions: [{ type: "node-done", node: "spray" }, { type: "identity-active", identity: "k.alzahrani" }, { type: "asset-reachable", asset: "ws-it-01" }],
      effects: [{ type: "compromise-asset", asset: "ws-it-01" }],
      evidence: [{ key: "rdp", asset: "ws-it-01", source: "auth.log", line: "{t} EventID=4624 LogonType=10 account=k.alzahrani source=10.0.0.8 (VPN pool)" }],
      noise: 0.4, duration: 2, descriptionAr: "الدخول بسطح المكتب البعيد إلى جهاز تقنية المعلومات",
    },
    {
      id: "rat", technique: "T1219", techniqueName: "Remote Access Software", tactic: "command-and-control", target: "ws-it-01",
      preconditions: [{ type: "node-done", node: "rdp" }, { type: "asset-reachable", asset: "ws-it-01" }],
      effects: [{ type: "spawn-process", asset: "ws-it-01", process: "AnyDesk.exe --silent", pid: 8120 }, { type: "establish-c2", asset: "ws-it-01", c2Ip: "195.181.170.5" }],
      evidence: [
        { key: "proc", asset: "ws-it-01", source: "process", line: "{t} AnyDesk.exe --silent pid=8120 installed from C:\\Users\\k.alzahrani\\Downloads (not in software inventory)" },
        { key: "flow", asset: "ws-it-01", source: "netflow", line: "{t} 10.0.4.11 -> 195.181.170.5:6568 relay session (remote access tool)" },
      ],
      noise: 0.45, duration: 2, descriptionAr: "تثبيت أداة وصول عن بُعد للحفاظ على السيطرة",
    },
    {
      id: "kerberoast", technique: "T1558.003", techniqueName: "Kerberoasting", tactic: "credential-access", target: "dc-01",
      preconditions: [{ type: "node-done", node: "rat" }, { type: "asset-reachable", asset: "ws-it-01" }, { type: "identity-active", identity: "k.alzahrani" }],
      effects: [{ type: "compromise-identity", identity: "svc-sql" }],
      evidence: [{ key: "tgs", asset: "dc-01", source: "auth.log", line: "{t} EventID=4769 x14 TGS requests EncryptionType=0x17 (RC4) account=k.alzahrani source=10.0.4.11 service=MSSQLSvc/backup-01" }],
      noise: 0.35, duration: 3, descriptionAr: "طلب تذاكر خدمة لكسر كلمة مرور svc-sql",
    },
    {
      id: "lateral-fs", technique: "T1021.002", techniqueName: "SMB/Windows Admin Shares", tactic: "lateral-movement", target: "fs-02",
      preconditions: [{ type: "node-done", node: "kerberoast" }, { type: "identity-active", identity: "svc-sql" }, { type: "asset-reachable", asset: "ws-it-01" }, { type: "asset-reachable", asset: "fs-02" }],
      effects: [{ type: "compromise-asset", asset: "fs-02" }, { type: "spawn-process", asset: "fs-02", process: "PSEXESVC.exe", pid: 9031 }],
      evidence: [{ key: "psexec", asset: "fs-02", source: "process", line: "{t} EventID=7045 service PSEXESVC installed by svc-sql from 10.0.4.11" }],
      noise: 0.55, duration: 3, descriptionAr: "التنقل إلى خادم الملفات بحساب الخدمة",
    },
    {
      id: "persist-fs", technique: "T1053.005", techniqueName: "Scheduled Task", tactic: "persistence", target: "fs-02", adaptive: true,
      preconditions: [{ type: "node-done", node: "lateral-fs" }, { type: "asset-isolated", asset: "ws-it-01" }, { type: "asset-reachable", asset: "fs-02" }],
      effects: [{ type: "establish-c2", asset: "fs-02", c2Ip: "141.98.10.60" }, { type: "spawn-process", asset: "fs-02", process: "svc_health.exe", pid: 9188 }],
      evidence: [
        { key: "task", asset: "fs-02", source: "process", line: "{t} schtasks /create /tn \"HealthCheck\" /tr C:\\ProgramData\\svc_health.exe /sc minute /mo 5 (svc-sql)" },
        { key: "flow", asset: "fs-02", source: "netflow", line: "{t} 10.0.1.12 -> 141.98.10.60:443 every 5m (new beacon after ws-it-01 isolated)" },
      ],
      noise: 0.35, duration: 2, descriptionAr: "بعد عزل جهاز تقنية المعلومات، أنشأ الخصم قناة بديلة من خادم الملفات",
    },
    {
      id: "shadow-delete", technique: "T1490", techniqueName: "Inhibit System Recovery", tactic: "impact", target: "backup-01",
      preconditions: [{ type: "node-done", node: "lateral-fs" }, { type: "identity-active", identity: "svc-sql" }, { type: "asset-reachable", asset: "backup-01" }],
      effects: [{ type: "compromise-asset", asset: "backup-01" }, { type: "spawn-process", asset: "backup-01", process: "vssadmin delete shadows /all", pid: 9420 }, { type: "objective-progress", amount: 50 }],
      evidence: [
        { key: "vss", asset: "backup-01", source: "process", line: "{t} vssadmin.exe delete shadows /all /quiet (svc-sql) pid=9420" },
        { key: "jobs", asset: "backup-01", source: "auth.log", line: "{t} backup jobs disabled by svc-sql from 10.0.1.12" },
      ],
      noise: 0.7, duration: 3, descriptionAr: "حذف النسخ الظلية وتعطيل مهام النسخ الاحتياطي",
    },
    {
      id: "stage-encryptor", technique: "T1570", techniqueName: "Lateral Tool Transfer", tactic: "lateral-movement", target: "fs-02",
      preconditions: [{ type: "node-done", node: "shadow-delete" }, { type: "asset-reachable", asset: "fs-02" }],
      effects: [{ type: "objective-progress", amount: 50 }],
      evidence: [{ key: "drop", asset: "fs-02", source: "edr", line: "{t} high-entropy binary dropped C:\\ProgramData\\upd.exe — matches ransomware staging heuristics (blocked from execution in simulation)" }],
      noise: 0.6, duration: 3, descriptionAr: "نقل أداة التشفير تمهيدًا للتنفيذ",
    },
  ],
  competencies: { "log-analysis": 0.2, "identity-response": 0.3, "endpoint-containment": 0.2, "network-analysis": 0.1, "evidence-handling": 0.1, "incident-coordination": 0.1 },
  attackRefs: ["T1110.003", "T1021.001", "T1219", "T1558.003", "T1021.002", "T1053.005", "T1490", "T1570"],
  backgroundEvidence: [
    { key: "admin", asset: "vpn-gw", source: "auth.log", line: "{t} successful login account=m.alqahtani src=10.20.0.4 (corporate MFA, baseline)" },
    { key: "it-mmc", asset: "ws-it-01", source: "process", line: "{t} mmc.exe dsa.msc opened by m.alqahtani (routine AD admin)" },
    { key: "bk-ok", asset: "backup-01", source: "auth.log", line: "{t} nightly backup job completed (baseline)" },
  ],
  hintsAr: [
    "سجلات vpn-gw تكشف من أين بدأ الخصم وبأي حساب.",
    "الحساب الذي دخل من مصدر جديد يجب تعطيله فورًا؛ ثم افحص ws-it-01 بحثًا عن أدوات وصول عن بُعد.",
    "طلبات TGS بتشفير RC4 على dc-01 تعني أن حساب خدمة مستهدف — عطّله.",
    "إذا عزلت ws-it-01 فقد ينتقل الخصم إلى fs-02؛ احمِ backup-01 قبل كل شيء.",
  ],
};

export const SCENARIOS: ScenarioDefinition[] = [webShell, spearPhish, ransomPrecursor];

export function getScenarioDefinition(key: string): ScenarioDefinition | undefined {
  return SCENARIOS.find((s) => s.key === key);
}
