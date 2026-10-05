import * as React from "react";
import type { SiteLanguage } from "../lib/siteLanguage";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: SiteLanguage;
  whatsappDigits?: string;
};

type Estimate = {
  low: number;
  high: number;
  vehicle?: { year: number; make: string; model: string; trim?: string };
};

const copy: Record<SiteLanguage, any> = {
  en: {instant:"Instant estimate",title:"Sell Your Car",subtitle:"Get a preliminary dealer offer range in just a few steps.",back:"Back",vin:"17-character VIN",mileage:"Current mileage",continue:"Continue",titleStatus:"Title status",clean:"Clean title",condition:"Vehicle condition",excellent:"Excellent — no known issues",good:"Good — normal wear, drives well",fair:"Fair — minor issues",repair:"Needs repairs",notRunning:"Not running",calculating:"Calculating...",see:"See Estimate",prelim:"Preliminary estimated offer",note:"Free preliminary estimate based on VIN, age, mileage, title and condition. Final offer requires inspection and vehicle-history verification.",want:"Want a final offer?",name:"Your name",phone:"Phone number",sending:"Sending...",sent:"Request Sent",final:"Get Final Offer",sentMsg:"Request sent. We’ll contact you shortly.",invalidVin:"Enter a valid 17-character VIN.",invalidMiles:"Enter the current mileage.",missing:"Enter VIN and mileage to continue.",estimateError:"We couldn't calculate an estimate right now.",sendError:"We couldn't send your request. Please try again."},
  es: {instant:"Estimado rápido",title:"Vende Tu Auto",subtitle:"Recibe un rango preliminar de oferta en pocos pasos.",back:"Atrás",vin:"VIN de 17 caracteres",mileage:"Millas actuales",continue:"Continuar",titleStatus:"Estado del título",clean:"Título limpio",condition:"Condición del vehículo",excellent:"Excelente — sin problemas conocidos",good:"Buena — desgaste normal, maneja bien",fair:"Regular — detalles menores",repair:"Necesita reparaciones",notRunning:"No enciende / no maneja",calculating:"Calculando...",see:"Ver estimado",prelim:"Oferta preliminar estimada",note:"Estimado preliminar gratuito basado en VIN, antigüedad, millas, título y condición. La oferta final requiere inspección y verificación del historial.",want:"¿Quieres una oferta final?",name:"Tu nombre",phone:"Número de teléfono",sending:"Enviando...",sent:"Solicitud enviada",final:"Obtener oferta final",sentMsg:"Solicitud enviada. Te contactaremos pronto.",invalidVin:"Ingresa un VIN válido de 17 caracteres.",invalidMiles:"Ingresa las millas actuales.",missing:"Ingresa VIN y millas para continuar.",estimateError:"No pudimos calcular el estimado en este momento.",sendError:"No pudimos enviar tu solicitud. Inténtalo nuevamente."},
  zh: {instant:"快速估价",title:"出售您的车辆",subtitle:"只需几步即可获得初步经销商报价范围。",back:"返回",vin:"17位 VIN",mileage:"当前里程",continue:"继续",titleStatus:"车辆产权",clean:"Clean title",condition:"车辆状况",excellent:"优秀 — 无已知问题",good:"良好 — 正常磨损，行驶正常",fair:"一般 — 有轻微问题",repair:"需要维修",notRunning:"无法正常行驶",calculating:"计算中...",see:"查看估价",prelim:"初步估价",note:"免费初步估价基于 VIN、车龄、里程、产权和车况。最终报价需经过车辆检查和历史核实。",want:"想获得最终报价？",name:"您的姓名",phone:"电话号码",sending:"发送中...",sent:"已发送",final:"获取最终报价",sentMsg:"请求已发送。我们会尽快联系您。",invalidVin:"请输入有效的17位 VIN。",invalidMiles:"请输入当前里程。",missing:"请输入 VIN 和里程后继续。",estimateError:"目前无法计算估价。",sendError:"无法发送请求，请重试。"},
  ko: {instant:"빠른 견적",title:"차량 판매",subtitle:"몇 단계만으로 예비 딜러 매입 가격 범위를 확인하세요.",back:"뒤로",vin:"17자리 VIN",mileage:"현재 주행거리",continue:"계속",titleStatus:"타이틀 상태",clean:"Clean title",condition:"차량 상태",excellent:"매우 좋음 — 알려진 문제 없음",good:"좋음 — 일반적인 사용감, 정상 주행",fair:"보통 — 경미한 문제",repair:"수리 필요",notRunning:"운행 불가",calculating:"계산 중...",see:"견적 보기",prelim:"예비 예상 매입가",note:"VIN, 연식, 주행거리, 타이틀 및 차량 상태를 바탕으로 한 무료 예비 견적입니다. 최종 가격은 검사와 차량 이력 확인 후 결정됩니다.",want:"최종 제안을 원하시나요?",name:"이름",phone:"전화번호",sending:"전송 중...",sent:"요청 전송됨",final:"최종 제안 받기",sentMsg:"요청이 전송되었습니다. 곧 연락드리겠습니다.",invalidVin:"유효한 17자리 VIN을 입력하세요.",invalidMiles:"현재 주행거리를 입력하세요.",missing:"VIN과 주행거리를 입력하세요.",estimateError:"현재 견적을 계산할 수 없습니다.",sendError:"요청을 전송할 수 없습니다. 다시 시도하세요."},
  vi: {instant:"Ước tính nhanh",title:"Bán xe của bạn",subtitle:"Nhận khoảng giá mua dự kiến của đại lý chỉ trong vài bước.",back:"Quay lại",vin:"VIN 17 ký tự",mileage:"Số dặm hiện tại",continue:"Tiếp tục",titleStatus:"Tình trạng giấy tờ",clean:"Clean title",condition:"Tình trạng xe",excellent:"Rất tốt — không có lỗi đã biết",good:"Tốt — hao mòn bình thường, chạy tốt",fair:"Trung bình — có lỗi nhỏ",repair:"Cần sửa chữa",notRunning:"Không chạy được",calculating:"Đang tính...",see:"Xem ước tính",prelim:"Khoảng giá mua dự kiến",note:"Ước tính miễn phí dựa trên VIN, tuổi xe, số dặm, giấy tờ và tình trạng. Giá cuối cùng cần kiểm tra xe và lịch sử.",want:"Muốn nhận giá cuối cùng?",name:"Tên của bạn",phone:"Số điện thoại",sending:"Đang gửi...",sent:"Đã gửi yêu cầu",final:"Nhận giá cuối cùng",sentMsg:"Đã gửi yêu cầu. Chúng tôi sẽ liên hệ sớm.",invalidVin:"Nhập VIN hợp lệ gồm 17 ký tự.",invalidMiles:"Nhập số dặm hiện tại.",missing:"Nhập VIN và số dặm để tiếp tục.",estimateError:"Hiện chưa thể tính ước tính.",sendError:"Không thể gửi yêu cầu. Vui lòng thử lại."},
  hy: {instant:"Արագ գնահատում",title:"Վաճառեք ձեր մեքենան",subtitle:"Մի քանի քայլով ստացեք նախնական դիլերային առաջարկի միջակայք։",back:"Հետ",vin:"17 նիշանոց VIN",mileage:"Ընթացիկ վազք",continue:"Շարունակել",titleStatus:"Տիտղոսի կարգավիճակ",clean:"Մաքուր title",condition:"Մեքենայի վիճակ",excellent:"Գերազանց — հայտնի խնդիրներ չկան",good:"Լավ — սովորական մաշվածություն, լավ է վարում",fair:"Միջին — փոքր խնդիրներ",repair:"Վերանորոգման կարիք ունի",notRunning:"Չի վարում",calculating:"Հաշվարկվում է...",see:"Տեսնել գնահատումը",prelim:"Նախնական առաջարկ",note:"Անվճար նախնական գնահատում՝ հիմնված VIN-ի, տարիքին, վազքին, title-ին և վիճակին։ Վերջնական առաջարկը պահանջում է զննում և պատմության ստուգում։",want:"Ցանկանո՞ւմ եք վերջնական առաջարկ",name:"Ձեր անունը",phone:"Հեռախոսահամար",sending:"Ուղարկվում է...",sent:"Հարցումն ուղարկված է",final:"Ստանալ վերջնական առաջարկ",sentMsg:"Հարցումն ուղարկված է։ Շուտով կկապվենք ձեզ հետ։",invalidVin:"Մուտքագրեք վավեր 17 նիշանոց VIN։",invalidMiles:"Մուտքագրեք ընթացիկ վազքը։",missing:"Շարունակելու համար մուտքագրեք VIN և վազք։",estimateError:"Այժմ գնահատումը հնարավոր չէ հաշվարկել։",sendError:"Հարցումը հնարավոր չէ ուղարկել։ Փորձեք կրկին։"},
  tl: {instant:"Mabilis na estimate",title:"Ibenta ang Iyong Sasakyan",subtitle:"Makakuha ng paunang dealer offer range sa ilang hakbang.",back:"Bumalik",vin:"17-character VIN",mileage:"Kasalukuyang mileage",continue:"Magpatuloy",titleStatus:"Title status",clean:"Clean title",condition:"Kondisyon ng sasakyan",excellent:"Excellent — walang kilalang problema",good:"Good — normal na gamit, maayos tumakbo",fair:"Fair — may maliliit na problema",repair:"Kailangang ayusin",notRunning:"Hindi tumatakbo",calculating:"Kinakalkula...",see:"Tingnan ang Estimate",prelim:"Paunang estimated offer",note:"Libreng paunang estimate batay sa VIN, edad, mileage, title at kondisyon. Ang final offer ay kailangan ng inspeksyon at history verification.",want:"Gusto ng final offer?",name:"Pangalan",phone:"Numero ng telepono",sending:"Ipinapadala...",sent:"Naipadala ang request",final:"Kunin ang Final Offer",sentMsg:"Naipadala ang request. Kokontakin ka namin sa lalong madaling panahon.",invalidVin:"Maglagay ng valid na 17-character VIN.",invalidMiles:"Ilagay ang kasalukuyang mileage.",missing:"Ilagay ang VIN at mileage para magpatuloy.",estimateError:"Hindi makalkula ang estimate ngayon.",sendError:"Hindi maipadala ang request. Subukan muli."},
  ru: {instant:"Быстрая оценка",title:"Продать автомобиль",subtitle:"Получите предварительный диапазон предложения дилера за несколько шагов.",back:"Назад",vin:"VIN из 17 символов",mileage:"Текущий пробег",continue:"Продолжить",titleStatus:"Статус титула",clean:"Clean title",condition:"Состояние автомобиля",excellent:"Отличное — известных проблем нет",good:"Хорошее — обычный износ, едет нормально",fair:"Среднее — небольшие проблемы",repair:"Требуется ремонт",notRunning:"Не на ходу",calculating:"Расчёт...",see:"Показать оценку",prelim:"Предварительное предложение",note:"Бесплатная предварительная оценка на основе VIN, возраста, пробега, титула и состояния. Финальное предложение требует осмотра и проверки истории.",want:"Хотите финальное предложение?",name:"Ваше имя",phone:"Номер телефона",sending:"Отправка...",sent:"Запрос отправлен",final:"Получить финальное предложение",sentMsg:"Запрос отправлен. Мы скоро свяжемся с вами.",invalidVin:"Введите действительный VIN из 17 символов.",invalidMiles:"Введите текущий пробег.",missing:"Введите VIN и пробег для продолжения.",estimateError:"Сейчас не удалось рассчитать оценку.",sendError:"Не удалось отправить запрос. Попробуйте ещё раз."},
  ar: {instant:"تقدير سريع",title:"بع سيارتك",subtitle:"احصل على نطاق عرض مبدئي من الوكيل خلال خطوات قليلة.",back:"رجوع",vin:"VIN مكوّن من 17 خانة",mileage:"الأميال الحالية",continue:"متابعة",titleStatus:"حالة الملكية",clean:"Clean title",condition:"حالة السيارة",excellent:"ممتازة — لا توجد مشاكل معروفة",good:"جيدة — استخدام طبيعي وتعمل بشكل جيد",fair:"متوسطة — مشاكل بسيطة",repair:"تحتاج إلى إصلاح",notRunning:"لا تعمل",calculating:"جارٍ الحساب...",see:"عرض التقدير",prelim:"عرض تقديري مبدئي",note:"تقدير مجاني مبدئي يعتمد على VIN والعمر والأميال والملكية والحالة. العرض النهائي يتطلب فحص السيارة والتحقق من تاريخها.",want:"هل تريد عرضاً نهائياً؟",name:"اسمك",phone:"رقم الهاتف",sending:"جارٍ الإرسال...",sent:"تم إرسال الطلب",final:"الحصول على العرض النهائي",sentMsg:"تم إرسال الطلب. سنتواصل معك قريباً.",invalidVin:"أدخل VIN صالحاً من 17 خانة.",invalidMiles:"أدخل الأميال الحالية.",missing:"أدخل VIN والأميال للمتابعة.",estimateError:"تعذر حساب التقدير حالياً.",sendError:"تعذر إرسال الطلب. حاول مرة أخرى."}
};

export default function SellYourCarModal({ open, onClose, lang }: Props) {
  const t = copy[lang] || copy.en;
  const [step, setStep] = React.useState(1);
  const [vin, setVin] = React.useState("");
  const [mileage, setMileage] = React.useState("");
  const [titleStatus, setTitleStatus] = React.useState("clean");
  const [condition, setCondition] = React.useState("good");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [estimate, setEstimate] = React.useState<Estimate | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [leadSending, setLeadSending] = React.useState(false);
  const [leadSent, setLeadSent] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) {
      setStep(1); setEstimate(null); setError(""); setLeadSent(false);
    }
  }, [open]);

  if (!open) return null;

  const field = "w-full rounded-xl border border-white/15 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/40";
  const select = "w-full rounded-xl border border-white/15 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-white/40";
  const cleanVin = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "");

  async function getEstimate() {
    const miles = Number(mileage.replace(/[^0-9]/g, ""));
    if (cleanVin.length !== 17) return setError(t.invalidVin);
    if (!miles || miles < 1) return setError(t.invalidMiles);
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/vehicle-estimate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: cleanVin, mileage: miles, titleStatus, condition }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t.estimateError);
      setEstimate({ low: Number(data.low), high: Number(data.high), vehicle: data.vehicle });
      setStep(3);
    } catch {
      setError(t.estimateError);
    } finally { setLoading(false); }
  }

  async function sendFinalOffer() {
    if (!estimate || !name.trim() || !phone.trim()) return;
    setLeadSending(true); setLeadSent(false); setError("");
    const miles = Number(mileage.replace(/[^0-9]/g, ""));
    const vehicleName = estimate.vehicle
      ? [estimate.vehicle.year, estimate.vehicle.make, estimate.vehicle.model, estimate.vehicle.trim].filter(Boolean).join(" ")
      : "";
    try {
      const res = await fetch("/api/sell-car-lead", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin: cleanVin, mileage: miles, titleStatus, condition, low: estimate.low, high: estimate.high, name: name.trim(), phone: phone.trim(), vehicle: vehicleName }),
      });
      if (!res.ok) throw new Error();
      setLeadSent(true);
    } catch {
      setError(t.sendError);
    } finally { setLeadSending(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={t.title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-neutral-950 shadow-2xl">
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-5 sm:px-7">
          <div className="flex min-w-0 items-start gap-3">
            {step > 1 && <button type="button" onClick={() => { setError(""); setStep((prev) => Math.max(1, prev - 1)); }} className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg text-white/70" aria-label={t.back}>←</button>}
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">{t.instant}</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">{t.title}</h2>
              <p className="mt-1 text-sm text-white/55">{t.subtitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg text-white/70">×</button>
        </div>

        <div className="px-5 py-5 sm:px-7 sm:py-6">
          <div className="mb-5 flex gap-2">{[1,2,3].map((n)=><div key={n} className={"h-1 flex-1 rounded-full "+(n<=step?"bg-white":"bg-white/15")} />)}</div>

          {step===1 && <div className="space-y-4">
            <div><label className="mb-1.5 block text-xs font-medium text-white/70">VIN</label><input value={vin} onChange={(e)=>setVin(e.target.value.toUpperCase())} maxLength={17} placeholder={t.vin} className={field}/></div>
            <div><label className="mb-1.5 block text-xs font-medium text-white/70">{t.mileage}</label><input value={mileage} onChange={(e)=>setMileage(e.target.value.replace(/[^0-9]/g,""))} inputMode="numeric" placeholder="85000" className={field}/></div>
            <button type="button" onClick={()=>{if(cleanVin.length!==17||!Number(mileage))return setError(t.missing);setError("");setStep(2);}} className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black">{t.continue}</button>
          </div>}

          {step===2 && <div className="space-y-4">
            <div><label className="mb-1.5 block text-xs font-medium text-white/70">{t.titleStatus}</label><select value={titleStatus} onChange={(e)=>setTitleStatus(e.target.value)} className={select}><option value="clean">{t.clean}</option><option value="rebuilt">Rebuilt</option><option value="salvage">Salvage</option></select></div>
            <div><label className="mb-1.5 block text-xs font-medium text-white/70">{t.condition}</label><select value={condition} onChange={(e)=>setCondition(e.target.value)} className={select}><option value="excellent">{t.excellent}</option><option value="good">{t.good}</option><option value="fair">{t.fair}</option><option value="needs_repair">{t.repair}</option><option value="not_running">{t.notRunning}</option></select></div>
            <div className="flex gap-3"><button type="button" onClick={()=>setStep(1)} className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/15 px-4 text-sm text-white/75">{t.back}</button><button type="button" disabled={loading} onClick={getEstimate} className="inline-flex min-h-11 flex-[2] items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-black disabled:opacity-60">{loading?t.calculating:t.see}</button></div>
          </div>}

          {step===3 && estimate && <div>
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-6 text-center">
              {estimate.vehicle && <p className="mb-2 text-sm font-medium text-white/75">{[estimate.vehicle.year,estimate.vehicle.make,estimate.vehicle.model,estimate.vehicle.trim].filter(Boolean).join(" ")}</p>}
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">{t.prelim}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{"$"+estimate.low.toLocaleString()+" – $"+estimate.high.toLocaleString()}</p>
              <p className="mt-3 text-xs leading-5 text-white/45">{t.note}</p>
            </div>
            <div className="mt-5 space-y-3">
              <p className="text-sm font-medium text-white">{t.want}</p>
              <input value={name} onChange={(e)=>setName(e.target.value)} placeholder={t.name} className={field}/>
              <input value={phone} onChange={(e)=>setPhone(e.target.value)} inputMode="tel" placeholder={t.phone} className={field}/>
              <button type="button" disabled={!name.trim()||!phone.trim()||leadSending||leadSent} onClick={sendFinalOffer} className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-40">{leadSending?t.sending:leadSent?t.sent:t.final}</button>
              {leadSent && <p className="text-center text-sm text-green-400">{t.sentMsg}</p>}
            </div>
          </div>}
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
