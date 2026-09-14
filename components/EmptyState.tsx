import Link from "next/link";

export default function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="card flex flex-col items-start gap-3 border-dashed">
      <div>
        <p className="text-sm font-semibold text-ink-800">{title}</p>
        <p className="mt-1 text-sm text-ink-400">{body}</p>
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
