export const A = ({ go }) => <button type="button" onClick={go}>Open project</button>;
export const B = ({ go, onKey }) => <div role="button" tabIndex={0} onClick={go} onKeyDown={onKey}>Open</div>;
export const C = () => <div className="content" onClick={(e) => e.stopPropagation()}>Body</div>;
