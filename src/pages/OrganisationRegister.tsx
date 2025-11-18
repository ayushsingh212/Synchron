import React, { useState, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, Lock, ImageIcon } from "lucide-react";

type FormState = {
  name: string;
  email: string;
  password: string;
  type: string;
  logo?: File | null;
};

const OrganisationRegister: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    type: "",
    logo: null,
  });
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setForm((p) => ({ ...p, logo: f }));
    if (f) {
      const url = URL.createObjectURL(f);
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }
  };

  const valid = form.name.trim() && form.email.includes("@") && form.password.length >= 6 && form.type;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      navigate(`/verify-email/${encodeURIComponent(form.email)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-blue-600 font-extrabold text-lg">Timetable Scheduler</div>
        </div>
      </header>

      <section className="relative">
        <div
          className="h-[46vh] bg-center bg-cover flex items-center"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.82), rgba(255,255,255,0.82)), url('/images/hero1.jpg')",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-blue-600 leading-tight">
              The Smarter Way To Create Timetables
            </h1>
            <p className="mt-4 text-blue-500 max-w-2xl mx-auto">
              Automated, AI-powered, conflict-free timetabling for universities and colleges.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <a
                href="#register-form"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-full font-semibold shadow"
              >
                Get Started
              </a>
              <a
                href="#features"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-full font-semibold shadow"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 -mt-16">
          <div id="register-form" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xl font-bold text-blue-600">Create Organisation</div>
                  <div className="text-sm text-blue-400">Register to access the timetable automation suite</div>
                </div>
                <div className="text-sm text-slate-500">Secure · Fast · AI</div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 text-blue-400 h-5" />
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Organisation Name"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-blue-400 h-5" />
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    type="email"
                    placeholder="Organisation Email"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-blue-400 h-5" />
                  <input
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    type="password"
                    placeholder="Password (min 6 chars)"
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-100 outline-none"
                    required
                  />
                </div>

                <div className="relative">
                  <Building2 className="absolute left-3 top-3 text-blue-400 h-5" />
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange as any}
                    className="w-full pl-11 pr-4 py-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
                    required
                  >
                    <option value="">Select organisation type</option>
                    <option value="school">School</option>
                    <option value="university">University</option>
                    <option value="coaching">Coaching Institute</option>
                    <option value="college">College</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input ref={fileRef as any} type="file" accept="image/*" onChange={handleFile} className="hidden" />
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="w-full cursor-pointer rounded-lg border border-dashed border-blue-200 p-3 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-600">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <div className="text-sm text-slate-600">Upload organisation logo (optional)</div>
                    </div>
                  </div>

                  <div className="w-20 h-20 rounded-md bg-blue-50 flex items-center justify-center border border-blue-100">
                    {logoPreview ? (
                      <img src={logoPreview} alt="logo" className="object-contain h-full w-full rounded-md" />
                    ) : (
                      <div className="text-blue-400">Preview</div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!valid || loading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
                >
                  {loading ? "Creating…" : "Create Organisation"}
                </button>

                <div className="text-center text-sm text-slate-500">
                  Already have an account? <a href="/login" className="text-blue-600 font-medium">Login</a>
                </div>
              </div>
            </form>

            <aside className="rounded-2xl p-6 bg-blue-50 border border-blue-100 flex flex-col justify-between">
              <div>
                <div className="text-blue-600 font-semibold mb-2">Why choose Timetable Scheduler</div>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li>Fast AI-based timetable generation</li>
                  <li>Conflict-free scheduling and resource optimization</li>
                  <li>Role-based access for admins, faculty and students</li>
                  <li>Export timetables to PDF/CSV and share instantly</li>
                </ul>
              </div>

              <div className="mt-6">
                <div className="text-xs text-slate-500 mb-3">Trusted by</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="p-2 bg-white rounded-md shadow-sm"><img src="/images/logo1.png" alt="logo1" className="h-8" /></div>
                  <div className="p-2 bg-white rounded-md shadow-sm"><img src="/images/logo2.png" alt="logo2" className="h-8" /></div>
                  <div className="p-2 bg-white rounded-md shadow-sm"><img src="/images/logo3.png" alt="logo3" className="h-8" /></div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-blue-100">
            <div className="text-blue-600 font-semibold">Fast & Reliable</div>
            <div className="text-sm text-slate-500 mt-2">Generate full term timetables in minutes.</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-blue-100">
            <div className="text-blue-600 font-semibold">Collaboration</div>
            <div className="text-sm text-slate-500 mt-2">Share schedules with faculty and students.</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-blue-100">
            <div className="text-blue-600 font-semibold">Smart Scheduling</div>
            <div className="text-sm text-slate-500 mt-2">Conflict detection and automatic fixes.</div>
          </div>
          <div className="bg-white rounded-xl p-6 border border-blue-100">
            <div className="text-blue-600 font-semibold">Resource Manager</div>
            <div className="text-sm text-slate-500 mt-2">Rooms, labs and equipment management.</div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-slate-500 text-center">
          © {new Date().getFullYear()} Timetable Scheduler
        </div>
      </footer>
    </div>
  );
};

export default OrganisationRegister;
