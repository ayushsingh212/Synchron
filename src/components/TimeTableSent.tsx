import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, ArrowRight } from "lucide-react";

type Status = "pending" | "approved";

interface TimetableApprovalNoticeProps {
  status?: Status;
  timetableName?: string;
  submittedAt?: string;
  onGoToTimetable?: () => void;
  onEdit?: () => void;
  onView?: () => void;
}

const STATUS_CONFIG = {
  approved: {
    label: "Approved",
    color: "blue",
    badge: "Live",
    Icon: CheckCircle,
  },
  pending: {
    label: "Pending approval",
    color: "yellow",
    badge: "Awaiting",
    Icon: Clock,
  },
} as const;

export default function TimetableApprovalNotice({
  status = "pending",
  timetableName = "Spring Semester Timetable",
  submittedAt = new Date().toLocaleString(),
  onGoToTimetable,
  onEdit,
  onView,
}: TimetableApprovalNoticeProps) {
  const config = useMemo(() => STATUS_CONFIG[status], [status]);

  const isApproved = status === "approved";
  const StatusIcon = config.Icon;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-2xl shadow-md border border-gray-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100">
          <Clock className="w-7 h-7 text-blue-600" />
        </div>

        <div className="flex-1 min-w-[200px]">
          <h2 className="text-lg font-semibold text-slate-800">
            Timetable sent for approval
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {timetableName}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-400">Submitted</p>
          <p className="text-sm font-medium text-slate-600">
            {submittedAt}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Left Section */}
        <div className="col-span-2 flex flex-col gap-4">
          
          {/* Status Card */}
          <div className="rounded-xl p-4 bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">
                <span
                  className={`w-3 h-3 rounded-full bg-${config.color}-500`}
                />

                <div>
                  <p className="text-sm text-slate-600">
                    Current status
                  </p>

                  <p
                    className={`font-semibold text-${config.color}-700`}
                  >
                    {config.label}
                  </p>
                </div>
              </div>

              <div
                className={`inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-${config.color}-100`}
              >
                <StatusIcon
                  className={`w-4 h-4 text-${config.color}-600`}
                />
                <span
                  className={`text-xs text-${config.color}-700 font-medium`}
                >
                  {config.badge}
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Your timetable has been submitted to the scheduling committee.
              You can view it in the Timetable tab. We will notify you once it's
              reviewed.
            </p>
          </div>

          {/* Info Card */}
          <div className="rounded-xl p-4 bg-white border border-gray-100">
            <p className="text-sm text-slate-600">
              What happens next
            </p>

            <ul className="mt-2 text-sm text-slate-500 list-disc ml-5 space-y-1">
              <li>Committee reviews for clashes and approvals.</li>
              <li>Revision requests will be sent if needed.</li>
              <li>Approved timetables are published.</li>
            </ul>

            <p className="mt-3 text-sm text-slate-400 hidden md:block">
              Estimated review: 1–3 days
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-col gap-4">
          
          {/* Actions */}
          <div className="rounded-2xl p-4 bg-gradient-to-b from-white to-blue-50 border border-blue-100">
            <p className="text-xs text-slate-400">
              Quick actions
            </p>

            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={onGoToTimetable}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium border border-blue-200 bg-white hover:bg-blue-50"
              >
                Go to Timetable
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </button>

              <button
                onClick={isApproved ? onView : onEdit}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                {isApproved
                  ? "View Published"
                  : "Edit Submission"}
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-xl p-4 bg-white border border-gray-100 flex justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400">
                Notifications
              </p>
              <p className="text-sm text-slate-600">
                Email & in-app alerts enabled.
              </p>
            </div>

            <p className="text-sm font-semibold text-slate-700">
              {config.label}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          You can edit your timetable before approval.
        </p>

        <button
          onClick={onGoToTimetable}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          Open Timetable
        </button>
      </div>
    </div>
  );
        }
