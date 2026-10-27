type Props = {
  qty: number;
  onChange: (qty: number) => void;
};

export default function QtyStepper({ qty, onChange }: Props) {
  return (
    <div className="inline-flex items-center rounded-full border border-emerald-600 text-emerald-700">
      <button type="button" aria-label="Decrease" onClick={() => onChange(qty - 1)}
        className="h-8 w-8 text-lg leading-none hover:bg-emerald-50 rounded-l-full">
        −
      </button>
      <span className="min-w-6 text-center text-sm font-semibold">{qty}</span>
      <button type="button" aria-label="Increase" onClick={() => onChange(qty + 1)}
        className="h-8 w-8 text-lg leading-none hover:bg-emerald-50 rounded-r-full">
        +
      </button>
    </div>
  );
}