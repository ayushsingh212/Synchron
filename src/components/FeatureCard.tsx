import React from "react";

type Props = {
  title: string;
  description: string;
  iconColor?: string;
};

const FeatureCard: React.FC<Props> = ({
  title,
  description,
  iconColor = "#ffffff",
}) => {
  return (
    <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-lg h-full hover:scale-105 transition-transform duration-300">
      
      <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-white/20">
        <svg
          width="24"
          height="24"
          stroke={iconColor}
          fill="none"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9" />
        </svg>
      </div>

      <h3 className="font-semibold text-lg mb-2">
        {title}
      </h3>

      <p className="text-sm text-blue-100 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
