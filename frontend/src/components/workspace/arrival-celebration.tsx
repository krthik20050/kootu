export function ArrivalCelebration() {
  return <div className="arrival-confetti" aria-hidden="true">
    {Array.from({ length: 18 }, (_, index) => <i key={index} style={{
      left: `${8 + (index * 37 % 86)}%`,
      animationDelay: `${(index % 6) * 70}ms`,
      background: ["#437053", "#dba75e", "#b6c2a5"][index % 3],
      rotate: `${index * 31}deg`,
    }} />)}
  </div>;
}
