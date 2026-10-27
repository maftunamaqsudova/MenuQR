"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

export type Lang = "uz" | "ru" | "en";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "uz", label: "O'zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" },
];

const STORAGE_KEY = "qrmenu_lang";

const en = {
  notFoundTitle: "Restaurant not found",
  notFoundText: "Please check the link or scan the QR code again.",
  loadingMenu: "Loading menu...",
  loading: "Loading...",
  yourOrder: "Your order",
  track: "Track",
  menuEmpty: "The menu is empty for now. Please check back soon.",
  viewOrder: "View order",
  add: "Add",
  outOfStock: "Out of stock",
  table: "Table",
  cartTitle: "Your order",
  close: "Close",
  cartEmpty: "Your cart is empty.",
  notePlaceholder: "Note (e.g. no onions)",
  yourName: "Your name",
  tableNumber: "Table number",
  tableFromQr: "Filled in from your table's QR code.",
  orderNote: "Note for the whole order (optional)",
  total: "Total",
  placeOrder: "Place order",
  sending: "Sending...",
  loadingOrder: "Loading your order...",
  orderPlaced: "Order placed",
  orderCancelled: "Order cancelled",
  stepSent: "Sent",
  stepPreparing: "Preparing",
  stepReady: "Ready",
  stepServed: "Served",
  msgNew: "Your order was sent. Waiting for the restaurant to accept it.",
  msgPreparing: "Your order is being prepared.",
  msgReady: "Your order is ready!",
  msgServed: "Served. Enjoy your meal!",
  msgCancelled: "This order was cancelled. Please ask the staff for details.",
  note: "Note",
  orderNoteLabel: "Order note",
  backToMenu: "Back to menu",
  orderMore: "Order more",
  status_New: "New",
  status_Preparing: "Preparing",
  status_Ready: "Ready",
  status_Served: "Served",
  status_Cancelled: "Cancelled",
  findRestaurant: "Find a restaurant",
  homeSubtitle: "Browse the menu and order straight from your phone.",
  searchPlaceholder: "Search by restaurant name",
  noRestaurants: "No restaurants yet.",
  noResultsFor: "No restaurants found for",
  searching: "Searching...",
  restaurantsWord: "restaurants",
  ownerQ: "Own a restaurant?",
  createMenu: "Create your digital menu",
  login: "Log in",
  getStarted: "Get started",
  dashboard: "Dashboard",
} as const;

export type TKey = keyof typeof en;
type Dict = Record<TKey, string>;

const uz: Dict = {
  notFoundTitle: "Restoran topilmadi",
  notFoundText: "Havolani tekshiring yoki QR kodni qayta skanerlang.",
  loadingMenu: "Menyu yuklanmoqda...",
  loading: "Yuklanmoqda...",
  yourOrder: "Sizning buyurtmangiz",
  track: "Kuzatish",
  menuEmpty: "Hozircha menyu bo'sh. Keyinroq qaytib ko'ring.",
  viewOrder: "Buyurtmani ko'rish",
  add: "Qo'shish",
  outOfStock: "Tugagan",
  table: "Stol",
  cartTitle: "Sizning buyurtmangiz",
  close: "Yopish",
  cartEmpty: "Savatingiz bo'sh.",
  notePlaceholder: "Izoh (masalan, piyozsiz)",
  yourName: "Ismingiz",
  tableNumber: "Stol raqami",
  tableFromQr: "Stolingizdagi QR koddan avtomatik to'ldirildi.",
  orderNote: "Butun buyurtma uchun izoh (ixtiyoriy)",
  total: "Jami",
  placeOrder: "Buyurtma berish",
  sending: "Yuborilmoqda...",
  loadingOrder: "Buyurtmangiz yuklanmoqda...",
  orderPlaced: "Buyurtma qabul qilindi",
  orderCancelled: "Buyurtma bekor qilindi",
  stepSent: "Yuborildi",
  stepPreparing: "Tayyorlanmoqda",
  stepReady: "Tayyor",
  stepServed: "Berildi",
  msgNew: "Buyurtmangiz yuborildi. Restoran qabul qilishini kuting.",
  msgPreparing: "Buyurtmangiz tayyorlanmoqda.",
  msgReady: "Buyurtmangiz tayyor!",
  msgServed: "Berildi. Yoqimli ishtaha!",
  msgCancelled: "Buyurtma bekor qilindi. Tafsilotlar uchun xodimlardan so'rang.",
  note: "Izoh",
  orderNoteLabel: "Buyurtma izohi",
  backToMenu: "Menyuga qaytish",
  orderMore: "Yana buyurtma berish",
  status_New: "Yangi",
  status_Preparing: "Tayyorlanmoqda",
  status_Ready: "Tayyor",
  status_Served: "Berildi",
  status_Cancelled: "Bekor qilindi",
  findRestaurant: "Restoran toping",
  homeSubtitle: "Menyuni ko'ring va telefoningizdan buyurtma bering.",
  searchPlaceholder: "Restoran nomi bo'yicha qidirish",
  noRestaurants: "Hozircha restoranlar yo'q.",
  noResultsFor: "Hech narsa topilmadi:",
  searching: "Qidirilmoqda...",
  restaurantsWord: "ta restoran",
  ownerQ: "Restoraningiz bormi?",
  createMenu: "Raqamli menyu yarating",
  login: "Kirish",
  getStarted: "Boshlash",
  dashboard: "Boshqaruv paneli",
};

const ru: Dict = {
  notFoundTitle: "Ресторан не найден",
  notFoundText: "Проверьте ссылку или отсканируйте QR-код ещё раз.",
  loadingMenu: "Загрузка меню...",
  loading: "Загрузка...",
  yourOrder: "Ваш заказ",
  track: "Следить",
  menuEmpty: "Меню пока пусто. Загляните позже.",
  viewOrder: "Посмотреть заказ",
  add: "Добавить",
  outOfStock: "Нет в наличии",
  table: "Стол",
  cartTitle: "Ваш заказ",
  close: "Закрыть",
  cartEmpty: "Корзина пуста.",
  notePlaceholder: "Комментарий (например, без лука)",
  yourName: "Ваше имя",
  tableNumber: "Номер стола",
  tableFromQr: "Заполнено из QR-кода вашего стола.",
  orderNote: "Комментарий ко всему заказу (необязательно)",
  total: "Итого",
  placeOrder: "Оформить заказ",
  sending: "Отправка...",
  loadingOrder: "Загрузка заказа...",
  orderPlaced: "Заказ принят",
  orderCancelled: "Заказ отменён",
  stepSent: "Отправлен",
  stepPreparing: "Готовится",
  stepReady: "Готов",
  stepServed: "Подан",
  msgNew: "Заказ отправлен. Ждём подтверждения ресторана.",
  msgPreparing: "Ваш заказ готовится.",
  msgReady: "Ваш заказ готов!",
  msgServed: "Подано. Приятного аппетита!",
  msgCancelled: "Заказ отменён. Уточните детали у персонала.",
  note: "Комментарий",
  orderNoteLabel: "Комментарий к заказу",
  backToMenu: "Назад в меню",
  orderMore: "Заказать ещё",
  status_New: "Новый",
  status_Preparing: "Готовится",
  status_Ready: "Готов",
  status_Served: "Подан",
  status_Cancelled: "Отменён",
  findRestaurant: "Найдите ресторан",
  homeSubtitle: "Смотрите меню и заказывайте прямо с телефона.",
  searchPlaceholder: "Поиск по названию ресторана",
  noRestaurants: "Ресторанов пока нет.",
  noResultsFor: "Ничего не найдено:",
  searching: "Поиск...",
  restaurantsWord: "ресторанов",
  ownerQ: "Есть ресторан?",
  createMenu: "Создайте цифровое меню",
  login: "Войти",
  getStarted: "Начать",
  dashboard: "Панель управления",
};

const dicts: Record<Lang, Dict> = { en, uz, ru };

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: TKey) => string };
const I18nContext = createContext<Ctx | null>(null);

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "uz" || saved === "ru" || saved === "en") return saved;
  } catch {
    /* storage may be blocked */
  }
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith("ru")) return "ru";
  if (nav.startsWith("en")) return "en";
  return "uz";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");

  useEffect(() => {
    setLangState(detect());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: TKey) => dicts[lang][key], [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}