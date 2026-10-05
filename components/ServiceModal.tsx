import * as React from "react";
import type { SiteLanguage } from "../lib/siteLanguage";

type Props = {
  open: boolean;
  onClose: () => void;
  lang: SiteLanguage;
};

const copy: Record<SiteLanguage, any> = {
  en:{department:"Service Department",title:"Service Request",subtitle:"Tell us about your vehicle and what it needs. We’ll contact you to confirm the appointment.",fullName:"Full name",phone:"Phone number",email:"Email (optional)",vehicle:"Vehicle — Year, Make, Model",selectService:"Select service",diagnostic:"Diagnostic",oilChange:"Oil Change",hybridBattery:"Hybrid Battery Service",brake:"Brake Service",maintenance:"General Maintenance",repair:"Repair",other:"Other",describe:"Describe the issue or service needed",preferredDate:"Preferred date",dropoff:"Drop-off time",leadTime:"This service requires at least 4 days of advance notice.",sending:"Sending...",submit:"Submit Request",success:"Your request was sent successfully. We’ll contact you to confirm.",error:"There was a problem sending your request. Please try again.",close:"Close"},
  es:{department:"Departamento de Servicio",title:"Solicitud de Servicio",subtitle:"Cuéntanos sobre tu vehículo y lo que necesita. Te contactaremos para confirmar la cita.",fullName:"Nombre completo",phone:"Número de teléfono",email:"Correo (opcional)",vehicle:"Vehículo — Año, marca, modelo",selectService:"Selecciona el servicio",diagnostic:"Diagnóstico",oilChange:"Cambio de aceite",hybridBattery:"Servicio de batería híbrida",brake:"Servicio de frenos",maintenance:"Mantenimiento general",repair:"Reparación",other:"Otro",describe:"Describe el problema o servicio que necesitas",preferredDate:"Fecha preferida",dropoff:"Hora de entrega",leadTime:"Este servicio requiere al menos 4 días de anticipación.",sending:"Enviando...",submit:"Enviar solicitud",success:"Tu solicitud fue enviada correctamente. Te contactaremos para confirmar.",error:"Hubo un problema al enviar tu solicitud. Inténtalo nuevamente.",close:"Cerrar"},
  zh:{department:"服务部门",title:"服务申请",subtitle:"告诉我们您的车辆和所需服务，我们会联系您确认预约。",fullName:"姓名",phone:"电话号码",email:"电子邮箱（可选）",vehicle:"车辆 — 年份、品牌、车型",selectService:"选择服务",diagnostic:"诊断",oilChange:"更换机油",hybridBattery:"混合动力电池服务",brake:"刹车服务",maintenance:"常规保养",repair:"维修",other:"其他",describe:"描述问题或所需服务",preferredDate:"首选日期",dropoff:"送车时间",leadTime:"此服务至少需要提前4天预约。",sending:"发送中...",submit:"提交申请",success:"申请已发送，我们会联系您确认。",error:"发送申请时出现问题，请重试。",close:"关闭"},
  ko:{department:"서비스 부서",title:"서비스 요청",subtitle:"차량과 필요한 서비스를 알려주시면 예약 확인을 위해 연락드리겠습니다.",fullName:"이름",phone:"전화번호",email:"이메일(선택)",vehicle:"차량 — 연식, 브랜드, 모델",selectService:"서비스 선택",diagnostic:"진단",oilChange:"오일 교환",hybridBattery:"하이브리드 배터리 서비스",brake:"브레이크 서비스",maintenance:"일반 정비",repair:"수리",other:"기타",describe:"문제 또는 필요한 서비스를 설명하세요",preferredDate:"희망 날짜",dropoff:"입고 시간",leadTime:"이 서비스는 최소 4일 전 예약이 필요합니다.",sending:"전송 중...",submit:"요청 보내기",success:"요청이 전송되었습니다. 확인을 위해 연락드리겠습니다.",error:"요청을 전송하지 못했습니다. 다시 시도하세요.",close:"닫기"},
  vi:{department:"Bộ phận dịch vụ",title:"Yêu cầu dịch vụ",subtitle:"Cho chúng tôi biết xe của bạn cần gì. Chúng tôi sẽ liên hệ để xác nhận lịch hẹn.",fullName:"Họ tên",phone:"Số điện thoại",email:"Email (không bắt buộc)",vehicle:"Xe — Năm, hãng, mẫu",selectService:"Chọn dịch vụ",diagnostic:"Chẩn đoán",oilChange:"Thay dầu",hybridBattery:"Dịch vụ pin hybrid",brake:"Dịch vụ phanh",maintenance:"Bảo dưỡng tổng quát",repair:"Sửa chữa",other:"Khác",describe:"Mô tả vấn đề hoặc dịch vụ cần thiết",preferredDate:"Ngày mong muốn",dropoff:"Giờ giao xe",leadTime:"Dịch vụ này cần đặt trước ít nhất 4 ngày.",sending:"Đang gửi...",submit:"Gửi yêu cầu",success:"Yêu cầu đã được gửi. Chúng tôi sẽ liên hệ để xác nhận.",error:"Có lỗi khi gửi yêu cầu. Vui lòng thử lại.",close:"Đóng"},
  hy:{department:"Սպասարկման բաժին",title:"Սպասարկման հարցում",subtitle:"Նշեք մեքենան և անհրաժեշտ աշխատանքը։ Մենք կկապվենք՝ այցը հաստատելու համար։",fullName:"Անուն ազգանուն",phone:"Հեռախոսահամար",email:"Էլ. փոստ (ըստ ցանկության)",vehicle:"Մեքենա — տարի, մակնիշ, մոդել",selectService:"Ընտրեք ծառայությունը",diagnostic:"Ախտորոշում",oilChange:"Յուղի փոփոխություն",hybridBattery:"Հիբրիդային մարտկոցի սպասարկում",brake:"Արգելակների սպասարկում",maintenance:"Ընդհանուր սպասարկում",repair:"Վերանորոգում",other:"Այլ",describe:"Նկարագրեք խնդիրը կամ ծառայությունը",preferredDate:"Նախընտրելի օր",dropoff:"Հանձնման ժամ",leadTime:"Այս ծառայության համար անհրաժեշտ է առնվազն 4 օր առաջ գրանցվել։",sending:"Ուղարկվում է...",submit:"Ուղարկել հարցումը",success:"Հարցումը ուղարկված է։ Մենք կկապվենք՝ հաստատելու համար։",error:"Հարցումը հնարավոր չեղավ ուղարկել։ Փորձեք կրկին։",close:"Փակել"},
  tl:{department:"Service Department",title:"Service Request",subtitle:"Sabihin sa amin ang sasakyan at kailangan nito. Kokontakin ka namin para kumpirmahin ang appointment.",fullName:"Buong pangalan",phone:"Numero ng telepono",email:"Email (optional)",vehicle:"Sasakyan — Taon, Brand, Modelo",selectService:"Pumili ng serbisyo",diagnostic:"Diagnostic",oilChange:"Oil Change",hybridBattery:"Hybrid Battery Service",brake:"Brake Service",maintenance:"General Maintenance",repair:"Repair",other:"Iba pa",describe:"Ilarawan ang problema o serbisyong kailangan",preferredDate:"Preferred date",dropoff:"Drop-off time",leadTime:"Kailangan ng hindi bababa sa 4 na araw na advance notice.",sending:"Ipinapadala...",submit:"Ipadala ang Request",success:"Naipadala ang request. Kokontakin ka namin para kumpirmahin.",error:"Nagkaroon ng problema sa pagpapadala. Subukan muli.",close:"Isara"},
  ru:{department:"Сервисный отдел",title:"Заявка на сервис",subtitle:"Расскажите о машине и необходимом обслуживании. Мы свяжемся с вами для подтверждения записи.",fullName:"Имя и фамилия",phone:"Номер телефона",email:"Email (необязательно)",vehicle:"Автомобиль — год, марка, модель",selectService:"Выберите услугу",diagnostic:"Диагностика",oilChange:"Замена масла",hybridBattery:"Обслуживание гибридной батареи",brake:"Тормозная система",maintenance:"Общее обслуживание",repair:"Ремонт",other:"Другое",describe:"Опишите проблему или нужную услугу",preferredDate:"Предпочтительная дата",dropoff:"Время приёма",leadTime:"Для этой услуги требуется запись минимум за 4 дня.",sending:"Отправка...",submit:"Отправить заявку",success:"Заявка отправлена. Мы свяжемся с вами для подтверждения.",error:"Не удалось отправить заявку. Попробуйте ещё раз.",close:"Закрыть"},
  ar:{department:"قسم الصيانة",title:"طلب خدمة",subtitle:"أخبرنا عن سيارتك وما تحتاجه وسنتواصل معك لتأكيد الموعد.",fullName:"الاسم الكامل",phone:"رقم الهاتف",email:"البريد الإلكتروني (اختياري)",vehicle:"السيارة — السنة، الماركة، الموديل",selectService:"اختر الخدمة",diagnostic:"تشخيص",oilChange:"تغيير الزيت",hybridBattery:"خدمة بطارية الهايبرد",brake:"خدمة الفرامل",maintenance:"صيانة عامة",repair:"إصلاح",other:"أخرى",describe:"اشرح المشكلة أو الخدمة المطلوبة",preferredDate:"التاريخ المفضل",dropoff:"وقت تسليم السيارة",leadTime:"هذه الخدمة تتطلب الحجز قبل 4 أيام على الأقل.",sending:"جارٍ الإرسال...",submit:"إرسال الطلب",success:"تم إرسال الطلب. سنتواصل معك للتأكيد.",error:"حدثت مشكلة أثناء إرسال الطلب. حاول مرة أخرى.",close:"إغلاق"}
};

export default function ServiceModal({ open, onClose, lang }: Props) {
  const t = copy[lang] || copy.en;
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");
  const [serviceType, setServiceType] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  function formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth()+1).padStart(2,"0");
    const day = String(date.getDate()).padStart(2,"0");
    return year+"-"+month+"-"+day;
  }

  const today = formatLocalDate(new Date());
  const requiresLeadTime = !["Diagnostic","Oil Change","General Maintenance"].includes(serviceType);
  const leadTimeDate = (() => { const date=new Date(); date.setHours(12,0,0,0); date.setDate(date.getDate()+5); return formatLocalDate(date); })();
  const minimumDate = serviceType && requiresLeadTime ? leadTimeDate : today;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setSuccess(false); setError("");
    const form=e.currentTarget; const formData=new FormData(form);
    const data={
      name:String(formData.get("name")||""), phone:String(formData.get("phone")||""),
      email:String(formData.get("email")||""), date:String(formData.get("date")||""),
      time:String(formData.get("time")||""), vehicle:String(formData.get("vehicle")||""),
      service:String(formData.get("service")||""), message:String(formData.get("message")||""),
      language:lang, page_url:typeof window!=="undefined"?window.location.href:""
    };
    try{
      const res=await fetch("/api/service",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      if(!res.ok) throw new Error();
      setSuccess(true); form.reset(); setServiceType("");
    }catch{ setError(t.error); }finally{ setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm" onMouseDown={(e)=>{if(e.target===e.currentTarget)onClose();}} role="dialog" aria-modal="true" aria-label={t.title}>
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-neutral-950 p-5 text-white shadow-2xl sm:p-7">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-lg text-white/70" aria-label={t.close}>×</button>
        <div className="pr-12">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">{t.department}</p>
          <h2 className="mt-2 text-2xl font-semibold">{t.title}</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="name" required placeholder={t.fullName} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"/>
            <input name="phone" type="tel" required placeholder={t.phone} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"/>
          </div>
          <input name="email" type="email" placeholder={t.email} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"/>
          <input name="vehicle" required placeholder={t.vehicle} className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"/>

          <select name="service" required value={serviceType} onChange={(e)=>setServiceType(e.target.value)} className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-white/30">
            <option value="" disabled>{t.selectService}</option>
            <option value="Diagnostic">{t.diagnostic}</option>
            <option value="Oil Change">{t.oilChange}</option>
            <option value="Hybrid Battery Service">{t.hybridBattery}</option>
            <option value="Brake Service">{t.brake}</option>
            <option value="General Maintenance">{t.maintenance}</option>
            <option value="Repair">{t.repair}</option>
            <option value="Other">{t.other}</option>
          </select>

          <textarea name="message" rows={4} placeholder={t.describe} className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/30"/>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-white/55">{t.preferredDate}</label>
              <input name="date" type="date" required min={minimumDate} className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none"/>
              {serviceType && requiresLeadTime && <p className="mt-1.5 text-[11px] leading-4 text-white/45">{t.leadTime}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-white/55">{t.dropoff}</label>
              <input name="time" type="time" required min="08:00" max="16:00" step="1800" className="w-full rounded-xl border border-white/10 bg-white px-4 py-3 text-sm text-black outline-none"/>
            </div>
          </div>

          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-60">{loading?t.sending:t.submit}</button>
          {success && <p className="text-sm text-green-400">{t.success}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      </div>
    </div>
  );
}
