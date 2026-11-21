export const A = ({ open }) => <div onClick={(event) => { const link = event.target.closest("a"); if (link) open(link.href); }}>{"Results"}</div>;
