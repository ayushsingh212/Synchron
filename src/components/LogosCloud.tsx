import React from "react";

const logos = ["/images/logo1.png", "/images/logo2.png", "/images/logo3.png", "/images/logo4.png"];

const LogosCloud: React.FC = () => {
  return (
    <section className="py-8 border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          {logos.map((src, idx) => (
            <div key={idx} className="p-4 bg-white rounded-md shadow-sm">
              <img src={src} alt={`logo-${idx}`} className="h-10 object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(LogosCloud);
