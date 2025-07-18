declare namespace JSX {
  interface IntrinsicElements {
    svg: React.SVGProps<SVGSVGElement>;
    path: React.SVGProps<SVGPathElement>;
    ul: React.HTMLAttributes<HTMLUListElement>;
    li: React.HTMLAttributes<HTMLLIElement>;
    span: React.HTMLAttributes<HTMLSpanElement>;
    button: React.ButtonHTMLAttributes<HTMLButtonElement>;
    div: React.HTMLAttributes<HTMLDivElement>;
  }
} 