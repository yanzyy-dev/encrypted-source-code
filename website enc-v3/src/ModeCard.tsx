type ModeCardProps = {
  name: string;
  description: string;
  active?: boolean;
};

export function ModeCard({name,description,active=false}: ModeCardProps) {
  return (
    <button className={active ? "mode active" : "mode"}>
      <b>{name}</b>
      <span>{description}</span>
    </button>
  );
}
