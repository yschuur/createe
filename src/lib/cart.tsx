import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  variantId: string;
  productSlug: string;
  name: string;
  variantLabel: string;
  price: number;
  image?: string;
  quantity: number;
  maxQuantity?: number | null;
};

export type CartDiscount = { code: string; type: string; value: number; label: string };

type CartCtx = {
  discount: CartDiscount | null;
  setDiscount: (d: CartDiscount | null) => void;
  items: CartItem[];
  add: (item: CartItem) => void;
  update: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (o: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "createe-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [discount, setDiscountState] = useState<CartDiscount | null>(null);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY + "-discount"); if (raw) setDiscountState(JSON.parse(raw)); } catch { /* ignore */ }
  }, []);
  const setDiscount = (d: CartDiscount | null) => {
    setDiscountState(d);
    if (d) localStorage.setItem(KEY + "-discount", JSON.stringify(d)); else localStorage.removeItem(KEY + "-discount");
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const clamp = (q: number, max?: number | null) => Math.max(1, max != null ? Math.min(q, max) : q);

  const value: CartCtx = {
    discount,
    setDiscount,
    items,
    add: (item) =>
      setItems((prev) => {
        const ex = prev.find((i) => i.variantId === item.variantId);
        if (ex) return prev.map((i) => (i.variantId === item.variantId ? { ...i, quantity: clamp(i.quantity + item.quantity, item.maxQuantity) } : i));
        return [...prev, { ...item, quantity: clamp(item.quantity, item.maxQuantity) }];
      }),
    update: (id, q) => setItems((prev) => prev.map((i) => (i.variantId === id ? { ...i, quantity: clamp(q, i.maxQuantity) } : i))),
    remove: (id) => setItems((prev) => prev.filter((i) => i.variantId !== id)),
    clear: () => { setItems([]); setDiscount(null); },
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.quantity * i.price, 0),
    open,
    setOpen,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
