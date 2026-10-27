import { InputHTMLAttributes } from "react";

type Props = { label: string } & InputHTMLAttributes<HTMLInputElement>;

export default function Field({ label, ...props }: Props) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}