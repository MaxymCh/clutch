export const StepTitle = ({ title, sub }: { title: string; sub: string }) => (
  <>
    <h2 className="text-[26px] leading-tight font-semibold tracking-tighter text-ink">{title}</h2>
    <p className="mt-2.5 mb-5 text-[13px] leading-snug font-medium text-dim">{sub}</p>
  </>
);
