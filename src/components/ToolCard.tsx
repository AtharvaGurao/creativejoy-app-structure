interface ToolCardProps {
  title: string;
  description: string;
  icon?: string;
}

const ToolCard = ({ title, description, icon }: ToolCardProps) => {
  return (
    <div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

export default ToolCard;
