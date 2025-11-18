import React from "react";

const About: React.FC = () => {
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="prose max-w-none mx-auto text-center">
        <h1>About Timetable Scheduler</h1>
        <p>
          Timetable Scheduler is an AI-enhanced platform to create and manage
          academic timetables for universities and colleges. It offers
          scheduling automation, resource management, and role-based access for
          organisation administrators.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <article className="bg-white rounded-lg p-6 card-shadow">
          <h3 className="font-semibold mb-2">Mission</h3>
          <p className="text-slate-600">Save time, reduce conflicts, and make scheduling painless.</p>
        </article>

        <article className="bg-white rounded-lg p-6 card-shadow">
          <h3 className="font-semibold mb-2">Vision</h3>
          <p className="text-slate-600">A unified scheduling platform for institutions worldwide.</p>
        </article>

        <article className="bg-white rounded-lg p-6 card-shadow">
          <h3 className="font-semibold mb-2">Security</h3>
          <p className="text-slate-600">We follow secure practices; production apps should enforce CSP & TLS.</p>
        </article>
      </div>
    </section>
  );
};

export default About;
