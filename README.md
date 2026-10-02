# Syndic Maroc — دليل الاستعمال

تطبيق كامل لتسيير السنديك، فيه 3 أنواع مستخدمين (résident، responsable syndic، société externe)، مبني بـ React + Supabase. **الكل مجاني 100%** (Supabase عندو free tier سخي، والاستضافة ديال الفرونت-إند مجانية تاهي).

---

## المرحلة 1: تجهيز Supabase (الباكند ديالك — مجاني)

1. سير لـ [supabase.com](https://supabase.com) ودير حساب (بـ GitHub ولا email).
2. اضغط **New Project**، عطيه سمية (مثلا `syndic-maroc`)، اختار password قوية، اختار Region قريبة (Europe مثلا).
3. تسنى شوية (2-3 دقايق) حتى يتصاوب المشروع.
4. من الـ sidebar، دخل لـ **SQL Editor**.
5. حل الملف `supabase/schema.sql` اللي عطيتك، نسخ محتواه كامل، لصقو فـ SQL Editor.
6. اضغط **Run**. غادي يتصاوبو ليك جميع الجداول (`profiles`, `residences`, `charges`, `payments`, `announcements`, `documents`) والأمان (RLS).
7. من الـ sidebar، دخل لـ **Project Settings > API**. غادي تلقى:
   - `Project URL`
   - `anon public key`

خاصك هاد الجوج قيم فالخطوة الجاية.

---

## المرحلة 2: تجهيز المشروع محليا (فـ الكمبيوتر ديالك)

### شنو خاصك تكون عندك مثبت
- **Node.js** (version 18 أو أكثر) — حمّلو من [nodejs.org](https://nodejs.org) إلا ماعندكش

### الخطوات

1. حل الملف اللي حملتي (zip)، دخل للفولدر `syndic-maroc` من terminal:
   ```bash
   cd syndic-maroc
   ```

2. ثبت الـ dependencies:
   ```bash
   npm install
   ```

3. دير نسخة من `.env.example` وسميها `.env`:
   ```bash
   cp .env.example .env
   ```

4. حل `.env` بـ أي محرر نصوص، وبدل القيم بـ اللي خديتي من Supabase:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxx
   ```

5. شغل المشروع محليا باش تجربو:
   ```bash
   npm run dev
   ```
   غادي يعطيك رابط بحال `http://localhost:5173` — حلو فـ المتصفح.

6. جرب دير compte بـ "Responsable syndic" (غادي يتصاوب ليك résidence جديدة + code d'invitation). بعدها دير compte تاني بـ "Résident" واستعمل نفس الـ code باش تنضم.

---

## المرحلة 3: نشر التطبيق أونلاين مجانا (Deployment)

الأسهل والمجاني 100%: **Vercel** أو **Netlify**.

### بـ Vercel (الأسهل)
1. حط الكود ديالك فـ GitHub repository (جديدة).
2. سير لـ [vercel.com](https://vercel.com)، دير login بـ GitHub.
3. اضغط **Add New Project**، اختار الـ repo ديالك.
4. فـ Environment Variables، زيد:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (نفس القيم لي حطيتي فـ `.env`)
5. اضغط **Deploy**. من بعد دقيقتين غادي يعطيك رابط بحال `syndic-maroc.vercel.app` — هادا رابط ديال التطبيق ديالك اللي خدام مجانا، ودايما.

---

## المرحلة 4: استعمالو من التليفون (Android / iPhone) — بلا App Store

التطبيق مبني بحال **PWA** (Progressive Web App)، معناها تقدر تزيدو للشاشة الرئيسية ديال التليفون وخدم بحال app حقيقية، بلا ما تخلص فلوس على Apple Developer ($99/سنة) ولا Google Play ($25).

**على Android (Chrome):**
1. حل الرابط ديال التطبيق (اللي عطاك Vercel).
2. اضغط على الـ 3 نقط (⋮) فوق اليمين.
3. اختار **"Ajouter à l'écran d'accueil"** / "Installer l'application".

**على iPhone (Safari):**
1. حل الرابط ديال التطبيق فـ Safari.
2. اضغط على زر المشاركة (المربع بسهم لفوق).
3. اختار **"Sur l'écran d'accueil"**.

من بعد هادشي، غادي يبان ليك icon ديال التطبيق فـ التليفون بحال أي app عادية.

---

## كيفاش خدام النظام ديال الأدوار

- **Responsable syndic**: كيدير compte، كيخلق résidence جديدة، وكيتصاوب ليه **code d'invitation** فريد ديك الساعة. هاد الكود خاصو يعطيه للسكان والشركة الخارجية.
- **Résident** و **Société externe**: باش يديرو compte، خاصهم هاد الـ code (يسولو السنديك عليه).
- كولشي مبني على **RLS** (Row Level Security) فـ Supabase — يعني كل résidence معزولة على حدة، حتى واحد ما يقدر يشوف بيانات ديال résidence خرى.

---

## الميزات اللي كاينة دابا

- ✅ Login/Signup بـ 3 أدوار
- ✅ تسيير مالي: خلق appels de fonds (charges)، تتبع الدفع لكل ساكن
- ✅ Annonces: السنديك كيبعث، السكان كيقراو
- ✅ Documents: upload/download (PV، règlement، factures...)
- ✅ PWA: خدام على الهاتف بحال app

## شنو ينقص (وخاص تزيدو من بعد إلا حتجتيه)
- **الدفع الحقيقي أونلاين** (بحال CMI/Stripe) — دابا غير "Marquer comme payé" يدوي. باش تزيد payment gateway حقيقي، خاصك compte عند CMI (بنك مغربي) وهذا كيتطلب اتفاقية تجارية، ماشي غير code.
- **الإشعارات push** (notifications) — يمكن تزادها بـ Supabase Edge Functions + Firebase Cloud Messaging.
- **الرسائل الفردية** (chat مباشر بين ساكن والسنديك) — دابا كاين غير annonces جماعية.

---

## مشكل؟

- إلا خرج ليك error "Missing Supabase env vars" → تأكد `.env` معمر مزيان.
- إلا ما قدرتيش تدير signup → تأكد دويتي schema.sql كامل فـ Supabase بلا errors.
- إلا بغيتي تزيد ميزة أو تصلح شي حاجة، رجع ليا هنا بالتفاصيل ونكملو سوا.
