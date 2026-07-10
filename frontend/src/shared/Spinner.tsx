interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
}

export default function Spinner({ size = 'md', text, fullPage = false }: SpinnerProps) {
  const sizeClass = `spinner spinner-${size}`;

  const content = (
    <div className="spinner-wrapper">
      <div className={sizeClass}>
        <div className="spinner-blade" />
        <div className="spinner-blade" />
        <div className="spinner-blade" />
        <div className="spinner-blade" />
        <div className="spinner-blade" />
        <div className="spinner-blade" />
        <div className="spinner-blade" />
        <div className="spinner-blade" />
        <div className="spinner-blade" />
        <div className="spinner-blade" />
        <div className="spinner-blade" />
        <div className="spinner-blade" />
      </div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );

  if (fullPage) {
    return <div className="spinner-fullpage">{content}</div>;
  }

  return content;
}
