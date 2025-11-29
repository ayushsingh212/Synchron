import {
  FaTruck,
  FaCreditCard,
  FaTags,
  FaImage,
  FaPencilAlt,
  FaShoppingCart,
} from "react-icons/fa";

const services = [
  {
    icon: <FaPencilAlt size={26} />,
    title: "Custom Invitation Cards",
    desc: "Design premium luxury cards for weddings, birthdays & special events.",
  },
  {
    icon: <FaImage size={26} />,
    title: "Preview Before Ordering",
    desc: "See high-quality previews before confirming your order.",
  },
  {
    icon: <FaTruck size={26} />,
    title: "Pan-India Delivery",
    desc: "Safe packaging & on-time delivery across India.",
  },
  {
    icon: <FaShoppingCart size={26} />,
    title: "Smooth Shopping Experience",
    desc: "Simple, fast & modern Flipkart-style shopping flow.",
  },
  {
    icon: <FaCreditCard size={26} />,
    title: "Multiple Payment Options",
    desc: "UPI, cards, wallets & secure payment integrations.",
  },
  {
    icon: <FaTags size={26} />,
    title: "Bulk Order Discounts",
    desc: "Get special discounts on wholesale & bulk orders.",
  },
];

export default function OurServices() {
  return (
    <section className="py-20 bg-cream relative">
      {/* Decorative gold fade top */}
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-gold/30 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-neutral text-center mb-14 heading-underline">
          Our Services
        </h2>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="
                bg-white 
                border border-gold/30 
                rounded-xl-2 
                shadow-card-soft 
                p-8 
                transition-all 
                duration-300 
                hover:shadow-glow-gold 
                hover:-translate-y-1 
                animate-float
              "
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              <div className="text-gold mb-4">{service.icon}</div>

              <h3 className="text-xl font-heading font-semibold text-neutral mb-2">
                {service.title}
              </h3>

              <p className="text-neutral-light text-sm leading-relaxed">
                {service.desc}
              </p>

              {/* Gold accent underline */}
              <div className="mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-gold to-gold-dark opacity-80"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom soft fade */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gold/20 to-transparent pointer-events-none" />
    </section>
  );
}
