نشر المشروع إلى Vercel (خطوات سريعة)

0) متغيرات البيئة المطلوبة (انسخ .env.example إلى .env.local محلياً، وأضفها في Vercel → Settings → Environment Variables عند النشر)
   - POSTGRES_URL (إلزامي): رابط الاتصال بقاعدة البيانات — يُضاف تلقائيًا لما تربط Vercel Postgres/Neon من تبويب Storage بالمشروع
   - SESSION_SECRET (إلزامي): مفتاح توقيع الجلسات، ولّده بالأمر: openssl rand -base64 32
   - DEMO_DOCTOR_PASSWORD / DEMO_HOSPITAL_ADMIN_PASSWORD / DEMO_PATIENT_PASSWORD (اختياري): كلمات مرور الحسابات التجريبية الثلاثة، غيّرها قبل أي نشر حقيقي
   - WEB3FORMS_ACCESS_KEY (اختياري): مفتاح استقبال نموذج التواصل (بدون بادئة NEXT_PUBLIC_)
   - NEXT_PUBLIC_FIREBASE_* (اختياري): إعدادات Firebase للقياس الحي عبر Web Serial/Firebase

   الحسابات التجريبية الافتراضية (مخزّنة بقاعدة البيانات عبر seed، راجع src/lib/db/seed.ts):
   - طبيب: dr.khalid@dithar.sa / Dithar@Doctor2026!
   - إدارة منشأة: admin@kfshrc.edu.sa / Dithar@Admin2026!
   - مريض: sara.alotaibi@dithar.sa / Dithar@Patient2026!

0.5) إعداد قاعدة البيانات (مرة واحدة، بعد ربط Vercel Postgres وتحديث .env.local بقيمة POSTGRES_URL)
   npm run db:generate   # يولّد ملفات الهجرة من src/lib/db/schema.ts
   npm run db:migrate    # ينشئ الجداول فعليًا بقاعدة البيانات
   npm run db:seed       # يزرع بيانات المرضى والحسابات التجريبية

1) تأكد أن المشروع جاهز محلياً
   npm install
   npm run build
   npm run dev  # للتجربة محلياً

2) جهّز مستودع Git وادفع إلى GitHub
   # غيّر <your-repo-url> إلى رابط الريبو اللي تنشئه على GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main

3) اربط المشروع بـ Vercel
   - سجّل دخولك إلى https://vercel.com
   - اضغط "New Project" → Import Git Repository → اختر المستودع
   - تحقق أن Framework هو Next.js، Build command: `npm run build`
   - اضغط Deploy

4) إضافة الدومين (مثال: example.com)
   - في Vercel: Project → Settings → Domains → Add
   - في لوحة تحكّم الدومين (مسجّل النطاق)، أضف A record إلى 76.76.21.21
   - أضف CNAME لـ www يوجّه إلى cname.vercel-dns.com
   - انتظر propagation ثم فعّل الدومين في Vercel

5) بعد التفعيل
   - Vercel يصدر شهادة HTTPS تلقائياً
   - اختبر الموقع على https://your-domain.com

ملاحظات إضافية
- إن أردت، أستطيع توليد `favicon.ico` متعدد الأحجام ووضعه في `public/`.
- إذا تحب، أقدّم خطوات مصوّرة أو أقودك عبر مشاركة الشاشة.
