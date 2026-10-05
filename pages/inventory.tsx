// pages/inventory.tsx
import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import Image from "next/image";
import { getInventory, type Car } from "../lib/getInventory";
import SellYourCarModal from "../components/SellYourCarModal";
import { architectsDaughter } from "../lib/fonts";
import { SITE_LANGUAGES, applyDocumentLanguage, readSiteLanguage, saveSiteLanguage, type SiteLanguage } from "../lib/siteLanguage";

// Convierte fotos de Drive a imágenes visibles
function parsePhotos(raw?: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(/[\s,;]+/)
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http"))
    .map((u) => {
      if (u.includes("lh3.googleusercontent.com")) return u;
      const match = u.match(/\/d\/([^/]+)/);
      if (match) return `https://lh3.googleusercontent.com/d/${match[1]}=w1600`;
      return u;
    });
}

type Vehicle = {
  id: string;
  title: string;
  year: number | null;
  make: string;
  model: string;
  mileage: number | null;
  price: number | null;
  vin: string;
  fuel: string;
  transmission: string;
  exterior: string;
  photos: string[];
  description: string;
  cardHoverPhoto: string;
  studioCover: string;
};


function vehicleOnlyDescription(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ").replace(/&amp;/gi, "&").replace(/&nbsp;/gi, " ")
    .replace(/(?:available at|offered by|for sale at|disponible en|a la venta en)\s+Available\s+Hybrid\s+R\s*&?\s*M(?:\s+Inc\.?)?[.!]?/gi, "")
    .split(/\r?\n|(?<=[.!?])\s+/)
    .filter(part => !/available\s+hybrid|hybridrm\.com|\b(?:visit us|contact us|call us|financing available|our dealership)\b|(?:ll[aá]manos|vis[ií]tanos)/i.test(part))
    .map(part => part.trim()).filter(Boolean).join("\n").replace(/[ \t]+/g, " ").trim();
}

function inventoryExcerpt(car: Vehicle): string {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-záéíóúñ0-9]+/g, "");
  const escape = (value: string) => value.replace(/[.*+?^$()|[\]\{}]/g, "\\$&");
  const titles = [
    car.title,
    [car.year, car.make, car.model].filter(Boolean).join(" "),
    [car.make, car.model, car.year].filter(Boolean).join(" "),
  ].filter(Boolean);
  const titlePrefix = new RegExp("^(?:" + titles.map(escape).join("|") + ")(?=\\s|[.,:;–—-]|$)[\\s.,:;–—-]*", "i");
  const specs = new Set([
    ...titles, car.make, car.model, String(car.year ?? ""), car.vin,
    car.fuel, car.transmission, car.exterior, "Automatic", "Automática",
    "Automatic transmission", "Transmisión automática",
    "CVT", "Continuously Variable Transmission (CVT)",
  ].map(normalize).filter(Boolean));

  const parts = vehicleOnlyDescription(car.description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&")
    .split(/\r?\n|(?<=[.!?])\s+|[|;]|\s+[•·]\s+/)
    .map(part => part.trim().replace(/^[•✓✔✅*\s-]+/, "").replace(titlePrefix, "").trim())
    .filter(part => {
      if (!part || specs.has(normalize(part))) return false;
      if (/^(?:vin|mileage|miles|millaje|millas|price|precio|year|año|make|marca|model|modelo|transmission|transmisión|fuel|combustible|exterior|color)\s*[:=]/i.test(part)) return false;
      if (/^(?:\d[\d,.\s]*\s*(?:mi|miles|millas)|\$\s*[\d,.]+)[.!]?$/.test(part)) return false;
      return true;
    });
  const excerpt = parts.join(" ").replace(/\s+/g, " ").trim();
  if (excerpt.length <= 180) return excerpt;
  const shortened = excerpt.slice(0, 177);
  const wordEnd = shortened.lastIndexOf(" ");
  return shortened.slice(0, wordEnd > 120 ? wordEnd : 177).replace(/[,:;\s]+$/, "") + "…";
}

type InventoryProps = { inventory: Vehicle[] };

export default function Inventory({ inventory }: InventoryProps) {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");
  const [lang, setLang] = React.useState<SiteLanguage>("en");
  const [sellOpen, setSellOpen] = React.useState(false);
  const [languageOpen, setLanguageOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem("hybridrm-inventory-theme");
      if (saved === "dark" || saved === "light") setTheme(saved);
    } catch {
      // The selector also works when browser storage is unavailable.
    }
  }, []);

  React.useEffect(() => {
    const savedLanguage = readSiteLanguage();
    setLang(savedLanguage);
    applyDocumentLanguage(savedLanguage);
  }, []);

  React.useEffect(() => {
    saveSiteLanguage(lang);
  }, [lang]);

  function selectTheme(next: "dark" | "light") {
    setTheme(next);
    try {
      window.localStorage.setItem("hybridrm-inventory-theme", next);
    } catch {
      // Keep the selection for this visit.
    }
  }

  const [yearFilter, setYearFilter] = React.useState<string>("ALL");
  const [makeFilter, setMakeFilter] = React.useState<string>("ALL");

  // opciones de orden
  const [sortBy, setSortBy] = React.useState<
    | "priceDesc"
    | "priceAsc"
    | "yearDesc"
    | "yearAsc"
    | "mileageDesc"
    | "mileageAsc"
    | "photosDesc"
    | "photosAsc"
    | "makeAsc"
    | "makeDesc"
  >("priceAsc");

  // rango de precio
  const [priceMin, setPriceMin] = React.useState<number | null>(null);
  const [priceMax, setPriceMax] = React.useState<number | null>(null);

  const translations = {
    en: {
      language: "Language", sellYourCar: "Sell Your Car", sold: "Sold",
      dark: "Dark", light: "Light", filtersLabel: "Filters", inventoryNav: "Inventory",
      prequalifyNav: "Pre-Qualify", vehiclesAvailable: "vehicles available",
      allInventory: "All inventory", sort: "Sort", sortHighestPrice: "Highest Price",
      sortLowestPrice: "Lowest Price", sortNewestYear: "Newest Year", sortOldestYear: "Oldest Year",
      sortHighestMileage: "Highest Mileage", sortLowestMileage: "Lowest Mileage",
      sortMostImages: "Most Images", sortLeastImages: "Least Images", sortMakeAZ: "Make A–Z",
      sortMakeZA: "Make Z–A", price: "Price", adjustInStore: "Adjust in-store", year: "Year",
      allYears: "All years", make: "Make", allMakes: "All makes", model: "Model",
      comingSoon: "Coming soon", estPayment: "Est. payment",
      paymentDisclaimer: "Example based on up to 12 monthly payments. Amount may vary. Only for approved customers.",
      tooltipTitlePrefix: "Monthly payment of", getPrequalified: "Get Pre-Qualified",
      noVehicles: "No vehicles found with the selected filters. Try another make or year.",
      modalTitle: "Search all inventory", modalPlaceholder: "Search by model, year, VIN…",
      modalNoResults: "No results for", priceLabel: "Price", searchOpenLabel: "Open search",
      filtersModalTitle: "Adjust filters", applyFilters: "Close", minLabel: "Min", maxLabel: "Max",
      fullDetails: "Full Details", automatic: "Automatic", backHome: "Back to home",
      appearance: "Inventory appearance"
    },
    es: {
      language: "Idioma", sellYourCar: "Vende Tu Auto", sold: "Vendidos",
      dark: "Oscuro", light: "Claro", filtersLabel: "Filtros", inventoryNav: "Inventario",
      prequalifyNav: "Pre-Calificar", vehiclesAvailable: "vehículos disponibles",
      allInventory: "Todo el inventario", sort: "Ordenar", sortHighestPrice: "Precio más alto",
      sortLowestPrice: "Precio más bajo", sortNewestYear: "Año más nuevo", sortOldestYear: "Año más antiguo",
      sortHighestMileage: "Mayor kilometraje", sortLowestMileage: "Menor kilometraje",
      sortMostImages: "Más fotos", sortLeastImages: "Menos fotos", sortMakeAZ: "Marca A–Z",
      sortMakeZA: "Marca Z–A", price: "Precio", adjustInStore: "Ajustar en el dealer", year: "Año",
      allYears: "Todos los años", make: "Marca", allMakes: "Todas las marcas", model: "Modelo",
      comingSoon: "Próximamente", estPayment: "Pago estimado",
      paymentDisclaimer: "Ejemplo basado en hasta 12 pagos mensuales. El monto puede variar. Solo para clientes aprobados.",
      tooltipTitlePrefix: "Pago mensual de", getPrequalified: "Solicitar pre-calificación",
      noVehicles: "No se encontraron vehículos con estos filtros. Prueba otra marca o año.",
      modalTitle: "Buscar en todo el inventario", modalPlaceholder: "Busca por modelo, año, VIN…",
      modalNoResults: "Sin resultados para", priceLabel: "Precio", searchOpenLabel: "Abrir búsqueda",
      filtersModalTitle: "Ajustar filtros", applyFilters: "Cerrar", minLabel: "Mín", maxLabel: "Máx",
      fullDetails: "Ver detalles", automatic: "Automática", backHome: "Volver al inicio",
      appearance: "Apariencia del inventario"
    },
    zh: {
      language: "语言", sellYourCar: "出售您的车辆", sold: "已售", dark: "深色", light: "浅色",
      filtersLabel: "筛选", inventoryNav: "库存", prequalifyNav: "预审", vehiclesAvailable: "辆可售车辆",
      allInventory: "全部库存", sort: "排序", sortHighestPrice: "价格从高到低", sortLowestPrice: "价格从低到高",
      sortNewestYear: "年份最新", sortOldestYear: "年份最旧", sortHighestMileage: "里程最高",
      sortLowestMileage: "里程最低", sortMostImages: "图片最多", sortLeastImages: "图片最少",
      sortMakeAZ: "品牌 A–Z", sortMakeZA: "品牌 Z–A", price: "价格", adjustInStore: "店内调整",
      year: "年份", allYears: "所有年份", make: "品牌", allMakes: "所有品牌", model: "车型",
      comingSoon: "即将推出", estPayment: "预计月供", paymentDisclaimer: "示例基于最多12期月付。金额可能不同，仅适用于获批客户。",
      tooltipTitlePrefix: "每月付款", getPrequalified: "申请预审", noVehicles: "没有找到符合筛选条件的车辆。",
      modalTitle: "搜索全部库存", modalPlaceholder: "按车型、年份、VIN搜索…", modalNoResults: "没有结果",
      priceLabel: "价格", searchOpenLabel: "打开搜索", filtersModalTitle: "调整筛选", applyFilters: "关闭",
      minLabel: "最低", maxLabel: "最高", fullDetails: "查看详情", automatic: "自动挡",
      backHome: "返回主页", appearance: "库存外观"
    },
    ko: {
      language: "언어", sellYourCar: "차량 판매", sold: "판매 완료", dark: "다크", light: "라이트",
      filtersLabel: "필터", inventoryNav: "재고", prequalifyNav: "사전 승인", vehiclesAvailable: "대 판매 가능",
      allInventory: "전체 재고", sort: "정렬", sortHighestPrice: "가격 높은 순", sortLowestPrice: "가격 낮은 순",
      sortNewestYear: "최신 연식", sortOldestYear: "오래된 연식", sortHighestMileage: "주행거리 높은 순",
      sortLowestMileage: "주행거리 낮은 순", sortMostImages: "사진 많은 순", sortLeastImages: "사진 적은 순",
      sortMakeAZ: "브랜드 A–Z", sortMakeZA: "브랜드 Z–A", price: "가격", adjustInStore: "매장에서 조정",
      year: "연식", allYears: "모든 연식", make: "브랜드", allMakes: "모든 브랜드", model: "모델",
      comingSoon: "곧 제공", estPayment: "예상 결제", paymentDisclaimer: "최대 12개월 결제 예시입니다. 승인 고객에 한함.",
      tooltipTitlePrefix: "월 결제", getPrequalified: "사전 승인 신청", noVehicles: "선택한 필터에 맞는 차량이 없습니다.",
      modalTitle: "전체 재고 검색", modalPlaceholder: "모델, 연식, VIN 검색…", modalNoResults: "검색 결과 없음",
      priceLabel: "가격", searchOpenLabel: "검색 열기", filtersModalTitle: "필터 조정", applyFilters: "닫기",
      minLabel: "최소", maxLabel: "최대", fullDetails: "상세 보기", automatic: "자동",
      backHome: "홈으로", appearance: "재고 화면"
    },
    vi: {
      language: "Ngôn ngữ", sellYourCar: "Bán xe của bạn", sold: "Đã bán", dark: "Tối", light: "Sáng",
      filtersLabel: "Bộ lọc", inventoryNav: "Xe hiện có", prequalifyNav: "Đăng ký trước", vehiclesAvailable: "xe đang có",
      allInventory: "Tất cả xe", sort: "Sắp xếp", sortHighestPrice: "Giá cao nhất", sortLowestPrice: "Giá thấp nhất",
      sortNewestYear: "Năm mới nhất", sortOldestYear: "Năm cũ nhất", sortHighestMileage: "Số dặm cao nhất",
      sortLowestMileage: "Số dặm thấp nhất", sortMostImages: "Nhiều ảnh nhất", sortLeastImages: "Ít ảnh nhất",
      sortMakeAZ: "Hãng A–Z", sortMakeZA: "Hãng Z–A", price: "Giá", adjustInStore: "Điều chỉnh tại đại lý",
      year: "Năm", allYears: "Tất cả năm", make: "Hãng", allMakes: "Tất cả hãng", model: "Mẫu xe",
      comingSoon: "Sắp có", estPayment: "Khoản trả ước tính", paymentDisclaimer: "Ví dụ dựa trên tối đa 12 khoản thanh toán hàng tháng. Chỉ dành cho khách được duyệt.",
      tooltipTitlePrefix: "Thanh toán hàng tháng", getPrequalified: "Đăng ký trước", noVehicles: "Không tìm thấy xe phù hợp bộ lọc.",
      modalTitle: "Tìm toàn bộ xe", modalPlaceholder: "Tìm theo mẫu xe, năm, VIN…", modalNoResults: "Không có kết quả cho",
      priceLabel: "Giá", searchOpenLabel: "Mở tìm kiếm", filtersModalTitle: "Điều chỉnh bộ lọc", applyFilters: "Đóng",
      minLabel: "Tối thiểu", maxLabel: "Tối đa", fullDetails: "Xem chi tiết", automatic: "Tự động",
      backHome: "Về trang chủ", appearance: "Giao diện xe"
    },
    hy: {
      language: "Լեզու", sellYourCar: "Վաճառեք ձեր մեքենան", sold: "Վաճառված", dark: "Մուգ", light: "Բաց",
      filtersLabel: "Զտիչներ", inventoryNav: "Մեքենաներ", prequalifyNav: "Նախնական հաստատում", vehiclesAvailable: "մեքենա հասանելի",
      allInventory: "Բոլոր մեքենաները", sort: "Դասավորել", sortHighestPrice: "Ամենաբարձր գինը", sortLowestPrice: "Ամենացածր գինը",
      sortNewestYear: "Նորագույն տարեթիվ", sortOldestYear: "Հնագույն տարեթիվ", sortHighestMileage: "Ամենաբարձր վազքը",
      sortLowestMileage: "Ամենացածր վազքը", sortMostImages: "Ամենաշատ նկարները", sortLeastImages: "Ամենաքիչ նկարները",
      sortMakeAZ: "Մակնիշ A–Z", sortMakeZA: "Մակնիշ Z–A", price: "Գին", adjustInStore: "Կարգավորել սրահում",
      year: "Տարի", allYears: "Բոլոր տարիները", make: "Մակնիշ", allMakes: "Բոլոր մակնիշները", model: "Մոդել",
      comingSoon: "Շուտով", estPayment: "Մոտավոր վճարում", paymentDisclaimer: "Օրինակ՝ մինչև 12 ամսական վճարում։ Միայն հաստատված հաճախորդների համար։",
      tooltipTitlePrefix: "Ամսական վճարում", getPrequalified: "Դիմել նախնական հաստատման", noVehicles: "Ընտրված զտիչներով մեքենա չի գտնվել։",
      modalTitle: "Փնտրել բոլոր մեքենաներում", modalPlaceholder: "Փնտրել մոդելով, տարով, VIN-ով…", modalNoResults: "Արդյունք չկա",
      priceLabel: "Գին", searchOpenLabel: "Բացել որոնումը", filtersModalTitle: "Կարգավորել զտիչները", applyFilters: "Փակել",
      minLabel: "Նվազ.", maxLabel: "Առավ.", fullDetails: "Մանրամասներ", automatic: "Ավտոմատ",
      backHome: "Վերադառնալ գլխավոր էջ", appearance: "Ցուցադրման տեսք"
    },
    tl: {
      language: "Wika", sellYourCar: "Ibenta ang Iyong Sasakyan", sold: "Nabenta", dark: "Madilim", light: "Maliwanag",
      filtersLabel: "Mga Filter", inventoryNav: "Mga Sasakyan", prequalifyNav: "Pre-Qualify", vehiclesAvailable: "sasakyang available",
      allInventory: "Lahat ng sasakyan", sort: "Ayusin", sortHighestPrice: "Pinakamataas na presyo", sortLowestPrice: "Pinakamababang presyo",
      sortNewestYear: "Pinakabagong taon", sortOldestYear: "Pinakalumang taon", sortHighestMileage: "Pinakamataas na mileage",
      sortLowestMileage: "Pinakamababang mileage", sortMostImages: "Pinakamaraming larawan", sortLeastImages: "Pinakakaunting larawan",
      sortMakeAZ: "Brand A–Z", sortMakeZA: "Brand Z–A", price: "Presyo", adjustInStore: "Ayusin sa dealer",
      year: "Taon", allYears: "Lahat ng taon", make: "Brand", allMakes: "Lahat ng brand", model: "Modelo",
      comingSoon: "Malapit na", estPayment: "Tinatayang bayad", paymentDisclaimer: "Halimbawa batay sa hanggang 12 buwanang bayad. Para lamang sa mga aprubadong customer.",
      tooltipTitlePrefix: "Buwanang bayad na", getPrequalified: "Magpa-pre-qualify", noVehicles: "Walang sasakyang tumutugma sa napiling filter.",
      modalTitle: "Hanapin lahat ng sasakyan", modalPlaceholder: "Hanapin ayon sa modelo, taon, VIN…", modalNoResults: "Walang resulta para sa",
      priceLabel: "Presyo", searchOpenLabel: "Buksan ang paghahanap", filtersModalTitle: "Ayusin ang mga filter", applyFilters: "Isara",
      minLabel: "Min", maxLabel: "Max", fullDetails: "Buong Detalye", automatic: "Awtomatiko",
      backHome: "Bumalik sa home", appearance: "Itsura ng inventory"
    },
    ru: {
      language: "Язык", sellYourCar: "Продать автомобиль", sold: "Продано", dark: "Тёмная", light: "Светлая",
      filtersLabel: "Фильтры", inventoryNav: "Автомобили", prequalifyNav: "Предодобрение", vehiclesAvailable: "автомобилей в наличии",
      allInventory: "Все автомобили", sort: "Сортировка", sortHighestPrice: "Сначала дороже", sortLowestPrice: "Сначала дешевле",
      sortNewestYear: "Новее по году", sortOldestYear: "Старше по году", sortHighestMileage: "Больший пробег",
      sortLowestMileage: "Меньший пробег", sortMostImages: "Больше фото", sortLeastImages: "Меньше фото",
      sortMakeAZ: "Марка A–Z", sortMakeZA: "Марка Z–A", price: "Цена", adjustInStore: "Уточнить у дилера",
      year: "Год", allYears: "Все годы", make: "Марка", allMakes: "Все марки", model: "Модель",
      comingSoon: "Скоро", estPayment: "Примерный платёж", paymentDisclaimer: "Пример для до 12 ежемесячных платежей. Только для одобренных клиентов.",
      tooltipTitlePrefix: "Ежемесячный платёж", getPrequalified: "Получить предодобрение", noVehicles: "Автомобили по выбранным фильтрам не найдены.",
      modalTitle: "Поиск по всем автомобилям", modalPlaceholder: "Поиск по модели, году, VIN…", modalNoResults: "Нет результатов для",
      priceLabel: "Цена", searchOpenLabel: "Открыть поиск", filtersModalTitle: "Настроить фильтры", applyFilters: "Закрыть",
      minLabel: "Мин", maxLabel: "Макс", fullDetails: "Подробнее", automatic: "Автомат",
      backHome: "На главную", appearance: "Вид каталога"
    },
    ar: {
      language: "اللغة", sellYourCar: "بع سيارتك", sold: "تم البيع", dark: "داكن", light: "فاتح",
      filtersLabel: "الفلاتر", inventoryNav: "المخزون", prequalifyNav: "تأهيل مبدئي", vehiclesAvailable: "سيارة متاحة",
      allInventory: "كل السيارات", sort: "ترتيب", sortHighestPrice: "السعر الأعلى", sortLowestPrice: "السعر الأقل",
      sortNewestYear: "الأحدث سنة", sortOldestYear: "الأقدم سنة", sortHighestMileage: "الأعلى أميالاً",
      sortLowestMileage: "الأقل أميالاً", sortMostImages: "الأكثر صوراً", sortLeastImages: "الأقل صوراً",
      sortMakeAZ: "الماركة A–Z", sortMakeZA: "الماركة Z–A", price: "السعر", adjustInStore: "تعديل لدى الوكيل",
      year: "السنة", allYears: "كل السنوات", make: "الماركة", allMakes: "كل الماركات", model: "الموديل",
      comingSoon: "قريباً", estPayment: "دفعة تقديرية", paymentDisclaimer: "مثال على ما يصل إلى 12 دفعة شهرية. للعملاء الموافق عليهم فقط.",
      tooltipTitlePrefix: "دفعة شهرية", getPrequalified: "طلب تأهيل مبدئي", noVehicles: "لم يتم العثور على سيارات مطابقة للفلاتر.",
      modalTitle: "البحث في كل السيارات", modalPlaceholder: "ابحث بالموديل أو السنة أو VIN…", modalNoResults: "لا توجد نتائج لـ",
      priceLabel: "السعر", searchOpenLabel: "فتح البحث", filtersModalTitle: "تعديل الفلاتر", applyFilters: "إغلاق",
      minLabel: "الأدنى", maxLabel: "الأعلى", fullDetails: "التفاصيل", automatic: "أوتوماتيك",
      backHome: "العودة للرئيسية", appearance: "مظهر المخزون"
    }
  } as const;

  const text = translations[lang];

  // modal de búsqueda con la lupa
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // modal de filtros para móvil
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const [isSortOpen, setIsSortOpen] = React.useState(false);

  // años únicos
  const years = React.useMemo(() => {
    const set = new Set<number>();
    for (const car of inventory) {
      if (car.year != null) set.add(car.year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [inventory]);

  // marcas únicas
  const makes = React.useMemo(() => {
    const set = new Set<string>();
    for (const car of inventory) {
      if (car.make) set.add(car.make);
    }
    return Array.from(set).sort();
  }, [inventory]);

  // stats de precio para placeholder
  const priceStats = React.useMemo(() => {
    const prices = inventory
      .map((c) => c.price)
      .filter((p): p is number => typeof p === "number" && p > 0);
    if (!prices.length) return { min: 0, max: 0 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [inventory]);

  // Filtrado + orden para el grid principal
  const visible = React.useMemo(() => {
    let cars = [...inventory];

    if (yearFilter !== "ALL") {
      cars = cars.filter((c) => (c.year ?? "").toString() === yearFilter);
    }

    if (makeFilter !== "ALL") {
      cars = cars.filter(
        (c) => c.make.toLowerCase() === makeFilter.toLowerCase()
      );
    }

    if (priceMin != null) {
      cars = cars.filter((c) => (c.price ?? 0) >= priceMin);
    }
    if (priceMax != null) {
      cars = cars.filter((c) => (c.price ?? 0) <= priceMax);
    }

    // helper para valores numéricos
    const num = (n: number | null | undefined) => (typeof n === "number" ? n : 0);

    cars.sort((a, b) => {
      switch (sortBy) {
        case "priceDesc":
          return num(b.price) - num(a.price);
        case "priceAsc":
          return num(a.price) - num(b.price);
        case "yearDesc":
          return num(b.year) - num(a.year);
        case "yearAsc":
          return num(a.year) - num(b.year);
        case "mileageDesc":
          return num(b.mileage) - num(a.mileage);
        case "mileageAsc":
          return num(a.mileage) - num(b.mileage);
        case "photosDesc":
          return (b.photos?.length ?? 0) - (a.photos?.length ?? 0);
        case "photosAsc":
          return (a.photos?.length ?? 0) - (b.photos?.length ?? 0);
        case "makeAsc":
          return (a.make || "").localeCompare(b.make || "");
        case "makeDesc":
          return (b.make || "").localeCompare(a.make || "");
        default:
          return num(b.price) - num(a.price);
      }
    });

    return cars;
  }, [
    inventory,
    yearFilter,
    makeFilter,
    sortBy,
    priceMin,
    priceMax,
  ]);

  // Resultados para el modal de búsqueda
  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return inventory.filter((c) => {
      const haystack = [
        c.title,
        c.year?.toString() ?? "",
        c.make,
        c.model,
        c.vin,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [inventory, searchQuery]);

  // Recomendados por defecto (top 10 por precio)
  const recommended = React.useMemo(() => {
    const cars = [...inventory];
    cars.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return cars.slice(0, 10);
  }, [inventory]);

  const phone = "+1 747-354-4098";
  const whatsappDigits = "17473544098";
  const fullDetails = text.fullDetails;
  function transmissionLabel(value: string) {
    return /\bcvt\b|continu(?:ous|ously)\s+variable|\bautomatic\b|autom[aá]tic[ao]/i.test(value)
      ? text.automatic
      : value;
  }

  return (
    <main data-theme={theme} className="min-h-screen bg-[var(--inv-page)] text-[color:var(--inv-text)] pb-16">
      {/* HEADER */}
      <header className="bg-[var(--inv-page)] text-[color:var(--inv-heading)] transition-colors">
        <div className="mx-auto max-w-7xl px-4">
          {/* Desktop: contact icons left, centered logo, sell CTA right */}
          <div className="hidden min-h-[150px] grid-cols-[1fr_auto_1fr] items-center gap-4 sm:grid">
            <div className="flex items-center justify-start gap-3">
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-transparent"
                aria-label="WhatsApp"
              >
                <img
                  src="/whatsapp-green.png"
                  alt="WhatsApp"
                  className="h-full w-full object-contain"
                />
              </a>

              <a
                href={`tel:${phone.replace(/[^+\\d]/g, "")}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] text-[color:var(--inv-heading)] transition-all duration-300 hover:border-[var(--inv-border-hover)] hover:bg-[var(--inv-hover)]"
                aria-label="Call"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.21a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z"
                  />
                </svg>
              </a>

              <a
                href="https://www.instagram.com/availablehybridrm/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] text-[color:var(--inv-heading)] transition-all duration-300 hover:border-[var(--inv-border-hover)] hover:bg-[var(--inv-hover)]"
                aria-label="Instagram"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                  <path d="M16 11.37a4 4 0 1 1-7.75 1.26 4 4 0 0 1 7.75-1.26z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </div>

            <Link href="/" className="flex items-center justify-center" aria-label="Available Hybrid R&M home">
              <div className="relative h-[132px] w-[420px]">
                <img
                  src="/logo. available hybrid premium.png"
                  alt="Available Hybrid R&M Inc. logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>

            <div className="flex flex-col items-end gap-3">
              <button
                type="button"
                onClick={() => setLanguageOpen(true)}
                className={`${architectsDaughter.className} inline-flex min-h-9 items-center gap-2 text-sm text-[color:var(--inv-heading)] transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
              >
                <span>Language</span>
              </button>

              <button
                type="button"
                onClick={() => setSellOpen(true)}
                className={`${architectsDaughter.className} inline-flex min-h-9 items-center gap-2 text-sm text-[color:var(--inv-heading)] transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
              >
                <span>{text.sellYourCar}</span>
              </button>
            </div>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-1 py-3 sm:hidden">
            <Link href="/" className="flex items-center justify-center" aria-label="Available Hybrid R&M home">
              <div className="relative h-20 w-56">
                <img
                  src="/logo. available hybrid premium.png"
                  alt="Available Hybrid R&M Inc. logo"
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full"
                  aria-label="WhatsApp"
                >
                  <img src="/whatsapp-green.png" alt="WhatsApp" className="h-full w-full object-contain" />
                </a>
                <a
                  href={`tel:${phone.replace(/[^+\\d]/g, "")}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--inv-border)] text-[color:var(--inv-heading)]"
                  aria-label="Call"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.6 2.6a2 2 0 0 1-.45 2.11L8 9.91a16 16 0 0 0 6.09 6.09l1.48-1.21a2 2 0 0 1 2.11-.45c.83.28 1.7.48 2.6.6A2 2 0 0 1 22 16.92z" />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/availablehybridrm/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--inv-border)] text-[color:var(--inv-heading)]"
                  aria-label="Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                    <path d="M16 11.37a4 4 0 1 1-7.75 1.26 4 4 0 0 1 7.75-1.26z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => setLanguageOpen(true)}
                  className={`${architectsDaughter.className} inline-flex min-h-8 items-center gap-1.5 text-xs text-[color:var(--inv-heading)] transition hover:opacity-80`}
                >
                  <span>Language</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSellOpen(true)}
                  className={`${architectsDaughter.className} inline-flex min-h-8 items-center gap-1.5 text-xs text-[color:var(--inv-heading)] transition hover:opacity-80`}
                >
                  <span>{text.sellYourCar}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* LAYOUT PRINCIPAL: sidebar + contenido */}
      <div className="mx-auto flex max-w-6xl gap-6 px-4 pt-6">
        {/* CONTENIDO PRINCIPAL */}
        <section className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              aria-label={text.backHome}
              className="inline-flex h-11 w-11 items-center justify-center text-[color:var(--inv-heading)] transition hover:bg-[var(--inv-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m6-6-6 6 6 6" />
              </svg>
            </Link>
            <div
              role="group"
              aria-label={text.appearance}
              className="inline-flex rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] p-1"
            >
              {(["dark", "light"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={theme === mode}
                  onClick={() => selectTheme(mode)}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${
                    theme === mode
                      ? "border border-[var(--inv-border-strong)] bg-[var(--inv-active)] text-[color:var(--inv-on-active)]"
                      : "border border-transparent text-[color:var(--inv-muted)] hover:bg-[var(--inv-hover)]"
                  }`}
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
                    {mode === "dark" ? (
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />
                    ) : (
                      <>
                        <circle cx="12" cy="12" r="4" />
                        <path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
                      </>
                    )}
                  </svg>
                  {mode === "dark" ? text.dark : text.light}
                </button>
              ))}
            </div>
          </div>

          {/* Search, filters and sort */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setIsSearchOpen(true); setSearchQuery(""); }}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] text-sm text-[color:var(--inv-secondary)] hover:border-[var(--inv-border-hover)] hover:bg-[var(--inv-raised)]"
              aria-label={text.searchOpenLabel}
            >
              🔍
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setIsFiltersOpen(true); setIsSortOpen(false); }}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] px-3 text-xs text-[color:var(--inv-secondary)] hover:border-[var(--inv-border-hover)] hover:bg-[var(--inv-raised)]"
              >
                <span aria-hidden="true">⚙</span>
                <span>{text.filtersLabel}{makeFilter !== "ALL" ? ` · ${makeFilter}` : ""}</span>
              </button>
              <div className="relative z-30">
                <button
                  type="button"
                  onClick={() => setIsSortOpen((open) => !open)}
                  aria-expanded={isSortOpen}
                  aria-haspopup="menu"
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] px-3 text-xs text-[color:var(--inv-secondary)] hover:border-[var(--inv-border-hover)] hover:bg-[var(--inv-raised)]"
                >
                  <span>{text.sort}</span><span aria-hidden="true">⌄</span>
                </button>
                {isSortOpen && (
                  <div role="menu" className="absolute right-0 top-full mt-2 max-h-[60vh] w-52 overflow-y-auto rounded-xl border border-[var(--inv-border-strong)] bg-[var(--inv-surface)] py-1 shadow-2xl">
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "priceDesc"} onClick={() => { setSortBy("priceDesc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "priceDesc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortHighestPrice}</span>{sortBy === "priceDesc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "priceAsc"} onClick={() => { setSortBy("priceAsc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "priceAsc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortLowestPrice}</span>{sortBy === "priceAsc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "yearDesc"} onClick={() => { setSortBy("yearDesc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "yearDesc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortNewestYear}</span>{sortBy === "yearDesc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "yearAsc"} onClick={() => { setSortBy("yearAsc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "yearAsc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortOldestYear}</span>{sortBy === "yearAsc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "mileageDesc"} onClick={() => { setSortBy("mileageDesc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "mileageDesc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortHighestMileage}</span>{sortBy === "mileageDesc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "mileageAsc"} onClick={() => { setSortBy("mileageAsc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "mileageAsc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortLowestMileage}</span>{sortBy === "mileageAsc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "photosDesc"} onClick={() => { setSortBy("photosDesc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "photosDesc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortMostImages}</span>{sortBy === "photosDesc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "photosAsc"} onClick={() => { setSortBy("photosAsc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "photosAsc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortLeastImages}</span>{sortBy === "photosAsc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "makeAsc"} onClick={() => { setSortBy("makeAsc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "makeAsc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortMakeAZ}</span>{sortBy === "makeAsc" && <span aria-hidden="true">✓</span>}
                    </button>
                    <button type="button" role="menuitemradio" aria-checked={sortBy === "makeDesc"} onClick={() => { setSortBy("makeDesc"); setIsSortOpen(false); }} className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-xs hover:bg-[var(--inv-hover)] ${sortBy === "makeDesc" ? "text-[color:var(--inv-heading)]" : "text-[color:var(--inv-secondary)]"}`}>
                      <span>{text.sortMakeZA}</span>{sortBy === "makeDesc" && <span aria-hidden="true">✓</span>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GRID DE VEHÍCULOS */}
          <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3">
            {visible.length === 0 ? (
              <p className="text-sm text-[color:var(--inv-muted)]">{text.noVehicles}</p>
            ) : (
              visible.map((car) => {
                const mainPhoto = car.studioCover || car.photos[0] || "/placeholder-car.jpg";
                const hoverPhoto =
                  car.studioCover || car.cardHoverPhoto === "none"
                    ? null
                    : car.cardHoverPhoto || car.photos[1] || null;
                const priceLabel =
                  car.price != null
                    ? `$${car.price.toLocaleString()}`
                    : "Call for price";

                const descriptionExcerpt = inventoryExcerpt(car);
                return (
                  <Link
                    key={car.id}
                    href={`/${encodeURIComponent(car.id)}`}
                    aria-label={`${fullDetails}: ${car.title}`}
                    className="group flex min-w-0 flex-col bg-transparent overflow-visible focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                  >
                    {/* Fotos originales sin etiquetas */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--inv-surface)]">
                      <Image
                        src={mainPhoto}
                        alt={car.title}
                        fill
                        sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, 33vw"
                        className="object-cover object-center transition duration-700 group-hover:scale-[1.025]"
                      />
                      {hoverPhoto && (
                        <Image
                          src={hoverPhoto}
                          alt=""
                          fill
                          sizes="(max-width: 639px) 100vw, (max-width: 767px) 50vw, 33vw"
                          className="object-cover object-center opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        />
                      )}
                      <div className="vehicle-details-overlay pointer-events-none absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                        <span className="inline-flex min-h-11 items-center gap-3 border border-white px-6 py-3 text-sm font-semibold tracking-wide text-white">
                          {fullDetails}
                        </span>
                      </div>
                    </div>

                    {/* Info principal */}
                    <div className="flex flex-1 flex-col pb-3 pt-4 text-xs">
                      <h3 className="text-base font-semibold uppercase leading-snug tracking-wide text-[color:var(--inv-heading)] lg:text-lg">
                        {[car.make, car.model, car.year].filter(Boolean).join(" ") || car.title}
                      </h3>

                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-[color:var(--inv-muted)]">
                        {car.mileage != null && (
                          <span>{car.mileage.toLocaleString()} mi</span>
                        )}
                        {car.fuel && <span>• {car.fuel}</span>}
                        {car.transmission && <span>• {transmissionLabel(car.transmission)}</span>}
                        {car.exterior && <span>• {car.exterior}</span>}
                      </div>

                      {descriptionExcerpt && (
                        <p className="mt-3 text-sm leading-6 text-[color:var(--inv-secondary)]">
                          {descriptionExcerpt}
                        </p>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 py-3">
                      <p className="text-lg font-semibold text-[color:var(--inv-heading)]">
                        {priceLabel}
                      </p>
                      <span className="vehicle-details-touch items-center gap-2 text-sm font-medium text-[color:var(--inv-heading)]">
                        {fullDetails}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>

      {isSortOpen && (
        <button type="button" aria-label="Close sort" className="fixed inset-0 z-20 cursor-default" onClick={() => setIsSortOpen(false)} />
      )}

      {/* MODAL DE FILTROS */}
      {isFiltersOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 sm:pt-16">
          <div className="w-full max-w-md rounded-2xl border border-[var(--inv-border)] bg-[var(--inv-modal)] shadow-xl">
            {/* header */}
            <div className="flex items-center justify-between border-b border-[var(--inv-border)] px-4 py-3">
              <p className="text-xs font-medium text-[color:var(--inv-secondary)]">
                {text.filtersModalTitle}
              </p>
              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                className="text-sm text-[color:var(--inv-muted)] hover:text-[color:var(--inv-text)]"
              >
                ✕
              </button>
            </div>

            {/* contenido filtros */}
            <div className="space-y-4 px-4 py-4 text-[13px]">
              {/* Price */}
              <div className="rounded-lg border border-[var(--inv-border)] bg-[var(--inv-page)] px-3 py-3">
                <div className="flex items-center justify-between">
                  <span>{text.price}</span>
                  <span className="text-[11px] text-[color:var(--inv-muted-low)]">
                    {text.adjustInStore}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex-1 rounded-md border border-[var(--inv-border)] bg-[var(--inv-black70)] px-2 py-1.5">
                    <p className="text-[10px] text-[color:var(--inv-muted-low)]">
                      {text.minLabel}
                    </p>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={priceMin ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return setPriceMin(null);
                        const n = Number(v);
                        if (!Number.isNaN(n)) setPriceMin(n);
                      }}
                      placeholder={
                        priceStats.min ? priceStats.min.toString() : "0"
                      }
                      className="w-full bg-transparent text-[color:var(--inv-text)] outline-none text-[11px]"
                    />
                  </div>
                  <div className="flex-1 rounded-md border border-[var(--inv-border)] bg-[var(--inv-black70)] px-2 py-1.5 text-right">
                    <p className="text-[10px] text-[color:var(--inv-muted-low)]">
                      {text.maxLabel}
                    </p>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={priceMax ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) return setPriceMax(null);
                        const n = Number(v);
                        if (!Number.isNaN(n)) setPriceMax(n);
                      }}
                      placeholder={
                        priceStats.max ? priceStats.max.toString() : "30000"
                      }
                      className="w-full bg-transparent text-[color:var(--inv-text)] outline-none text-[11px] text-right"
                    />
                  </div>
                </div>
              </div>

              {/* Year */}
              <div className="rounded-lg border border-[var(--inv-border)] bg-[var(--inv-page)] px-3 py-3">
                <div className="flex items-center justify-between">
                  <span>{text.year}</span>
                  <span className="text-xs text-[color:var(--inv-muted-low)]">
                    {yearFilter === "ALL" ? text.allYears : yearFilter}
                  </span>
                </div>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="mt-2 w-full rounded-md border border-[var(--inv-border)] bg-[var(--inv-black70)] px-2 py-1.5 text-[11px] text-[color:var(--inv-text)] outline-none focus:border-[var(--inv-border-hover)]"
                >
                  <option value="ALL">{text.allYears}</option>
                  {years.map((y) => (
                    <option key={y} value={y.toString()}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Make */}
              <div className="rounded-lg border border-[var(--inv-border)] bg-[var(--inv-page)] px-3 py-3">
                <div className="flex items-center justify-between">
                  <span>{text.make}</span>
                  <span className="text-xs text-[color:var(--inv-muted-low)]">
                    {makeFilter === "ALL" ? text.allMakes : makeFilter}
                  </span>
                </div>
                <select
                  value={makeFilter}
                  aria-label={text.make}
                  onChange={(e) => setMakeFilter(e.target.value)}
                  className="mt-2 w-full rounded-md border border-[var(--inv-border)] bg-[var(--inv-black70)] px-2 py-1.5 text-[11px] text-[color:var(--inv-text)] outline-none focus:border-[var(--inv-border-hover)]"
                >
                  <option value="ALL">{text.allMakes}</option>
                  {makes.map((mk) => (
                    <option key={mk} value={mk}>
                      {mk}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model info */}
              <div className="rounded-lg border border-[var(--inv-border)] bg-[var(--inv-page)] px-3 py-2">
                <div className="flex items-center justify-between">
                  <span>{text.model}</span>
                  <span className="text-xs text-[color:var(--inv-muted-low)]">
                    {text.comingSoon}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFiltersOpen(false)}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[var(--inv-active)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--inv-on-active)] hover:bg-[var(--inv-active-hover)]"
              >
                {text.applyFilters}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BÚSQUEDA (lupa) */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-16">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--inv-border)] bg-[var(--inv-modal)] shadow-xl">
            {/* header modal */}
            <div className="flex items-center justify-between border-b border-[var(--inv-border)] px-4 py-3">
              <p className="text-xs font-medium text-[color:var(--inv-secondary)]">
                {text.modalTitle}
              </p>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-sm text-[color:var(--inv-muted)] hover:text-[color:var(--inv-text)]"
              >
                ✕
              </button>
            </div>

            {/* input búsqueda */}
            <div className="px-4 py-3">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-[color:var(--inv-muted-low)]">
                  🔍
                </span>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={text.modalPlaceholder}
                  className="w-full rounded-full border border-[var(--inv-border)] bg-[var(--inv-surface)] px-3 py-2 pl-7 text-sm text-[color:var(--inv-text)] outline-none placeholder:text-[color:var(--inv-muted-low)] focus:border-[var(--inv-border-hover)]"
                />
              </div>
            </div>

            {/* resultados */}
            <div className="max-h-[60vh] overflow-y-auto px-2 pb-3">
              {searchQuery.trim() && searchResults.length === 0 && (
                <p className="px-2 py-2 text-xs text-[color:var(--inv-muted-low)]">
                  {text.modalNoResults} “{searchQuery.trim()}”.
                </p>
              )}

              {(searchQuery.trim() ? searchResults : recommended).map((car) => {
                const thumb = car.photos[0] ?? "/placeholder-car.jpg";
                const price =
                  car.price != null
                    ? `$${car.price.toLocaleString()}`
                    : lang === "en"
                    ? "Call for price"
                    : "Llama para precio";

                return (
                  <Link
                    key={car.id}
                    href={`/${encodeURIComponent(car.id)}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 text-xs text-[color:var(--inv-text)] hover:bg-[var(--inv-raised)]"
                  >
                    <div className="h-14 w-20 overflow-hidden rounded bg-[var(--inv-raised)]">
                      <img
                        src={thumb}
                        alt={car.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] text-[color:var(--inv-muted)]">
                        {car.year} {car.make}
                      </p>
                      <p className="text-sm font-semibold">
                        {car.model || car.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[color:var(--inv-muted-low)]">
                        {car.vin ? `VIN ${car.vin}` : ""}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-semibold text-[color:var(--inv-accent)]">
                      {price}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {languageOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Choose language"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLanguageOpen(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-neutral-950 text-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/10 px-5 py-5 sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Language</p>
                <h2 className="mt-1 text-2xl font-semibold">Choose your language</h2>
                <p className="mt-1 text-sm text-white/50">Select the language you prefer.</p>
              </div>
              <button
                type="button"
                onClick={() => setLanguageOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-lg text-white/70 hover:border-white/35 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5">
              {[
                { code: "en", label: "English", active: true },
                { code: "es", label: "Español", active: true },
                { code: "zh", label: "中文", active: true },
                { code: "ko", label: "한국어", active: true },
                { code: "vi", label: "Tiếng Việt", active: true },
                { code: "hy", label: "Հայերեն", active: true },
                { code: "tl", label: "Tagalog", active: true },
                { code: "ru", label: "Русский", active: true },
                { code: "ar", label: "العربية", active: true },
              ].map((option) => (
                <button
                  key={option.code}
                  type="button"
                  disabled={!option.active}
                  onClick={() => {
                    setLang(option.code as SiteLanguage);
                    setLanguageOpen(false);
                  }}
                  className={`flex min-h-12 items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                    option.active
                      ? "border-white/15 bg-white/[0.04] text-white hover:border-white/30 hover:bg-white/[0.08]"
                      : "cursor-not-allowed border-white/10 bg-white/[0.02] text-white/35"
                  }`}
                >
                  <span>{option.label}</span>
                  {lang === option.code ? <span aria-hidden="true">✓</span> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center border-t border-[var(--inv-border-subtle)] pt-7">
        <button
          type="button"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
            })
          }
          className="inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-medium text-[color:var(--inv-secondary)] transition hover:text-[color:var(--inv-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m-6 6 6-6 6 6" />
          </svg>
          Back to top
        </button>
      </div>

      <SellYourCarModal
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        lang={lang}
        whatsappDigits={whatsappDigits}
      />

      <style jsx>{`
        main {
          color-scheme: dark;
          --inv-page: #050505;
          --inv-text: #f5f5f5;
          --inv-heading: #fafafa;
          --inv-secondary: #d4d4d4;
          --inv-muted: #a3a3a3;
          --inv-muted-low: #737373;
          --inv-surface: #0a0a0a;
          --inv-raised: #171717;
          --inv-hover: #262626;
          --inv-card: rgba(23, 23, 23, .7);
          --inv-modal: rgba(10, 10, 10, .95);
          --inv-black80: rgba(0, 0, 0, .8);
          --inv-black70: rgba(0, 0, 0, .7);
          --inv-active: #0a0a0a;
          --inv-active-hover: #171717;
          --inv-on-active: #f5f5f5;
          --inv-border-subtle: #171717;
          --inv-border: #262626;
          --inv-border-strong: #404040;
          --inv-border-hover: #737373;
          --inv-accent: #34d399;
          --inv-card-shadow: 0 10px 30px rgba(0, 0, 0, .65);
        }
        main[data-theme="light"] {
          color-scheme: light;
          --inv-page: #fff;
          --inv-text: #171717;
          --inv-heading: #111;
          --inv-secondary: #404040;
          --inv-muted: #5c5c5c;
          --inv-muted-low: #6b6b6b;
          --inv-surface: #fff;
          --inv-raised: #f5f5f5;
          --inv-hover: #ebebeb;
          --inv-card: #fff;
          --inv-modal: #fff;
          --inv-black80: #f7f7f7;
          --inv-black70: #fafafa;
          --inv-active: #fff;
          --inv-active-hover: #f5f5f5;
          --inv-on-active: #171717;
          --inv-border-subtle: #e5e5e5;
          --inv-border: #dedede;
          --inv-border-strong: #ccc;
          --inv-border-hover: #737373;
          --inv-accent: #047857;
          --inv-card-shadow: 0 6px 22px rgba(0, 0, 0, .06);
        }
        header {
          color-scheme: dark;
        }
        .vehicle-details-touch {
          display: none;
        }
        @media (hover: none) {
          .vehicle-details-overlay {
            display: none;
          }
          .vehicle-details-touch {
            display: inline-flex;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .vehicle-details-overlay {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<InventoryProps> = async () => {
  const data = await getInventory();

  const inventory: Vehicle[] = data.map((c) => {
    const photoStrings = Object.entries(c as any)
      .filter(([k, v]) => k.toLowerCase().startsWith("photo") && v)
      .map(([, v]) => String(v));

    return {
      id: String(c.id),
      title: `${c.year ?? ""} ${c.make ?? ""} ${c.model ?? ""}`.trim(),
      year: c.year ? Number(c.year) : null,
      make: c.make ?? "",
      model: c.model ?? "",
      mileage: c.mileage ? Number(c.mileage) : null,
      price: c.price ? Number(c.price) : null,
      vin: c.vin ?? "",
      fuel: c.fuel ?? "",
      transmission: c.transmission ?? "",
      exterior: c.exterior ?? "",
      photos: parsePhotos(photoStrings.join(" ")),
      description: (c as any).description ?? "",
      cardHoverPhoto: (c as any).cardHoverPhoto ?? "",
      studioCover: (c as any).studioCover ?? "",
    };
  });

  return {
    props: { inventory },
  };
};

