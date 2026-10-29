import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { useHasPermission } from "../../rbac/hooks/usePermissions";
import { PerformanceService } from "../services/performanceService";
import { AcademicCalendarService } from "../../calendar/services/academicCalendarService";
import { EmployeeService } from "../../employees/services/employeeService";
import type { PerformanceReview, TrainingProgram, AcademicSession, Employee } from "@hrms/middleware";
import { 
  Award, 
  BookOpen, 
  Star, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  User, 
  GraduationCap 
} from "lucide-react";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { EmptyState } from "../../../components/ui/EmptyState";
import { getFriendlyErrorMessage } from "../../../lib/errors";

export function PerformancePage() {
  const { profile, user } = useAuth();
  const tenantId = profile?.activeTenantId || "";
  const hasPerm = useHasPermission();
  const canManage = hasPerm("performance.manage");

  const [activeTab, setActiveTab] = useState<"reviews" | "training">("reviews");
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Appraisal Modal
  const [appraisalModalOpen, setAppraisalModalOpen] = useState<boolean>(false);
  const [formEmpId, setFormEmpId] = useState<string>("");
  const [formSessionId, setFormSessionId] = useState<string>("");
  const [formPeriod, setFormPeriod] = useState<string>("Annual Academic Appraisal 2026-27");

  // Scoring / Review Modal
  const [evaluatingReview, setEvaluatingReview] = useState<PerformanceReview | null>(null);
  const [teachingRating, setTeachingRating] = useState<number>(4);
  const [institutionalRating, setInstitutionalRating] = useState<number>(4);
  const [developmentRating, setDevelopmentRating] = useState<number>(4);
  const [reviewerComments, setReviewerComments] = useState<string>("");

  // Training Program Modal
  const [trainingModalOpen, setTrainingModalOpen] = useState<boolean>(false);
  const [trainTitle, setTrainTitle] = useState<string>("");
  const [trainCat, setTrainCat] = useState<TrainingProgram["category"]>("faculty_development");
  const [trainInstructor, setTrainInstructor] = useState<string>("");
  const [trainStart, setTrainStart] = useState<string>("2026-11-01");
  const [trainEnd, setTrainEnd] = useState<string>("2026-11-03");
  const [trainHours, setTrainHours] = useState<number>(16);
  const [trainLocation, setTrainLocation] = useState<string>("Main Auditorium / Online");
  const [trainDesc, setTrainDesc] = useState<string>("");

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [revs, trains, sessList, empList] = await Promise.all([
        PerformanceService.getReviews(tenantId),
        PerformanceService.getTrainingPrograms(tenantId),
        AcademicCalendarService.getAcademicSessions(tenantId),
        EmployeeService.getEmployees(tenantId),
      ]);
      setReviews(revs);
      setTrainingPrograms(trains);
      setSessions(sessList);
      setEmployees(empList);
      if (sessList[0]) setFormSessionId(sessList[0].id);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Initiate new review cycle
  const handleInitiateAppraisal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user || !formEmpId) return;
    const emp = employees.find((x) => x.id === formEmpId);
    if (!emp) return;

    try {
      await PerformanceService.createReview(
        tenantId,
        {
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          reviewPeriod: formPeriod,
          academicSessionId: formSessionId,
          status: "manager_review",
        },
        { uid: user.uid, email: user.email || "" }
      );
      setAppraisalModalOpen(false);
      await loadData();
      alert("Appraisal cycle created for " + emp.firstName);
    } catch (err) {
      alert("Error initiating review: " + getFriendlyErrorMessage(err));
    }
  };

  // Submit Evaluation
  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user || !evaluatingReview) return;

    // Weighted composite score (out of 100):
    // Teaching 50%, Institutional 25%, Professional Dev 25%
    const score = Math.round(
      (teachingRating / 5) * 50 +
      (institutionalRating / 5) * 25 +
      (developmentRating / 5) * 25
    );

    try {
      await PerformanceService.updateReview(
        tenantId,
        evaluatingReview.id,
        {
          teachingEffectivenessRating: teachingRating,
          institutionalContributionsRating: institutionalRating,
          professionalDevelopmentRating: developmentRating,
          reviewerRating: Math.round((teachingRating + institutionalRating + developmentRating) / 3),
          reviewerComments,
          reviewerId: user.uid,
          reviewerName: profile?.displayName || user.email || "HOD / Principal",
          finalScore: score,
          status: "completed",
          completedAt: Date.now(),
        },
        { uid: user.uid, email: user.email || "" }
      );

      setEvaluatingReview(null);
      await loadData();
      alert(`Appraisal evaluation completed. Final Score: ${score}/100`);
    } catch (err) {
      alert("Error updating evaluation: " + getFriendlyErrorMessage(err));
    }
  };

  // Create training program
  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !user) return;
    try {
      await PerformanceService.createTrainingProgram(
        tenantId,
        {
          title: trainTitle,
          category: trainCat,
          instructorOrOrg: trainInstructor,
          startDate: trainStart,
          endDate: trainEnd,
          durationHours: trainHours,
          locationOrUrl: trainLocation,
          description: trainDesc,
        },
        { uid: user.uid, email: user.email || "" }
      );
      setTrainingModalOpen(false);
      setTrainTitle("");
      setTrainInstructor("");
      setTrainDesc("");
      await loadData();
      alert("Faculty Development Program created.");
    } catch (err) {
      alert("Error creating program: " + getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="text-blue-600" size={26} />
            Faculty Appraisals & Professional Development
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Conduct multi-criteria teaching evaluations, syllabus delivery assessments, and Faculty Development Programs (FDP).
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            {activeTab === "reviews" ? (
              <button
                onClick={() => setAppraisalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
              >
                <Plus size={16} />
                Initiate Appraisal Cycle
              </button>
            ) : (
              <button
                onClick={() => setTrainingModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
              >
                <Plus size={16} />
                New Faculty Workshop (FDP)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition-colors ${
              activeTab === "reviews"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Faculty Appraisal Reviews
          </button>
          <button
            onClick={() => setActiveTab("training")}
            className={`px-3.5 py-1.5 text-sm font-medium rounded-xl transition-colors ${
              activeTab === "training"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Faculty Workshops & Certifications (FDP)
          </button>
        </div>

        {/* Tab 1: Reviews */}
        {activeTab === "reviews" && (
          <div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <ErrorState title="Failed to load appraisals" description={error} onRetry={loadData} />
            ) : reviews.length === 0 ? (
              <EmptyState
                icon={<Award className="text-slate-300" size={40} />}
                title="No faculty appraisal reviews found"
                description="Click 'Initiate Appraisal Cycle' to start evaluating teaching performance."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Faculty Member</th>
                      <th className="py-3 px-4">Review Period</th>
                      <th className="py-3 px-4">Teaching Effectiveness</th>
                      <th className="py-3 px-4">Institutional Duties</th>
                      <th className="py-3 px-4">Final Score</th>
                      <th className="py-3 px-4">Status</th>
                      {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviews.map((rev) => (
                      <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {rev.employeeName}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {rev.reviewPeriod}
                        </td>
                        <td className="py-3 px-4">
                          {rev.teachingEffectivenessRating ? (
                            <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                              <Star size={13} fill="currentColor" />
                              <span>{rev.teachingEffectivenessRating} / 5</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {rev.institutionalContributionsRating ? (
                            <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                              <Star size={13} fill="currentColor" />
                              <span>{rev.institutionalContributionsRating} / 5</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {rev.finalScore !== undefined ? (
                            <span className="font-bold font-mono text-emerald-700 text-sm">
                              {rev.finalScore} / 100
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              rev.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {rev.status.replace("_", " ").toUpperCase()}
                          </span>
                        </td>
                        {canManage && (
                          <td className="py-3 px-4 text-right">
                            {rev.status !== "completed" ? (
                              <button
                                onClick={() => {
                                  setEvaluatingReview(rev);
                                  setTeachingRating(rev.teachingEffectivenessRating || 4);
                                  setInstitutionalRating(rev.institutionalContributionsRating || 4);
                                  setDevelopmentRating(rev.professionalDevelopmentRating || 4);
                                  setReviewerComments(rev.reviewerComments || "");
                                }}
                                className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                Evaluate
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">Evaluated</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Training & FDP */}
        {activeTab === "training" && (
          <div>
            {trainingPrograms.length === 0 ? (
              <EmptyState
                icon={<GraduationCap className="text-slate-300" size={40} />}
                title="No faculty development programs recorded"
                description="Create workshops, pedagogical trainings, and staff development programs to foster institutional growth."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trainingPrograms.map((prog) => (
                  <div
                    key={prog.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-white shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
                          {prog.category.replace("_", " ")}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {prog.durationHours} Hours
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-2">
                        {prog.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {prog.description}
                      </p>
                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <div>Instructor / Agency: <strong>{prog.instructorOrOrg}</strong></div>
                        <div>Venue: {prog.locationOrUrl}</div>
                        <div className="text-slate-400">
                          Dates: {prog.startDate} to {prog.endDate}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Initiate Appraisal Modal */}
      {appraisalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleInitiateAppraisal}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100"
          >
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="text-blue-600" size={20} />
              Initiate Faculty Appraisal
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Start an appraisal cycle to evaluate a faculty member against academic benchmarks.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Faculty Member</label>
                <select
                  required
                  value={formEmpId}
                  onChange={(e) => setFormEmpId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Faculty --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.facultyGrade || e.jobTitle || "Faculty"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Review Period</label>
                <input
                  type="text"
                  required
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Academic Session</label>
                <select
                  value={formSessionId}
                  onChange={(e) => setFormSessionId(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAppraisalModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Create Cycle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evaluate Appraisal Rubric Modal */}
      {evaluatingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSubmitEvaluation}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Star className="text-amber-500" size={20} />
              Evaluate Faculty Performance
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Evaluating: <strong>{evaluatingReview.employeeName}</strong> ({evaluatingReview.reviewPeriod})
            </p>

            <div className="mt-4 space-y-4">
              {/* Teaching Effectiveness */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-800">
                    1. Teaching Effectiveness & Course Delivery (50%)
                  </span>
                  <span className="text-xs font-bold text-blue-600 font-mono">
                    {teachingRating} / 5 Stars
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={teachingRating}
                  onChange={(e) => setTeachingRating(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Institutional Contributions */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-800">
                    2. Institutional Governance & Exam Duties (25%)
                  </span>
                  <span className="text-xs font-bold text-blue-600 font-mono">
                    {institutionalRating} / 5 Stars
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={institutionalRating}
                  onChange={(e) => setInstitutionalRating(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Professional Development */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-800">
                    3. Research & Publications (25%)
                  </span>
                  <span className="text-xs font-bold text-blue-600 font-mono">
                    {developmentRating} / 5 Stars
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={developmentRating}
                  onChange={(e) => setDevelopmentRating(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reviewer Commendations / Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Commendations on pedagogy, lab supervision, student feedback..."
                  value={reviewerComments}
                  onChange={(e) => setReviewerComments(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEvaluatingReview(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Submit & Finalize Score
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Training Program Modal */}
      {trainingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateTraining}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="text-blue-600" size={20} />
              New Faculty Development Program (FDP)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add a workshop or training course for teaching and technical staff.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Program Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Assisted Pedagogy & STEM Curriculum Design"
                  value={trainTitle}
                  onChange={(e) => setTrainTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={trainCat}
                    onChange={(e) => setTrainCat(e.target.value as TrainingProgram["category"])}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  >
                    <option value="faculty_development">Faculty Development</option>
                    <option value="pedagogy">Pedagogy / Teaching</option>
                    <option value="technical">Technical / Lab</option>
                    <option value="administrative">Administrative</option>
                    <option value="compliance">Compliance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={trainHours}
                    onChange={(e) => setTrainHours(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Instructor / Host Institution</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Institute of Technical Teachers Training"
                  value={trainInstructor}
                  onChange={(e) => setTrainInstructor(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={trainStart}
                    onChange={(e) => setTrainStart(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={trainEnd}
                    onChange={(e) => setTrainEnd(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Venue / Online URL</label>
                <input
                  type="text"
                  value={trainLocation}
                  onChange={(e) => setTrainLocation(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={trainDesc}
                  onChange={(e) => setTrainDesc(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl p-2.5 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setTrainingModalOpen(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Create Program
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
