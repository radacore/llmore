'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'bordered';
}

interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({
  children,
  className = '',
  variant = 'default',
}: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-pure-white ${
        variant === 'bordered'
          ? 'border-2 border-washed-black/10'
          : 'border border-washed-black/10 shadow-none'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className = '',
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-start justify-between p-6 pb-0 ${className}`}
    >
      <div>
        <h3 className="text-lg font-semibold text-washed-black">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-dim-grey">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={`px-6 py-4 border-t border-washed-black/10 bg-pearl rounded-b-2xl ${className}`}
    >
      {children}
    </div>
  );
}
