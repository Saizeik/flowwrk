interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  WISHLIST: "bg-gray-100 text-gray-800 border-gray-300",
  APPLIED: "bg-blue-100 text-blue-800 border-blue-300",
  ONLINE_ASSESSMENT: "bg-purple-100 text-purple-800 border-purple-300",
  INTERVIEWED: "bg-yellow-100 text-yellow-800 border-yellow-300",
  OFFER: "bg-green-100 text-green-800 border-green-300",
  REJECTED: "bg-red-100 text-red-800 border-red-300",
  ACCEPTED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  DECLINED: "bg-orange-100 text-orange-800 border-orange-300",
  GHOSTED: "bg-slate-100 text-slate-800 border-slate-300",
};

const STATUS_LABELS: Record<string, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  ONLINE_ASSESSMENT: "Online Assessment",
  INTERVIEWED: "Interviewed",
  OFFER: "Offer",
  REJECTED: "Rejected",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  GHOSTED: "Ghosted",
};

export default function StatusBadge({
  status,
  className = "",
}: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.WISHLIST;
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {label}
    </span>
  );
}
