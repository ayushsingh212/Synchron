import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, ArrowRight } from "lucide-react";

export default function TimetableApprovalNotice({
  status = "pending",
  timetableName = "Spring Semester Timetable",
  submittedAt = new Date().toLocaleString(),
  onGoToTimetable = () => {},
}) {
  const isApproved = status === "approved";

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-md border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
          <Clock className="w-7 h-7 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-800">Timetable sent for approval</h2>
          <p className="mt-1 text-sm text-slate-500">{timetableName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Submitted</p>
          <p className="text-sm font-medium text-slate-600">{submittedAt}</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.08 }}
        className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="col-span-2 flex flex-col gap-3">
          <div className="rounded-xl p-4 bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isApproved ? 'bg-blue-600' : 'bg-yellow-400'} shadow-sm`} />
                <div>
                  <p className="text-sm text-slate-600">Current status</p>
                  <p className={`font-semibold ${isApproved ? 'text-blue-700' : 'text-yellow-700'}`}>
                    {isApproved ? 'Approved' : 'Pending approval'}
                  </p>
                </div>
              </div>
              {isApproved ? (
                <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-blue-100">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-700 font-medium">Live</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-yellow-100">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs text-yellow-700 font-medium">Awaiting</span>
                </div>
              )}
            </div>

            <div className="mt-4 text-sm text-slate-600">Your timetable has been submitted to the scheduling committee. You can view it in the Timetable tab. We will notify you once it's reviewed.</div>
          </div>

          <div className="rounded-xl p-4 bg-white border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">What happens next</p>
                <ul className="mt-2 text-sm text-slate-500 list-disc ml-5 space-y-1">
                  <li>Committee reviews the timetable for clashes and approvals.</li>
                  <li>If changes are required you'll be notified with suggested edits.</li>
                  <li>Once approved the timetable is published under the Timetable tab.</li>
                </ul>
              </div>
              <div className="hidden md:block text-sm text-slate-400">Estimated review: 1-3 days</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-2xl p-4 bg-gradient-to-b from-white to-blue-50 border border-blue-100">
            <p className="text-xs text-slate-400">Quick actions</p>
            <div className="mt-3 flex flex-col gap-2">
              <button onClick={onGoToTimetable} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium shadow-sm border border-blue-200 bg-white hover:bg-blue-50">
                <span>Go to Timetable tab</span>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </button>

              <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium border border-transparent bg-blue-600 text-white hover:bg-blue-700">
                <span>{isApproved ? 'View published timetable' : 'Edit submission'}</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl p-4 bg-white border border-gray-100 flex items-center gap-3 justify-between">
            <div>
              <p className="text-xs text-slate-400">Notifications</p>
              <p className="text-sm text-slate-600">You will receive an email and an in-app alert when status changes.</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-700">{isApproved ? 'Approved' : 'Pending'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-slate-500">Need to make changes? Edit your timetable from the Timetable tab before approval.</div>
        <div className="flex items-center gap-3">
          <button onClick={onGoToTimetable} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-transparent bg-blue-600 text-white font-medium hover:bg-blue-700">
            Open Timetable
n          </button>
        </div>
      </div>
    </div>
  );
}
