import React, { useState } from "react";

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<null | "idle" | "sending" | "sent" | "error">(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      // TODO: wire to real API
      await new Promise((r) => setTimeout(r, 600));
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h2 className="text-2xl font-bold text-center mb-6">Contact Us</h2>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Your name"
          className="border rounded px-3 py-2"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          type="email"
          placeholder="Your email"
          className="border rounded px-3 py-2"
        />
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Message"
          rows={6}
          className="border rounded px-3 py-2"
          required
        />

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={status === "sending"}
            className="bg-brand-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {status === "sending" ? "Sending…" : "Send Message"}
          </button>

          {status === "sent" && <span className="text-green-600">Thanks — we will reply soon.</span>}
          {status === "error" && <span className="text-red-600">Something went wrong.</span>}
        </div>
      </form>
    </section>
  );
};

export default Contact;
