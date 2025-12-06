import React from "react";

type Props = {
  title: string;
  description: string;
  iconColor: string;
};

const FeatureCard: React.FC<Props> = ({ title, description, iconColor }) => {
  return (
    <div className=" text-white rounded-2xl p-6 shadow-lg h-full bg-blue-600">
      <div className="text-3xl mb-4">
        <svg width="28" height="28" stroke={iconColor}>
          <circle cx="14" cy="14" r="12" fill="none" strokeWidth="2" />
        </svg>
      </div>
    Ayush Thakur
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-slate-600 text-sm">Hi   {description}</p>
    </div>
  );
};

export default FeatureCard;
